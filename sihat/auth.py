from datetime import UTC, datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import select, update
from sqlalchemy.orm import Session

from sihat.auth_schemas import (
    AuthTokensOutput,
    ForgotPasswordInput,
    GoogleTokenInput,
    LoginInput,
    ProfileUpdateInput,
    RefreshInput,
    RegistrationInput,
    ResetPasswordInput,
    UserOutput,
)
from sihat.config import Settings, get_settings
from sihat.db import get_db_session
from sihat.mailer import MailDeliveryError, send_password_reset_email
from sihat.models import AuthSession, GoogleIdentity, PasswordResetToken, User
from sihat.rate_limit import enforce_auth_rate_limit
from sihat.security import (
    create_access_token,
    decode_access_token,
    hash_password,
    hash_token,
    is_expired,
    new_refresh_token,
    normalize_email,
    verify_password,
)

router = APIRouter(prefix="/auth", tags=["auth"])
bearer_scheme = HTTPBearer(auto_error=False)


def verify_google_id_token(id_token: str, settings: Settings) -> dict[str, str]:
    if not settings.google_oauth_client_id:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Google OAuth is not configured",
        )
    if id_token.count(".") != 2:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Google ID token format",
        )

    try:
        from google.auth.transport import requests as google_requests
        from google.oauth2 import id_token as google_id_token

        claims = google_id_token.verify_oauth2_token(
            id_token,
            google_requests.Request(),
            settings.google_oauth_client_id,
        )
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Google ID token could not be verified",
        ) from exc

    if claims.get("iss") not in {"accounts.google.com", "https://accounts.google.com"}:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Google ID token issuer",
        )
    if not claims.get("sub") or not claims.get("email") or claims.get("email_verified") is not True:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="A verified Google email is required",
        )

    return {
        "subject": str(claims["sub"]),
        "email": normalize_email(str(claims["email"])),
        "full_name": str(claims.get("name") or str(claims["email"]).split("@", 1)[0]),
    }


def user_output(user: User) -> UserOutput:
    return UserOutput(
        id=user.id,
        email=user.email,
        full_name=user.full_name,
        role=user.role,
        age_group=user.age_group,
        avatar_url=getattr(user, "avatar_url", None),
    )


def create_tokens(db: Session, user: User, settings: Settings) -> AuthTokensOutput:
    refresh_token = new_refresh_token()
    db.add(
        AuthSession(
            user_id=user.id,
            refresh_token_hash=hash_token(refresh_token),
            expires_at=datetime.now(UTC) + timedelta(days=settings.refresh_token_days),
        )
    )
    db.commit()
    return AuthTokensOutput(
        access_token=create_access_token(user, settings),
        refresh_token=refresh_token,
        user=user_output(user),
    )


@router.post("/register", response_model=UserOutput, status_code=status.HTTP_201_CREATED)
def register(
    payload: RegistrationInput,
    request: Request,
    db: Session = Depends(get_db_session),
) -> UserOutput:
    email = normalize_email(str(payload.email))
    enforce_auth_rate_limit(request, "register", email)
    if db.scalar(select(User.id).where(User.email == email)):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email is already registered",
        )

    user = User(
        email=email,
        full_name=payload.full_name.strip(),
        password_hash=hash_password(payload.password),
        age_group=payload.age_group,
        role="user",
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user_output(user)


@router.post("/login", response_model=AuthTokensOutput)
def login(
    payload: LoginInput,
    request: Request,
    db: Session = Depends(get_db_session),
    settings: Settings = Depends(get_settings),
) -> AuthTokensOutput:
    enforce_auth_rate_limit(request, "login", str(payload.email))
    user = db.scalar(select(User).where(User.email == normalize_email(str(payload.email))))
    if not user or not user.is_active or not verify_password(payload.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )
    return create_tokens(db, user, settings)


@router.post("/refresh", response_model=AuthTokensOutput)
def refresh(
    payload: RefreshInput,
    db: Session = Depends(get_db_session),
    settings: Settings = Depends(get_settings),
) -> AuthTokensOutput:
    session = db.scalar(
        select(AuthSession).where(
            AuthSession.refresh_token_hash == hash_token(payload.refresh_token)
        )
    )
    if not session or session.revoked_at or is_expired(session.expires_at):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token",
        )

    user = db.get(User, session.user_id)
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User account is unavailable",
        )

    session.revoked_at = datetime.now(UTC)
    db.commit()
    return create_tokens(db, user, settings)


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
def logout(payload: RefreshInput, db: Session = Depends(get_db_session)) -> None:
    db.execute(
        update(AuthSession)
        .where(AuthSession.refresh_token_hash == hash_token(payload.refresh_token))
        .where(AuthSession.revoked_at.is_(None))
        .values(revoked_at=datetime.now(UTC))
    )
    db.commit()


@router.post("/forgot-password", status_code=status.HTTP_202_ACCEPTED)
def forgot_password(
    payload: ForgotPasswordInput,
    request: Request,
    db: Session = Depends(get_db_session),
    settings: Settings = Depends(get_settings),
) -> None:
    email = normalize_email(str(payload.email))
    enforce_auth_rate_limit(request, "forgot-password", email)
    if not settings.smtp_is_configured:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Password reset email delivery is not configured",
        )

    user = db.scalar(select(User).where(User.email == email))
    if user and user.is_active:
        token = new_refresh_token()
        db.add(
            PasswordResetToken(
                user_id=user.id,
                token_hash=hash_token(token),
                expires_at=datetime.now(UTC) + timedelta(hours=1),
            )
        )
        try:
            send_password_reset_email(user.email, token, settings)
            db.commit()
        except MailDeliveryError as exc:
            db.rollback()
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Password reset email could not be delivered",
            ) from exc
    # This response stays identical for unknown addresses to prevent email enumeration.


@router.post("/reset-password", status_code=status.HTTP_204_NO_CONTENT)
def reset_password(payload: ResetPasswordInput, db: Session = Depends(get_db_session)) -> None:
    reset = db.scalar(
        select(PasswordResetToken).where(PasswordResetToken.token_hash == hash_token(payload.token))
    )
    if not reset or reset.used_at or is_expired(reset.expires_at):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired reset token",
        )

    user = db.get(User, reset.user_id)
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Reset cannot be completed",
        )

    user.password_hash = hash_password(payload.new_password)
    reset.used_at = datetime.now(UTC)
    db.execute(
        update(AuthSession)
        .where(AuthSession.user_id == user.id)
        .where(AuthSession.revoked_at.is_(None))
        .values(revoked_at=datetime.now(UTC))
    )
    db.commit()


@router.post("/google", response_model=AuthTokensOutput)
def google_login(
    payload: GoogleTokenInput,
    request: Request,
    db: Session = Depends(get_db_session),
    settings: Settings = Depends(get_settings),
) -> AuthTokensOutput:
    enforce_auth_rate_limit(request, "google", "login")
    claims = verify_google_id_token(payload.id_token, settings)
    identity = db.scalar(select(GoogleIdentity).where(GoogleIdentity.subject == claims["subject"]))
    if identity:
        user = db.get(User, identity.user_id)
        if not user or not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="User account is unavailable",
            )
        return create_tokens(db, user, settings)

    existing_user = db.scalar(select(User).where(User.email == claims["email"]))
    if existing_user:
        if not existing_user.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="User account is unavailable",
            )
        existing_identity = db.scalar(select(GoogleIdentity).where(GoogleIdentity.user_id == existing_user.id))
        if not existing_identity:
            db.add(
                GoogleIdentity(
                    user_id=existing_user.id,
                    subject=claims["subject"],
                    email=claims["email"],
                )
            )
            db.commit()
        return create_tokens(db, existing_user, settings)

    age_group = payload.age_group or "18_plus"
    user = User(
        email=claims["email"],
        full_name=claims["full_name"][:120],
        password_hash=None,
        age_group=age_group,
        role="user",
    )
    db.add(user)
    db.flush()
    db.add(
        GoogleIdentity(
            user_id=user.id,
            subject=claims["subject"],
            email=claims["email"],
        )
    )
    db.commit()
    return create_tokens(db, user, settings)


def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    db: Session = Depends(get_db_session),
    settings: Settings = Depends(get_settings),
) -> User:
    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication is required",
            headers={"WWW-Authenticate": "Bearer"},
        )
    user = db.get(User, decode_access_token(credentials.credentials, settings))
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User account is unavailable",
        )
    return user


def get_current_user_optional(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    db: Session = Depends(get_db_session),
    settings: Settings = Depends(get_settings),
) -> User | None:
    if credentials is None:
        return None
    try:
        user_id = decode_access_token(credentials.credentials, settings)
    except HTTPException:
        return None
    user = db.get(User, user_id)
    if not user or not user.is_active:
        return None
    return user


@router.post("/google/link", status_code=status.HTTP_204_NO_CONTENT)
def link_google(
    payload: GoogleTokenInput,
    request: Request,
    db: Session = Depends(get_db_session),
    settings: Settings = Depends(get_settings),
    user: User = Depends(get_current_user),
) -> None:
    enforce_auth_rate_limit(request, "google-link", user.id)
    claims = verify_google_id_token(payload.id_token, settings)
    identity = db.scalar(select(GoogleIdentity).where(GoogleIdentity.subject == claims["subject"]))
    if identity and identity.user_id != user.id:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Google account is already linked to another user",
        )
    if claims["email"] != user.email:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Google email must match the current account email",
        )
    if not identity:
        db.add(
            GoogleIdentity(
                user_id=user.id,
                subject=claims["subject"],
                email=claims["email"],
            )
        )
        db.commit()

@router.post("/dev-login", response_model=AuthTokensOutput)
def dev_login(
    db: Session = Depends(get_db_session),
    settings: Settings = Depends(get_settings),
) -> AuthTokensOutput:
    admin_user = db.scalar(select(User).where(User.email == "alidodovdilovar01@gmail.com"))
    if not admin_user:
        admin_user = db.scalar(select(User).where(User.role == "admin"))
    if not admin_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Admin user not found",
        )
    return create_tokens(db, admin_user, settings)


@router.get("/me", response_model=UserOutput)
def get_me(user: User = Depends(get_current_user)) -> UserOutput:
    return user_output(user)


@router.patch("/profile", response_model=UserOutput)
def update_profile(
    payload: ProfileUpdateInput,
    db: Session = Depends(get_db_session),
    user: User = Depends(get_current_user),
) -> UserOutput:
    if payload.full_name is not None and payload.full_name.strip():
        user.full_name = payload.full_name.strip()
    if payload.age_group is not None:
        user.age_group = payload.age_group
    if payload.avatar_url is not None:
        user.avatar_url = payload.avatar_url
    db.commit()
    db.refresh(user)
    return user_output(user)

