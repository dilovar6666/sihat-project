from datetime import UTC, datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import select, update
from sqlalchemy.orm import Session

from sihat.auth_schemas import (
    AuthTokensOutput,
    ForgotPasswordInput,
    GoogleTokenInput,
    LoginInput,
    RefreshInput,
    RegistrationInput,
    ResetPasswordInput,
    UserOutput,
)
from sihat.config import Settings, get_settings
from sihat.db import get_db_session
from sihat.models import AuthSession, GoogleIdentity, PasswordResetToken, User
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
def register(payload: RegistrationInput, db: Session = Depends(get_db_session)) -> UserOutput:
    email = normalize_email(str(payload.email))
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
    db: Session = Depends(get_db_session),
    settings: Settings = Depends(get_settings),
) -> AuthTokensOutput:
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
def forgot_password(payload: ForgotPasswordInput, db: Session = Depends(get_db_session)) -> None:
    user = db.scalar(select(User).where(User.email == normalize_email(str(payload.email))))
    if user and user.is_active:
        token = new_refresh_token()
        db.add(
            PasswordResetToken(
                user_id=user.id,
                token_hash=hash_token(token),
                expires_at=datetime.now(UTC) + timedelta(hours=1),
            )
        )
        db.commit()
    # The same response prevents email enumeration. Mail delivery is configured later;
    # reset tokens are never returned or logged here.


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
    db: Session = Depends(get_db_session),
    settings: Settings = Depends(get_settings),
) -> AuthTokensOutput:
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
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email is already registered; sign in with your password before linking Google",
        )
    if not payload.age_group:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="age_group is required when creating an account with Google",
        )

    user = User(
        email=claims["email"],
        full_name=claims["full_name"][:120],
        password_hash=None,
        age_group=payload.age_group,
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


@router.post("/google/link", status_code=status.HTTP_204_NO_CONTENT)
def link_google(
    payload: GoogleTokenInput,
    db: Session = Depends(get_db_session),
    settings: Settings = Depends(get_settings),
    user: User = Depends(get_current_user),
) -> None:
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
