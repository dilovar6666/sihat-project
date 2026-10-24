from collections.abc import Generator
from datetime import UTC, datetime, timedelta

import pytest
from fastapi import HTTPException
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, select
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

from sihat import auth
from sihat.config import Settings, get_settings
from sihat.db import Base, get_db_session
from sihat.main import app
from sihat.models import GoogleIdentity, PasswordResetToken, User
from sihat.rate_limit import clear_auth_rate_limits
from sihat.security import hash_password, hash_token


@pytest.fixture
def client() -> Generator[TestClient, None, None]:
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(engine)
    testing_session = sessionmaker(bind=engine, autocommit=False, autoflush=False)

    def override_db_session() -> Generator[Session, None, None]:
        with testing_session() as session:
            yield session

    test_settings = Settings(
        jwt_secret="test-only-jwt-secret-with-more-than-thirty-two-characters",
        smtp_host="smtp.test",
        smtp_username="test-user",
        smtp_password="test-password",
        smtp_from_email="noreply@test.invalid",
        google_oauth_client_id=None,
    )
    app.dependency_overrides[get_db_session] = override_db_session
    app.dependency_overrides[get_settings] = lambda: test_settings
    clear_auth_rate_limits()
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()
    clear_auth_rate_limits()
    Base.metadata.drop_all(engine)
    engine.dispose()


def register(client: TestClient) -> dict[str, str]:
    response = client.post(
        "/auth/register",
        json={
            "full_name": "Test User",
            "email": "TEST@example.com",
            "password": "a-secure-password",
            "age_group": "18_plus",
        },
    )
    assert response.status_code == 201
    return response.json()


def test_register_login_refresh_logout_and_profile(client: TestClient) -> None:
    registered = register(client)
    assert registered["email"] == "test@example.com"
    assert registered["role"] == "user"

    assert (
        client.post(
            "/auth/register",
            json={
                "full_name": "Duplicate User",
                "email": "test@example.com",
                "password": "a-secure-password",
                "age_group": "18_plus",
            },
        ).status_code
        == 409
    )
    assert (
        client.post(
            "/auth/login",
            json={"email": "test@example.com", "password": "wrong-password"},
        ).status_code
        == 401
    )

    login = client.post(
        "/auth/login",
        json={"email": "test@example.com", "password": "a-secure-password"},
    )
    assert login.status_code == 200
    tokens = login.json()

    profile = client.get(
        "/me/profile",
        headers={"Authorization": f"Bearer {tokens['access_token']}"},
    )
    assert profile.status_code == 200
    assert profile.json()["id"] == registered["id"]

    refreshed = client.post("/auth/refresh", json={"refresh_token": tokens["refresh_token"]})
    assert refreshed.status_code == 200
    reused_refresh = client.post(
        "/auth/refresh",
        json={"refresh_token": tokens["refresh_token"]},
    )
    assert reused_refresh.status_code == 401

    logout = client.post(
        "/auth/logout",
        json={"refresh_token": refreshed.json()["refresh_token"]},
    )
    assert logout.status_code == 204
    assert (
        client.post(
            "/auth/refresh",
            json={"refresh_token": refreshed.json()["refresh_token"]},
        ).status_code
        == 401
    )


def test_password_reset_invalidates_existing_sessions(client: TestClient) -> None:
    registered = register(client)
    tokens = client.post(
        "/auth/login",
        json={"email": "test@example.com", "password": "a-secure-password"},
    ).json()

    reset_token = "r" * 64
    db_dependency = app.dependency_overrides[get_db_session]
    session_generator = db_dependency()
    session = next(session_generator)
    try:
        user = session.get(User, registered["id"])
        assert user is not None
        session.add(
            PasswordResetToken(
                user_id=user.id,
                token_hash=hash_token(reset_token),
                expires_at=datetime.now(UTC) + timedelta(hours=1),
            )
        )
        session.commit()
    finally:
        next(session_generator, None)

    reset = client.post(
        "/auth/reset-password",
        json={"token": reset_token, "new_password": "new-secure-password"},
    )
    assert reset.status_code == 204
    revoked_refresh = client.post(
        "/auth/refresh",
        json={"refresh_token": tokens["refresh_token"]},
    )
    assert revoked_refresh.status_code == 401
    assert (
        client.post(
            "/auth/login",
            json={"email": "test@example.com", "password": "new-secure-password"},
        ).status_code
        == 200
    )


def test_forgot_password_delivers_a_usable_token(
    client: TestClient,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    register(client)
    delivered_tokens: list[str] = []
    monkeypatch.setattr(
        auth,
        "send_password_reset_email",
        lambda _recipient, token, _settings: delivered_tokens.append(token),
    )

    response = client.post("/auth/forgot-password", json={"email": "test@example.com"})
    assert response.status_code == 202
    assert len(delivered_tokens) == 1

    reset = client.post(
        "/auth/reset-password",
        json={"token": delivered_tokens[0], "new_password": "new-secure-password"},
    )
    assert reset.status_code == 204
    assert (
        client.post(
            "/auth/login",
            json={"email": "test@example.com", "password": "new-secure-password"},
        ).status_code
        == 200
    )


def test_login_rate_limit_blocks_the_eleventh_attempt(client: TestClient) -> None:
    for _ in range(10):
        response = client.post(
            "/auth/login",
            json={"email": "missing@example.com", "password": "not-the-right-password"},
        )
        assert response.status_code == 401

    blocked = client.post(
        "/auth/login",
        json={"email": "missing@example.com", "password": "not-the-right-password"},
    )
    assert blocked.status_code == 429


def test_google_login_creates_and_reuses_a_verified_identity(
    client: TestClient,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    claims = {
        "subject": "google-subject-123",
        "email": "google.user@example.com",
        "full_name": "Google User",
    }
    monkeypatch.setattr(auth, "verify_google_id_token", lambda *_: claims)

    created = client.post(
        "/auth/google",
        json={"id_token": "a" * 32, "age_group": "18_plus"},
    )
    assert created.status_code == 200
    assert created.json()["user"]["email"] == claims["email"]

    reused = client.post("/auth/google", json={"id_token": "b" * 32})
    assert reused.status_code == 200
    assert reused.json()["user"]["id"] == created.json()["user"]["id"]


def test_google_login_requires_a_configured_client_id(client: TestClient) -> None:
    response = client.post(
        "/auth/google",
        json={"id_token": "a" * 32, "age_group": "18_plus"},
    )
    assert response.status_code == 503


def test_google_id_token_verification_requires_valid_google_claims(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    from google.oauth2 import id_token as google_id_token

    settings = Settings(google_oauth_client_id="test-client-id")
    monkeypatch.setattr(
        google_id_token,
        "verify_oauth2_token",
        lambda *_: {
            "sub": "google-subject-001",
            "email": "verified@example.com",
            "email_verified": True,
            "iss": "https://accounts.google.com",
            "name": "Verified User",
        },
    )
    claims = auth.verify_google_id_token("a.b.c", settings)
    assert claims["email"] == "verified@example.com"

    monkeypatch.setattr(
        google_id_token,
        "verify_oauth2_token",
        lambda *_: {
            "sub": "google-subject-001",
            "email": "verified@example.com",
            "email_verified": True,
            "iss": "https://invalid.example.com",
        },
    )
    with pytest.raises(HTTPException) as error:
        auth.verify_google_id_token("a.b.c", settings)
    assert error.value.status_code == 401


def test_catalog_publication_requires_admin_and_methodology_passport(client: TestClient) -> None:
    register(client)
    user_tokens = client.post(
        "/auth/login",
        json={"email": "test@example.com", "password": "a-secure-password"},
    ).json()
    localizations = {
        "ru": {"title": "Память", "description": "Образовательное упражнение"},
        "tg": {"title": "Хотира", "description": "Машқи омӯзишӣ"},
        "en": {"title": "Memory", "description": "Educational exercise"},
    }
    denied = client.post(
        "/admin/categories",
        json={"slug": "memory", "localizations": localizations},
        headers={"Authorization": f"Bearer {user_tokens['access_token']}"},
    )
    assert denied.status_code == 403

    db_dependency = app.dependency_overrides[get_db_session]
    session_generator = db_dependency()
    session = next(session_generator)
    try:
        session.add(
            User(
                email="admin@example.com",
                full_name="Admin User",
                password_hash=hash_password("a-secure-password"),
                age_group="18_plus",
                role="admin",
            )
        )
        session.commit()
    finally:
        next(session_generator, None)
    admin_tokens = client.post(
        "/auth/login",
        json={"email": "admin@example.com", "password": "a-secure-password"},
    ).json()
    headers = {"Authorization": f"Bearer {admin_tokens['access_token']}"}

    category = client.post(
        "/admin/categories",
        json={"slug": "memory", "localizations": localizations},
        headers=headers,
    )
    assert category.status_code == 201
    test = client.post(
        "/admin/tests",
        json={
            "category_id": category.json()["id"],
            "slug": "short-term-memory",
            "test_type": "educational_exercise",
            "guest_allowed": True,
            "localizations": localizations,
        },
        headers=headers,
    )
    assert test.status_code == 201
    unpublished = client.post(f"/admin/tests/{test.json()['id']}/publish", headers=headers)
    assert unpublished.status_code == 409

    passport = client.put(
        f"/admin/tests/{test.json()['id']}/methodology",
        json={
            "methodology_name": "Short-term memory exercise",
            "methodology_version": "1.0",
            "evidence_status": "educational",
            "limitations": "This exercise does not diagnose a condition.",
        },
        headers=headers,
    )
    assert passport.status_code == 200
    questionnaire = client.put(
        f"/admin/tests/{test.json()['id']}/questionnaire",
        json={
            "definition_version": "draft-1",
            "questions": [
                {
                    "id": "q1",
                    "localizations": {
                        "ru": {"text": "Выберите ответ"},
                        "tg": {"text": "Ҷавобро интихоб кунед"},
                        "en": {"text": "Choose an answer"},
                    },
                }
            ],
        },
        headers=headers,
    )
    assert questionnaire.status_code == 200
    assert questionnaire.json()["version"] == "draft-1"
    published = client.post(f"/admin/tests/{test.json()['id']}/publish", headers=headers)
    assert published.status_code == 200
    public_catalog = client.get("/tests?age=18")
    assert public_catalog.status_code == 200
    assert public_catalog.json()[0]["slug"] == "short-term-memory"
    assert public_catalog.json()[0]["methodology"]["evidence_status"] == "educational"


def test_google_login_allows_existing_registered_email_to_sign_in(
    client: TestClient,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    registered = register(client)
    monkeypatch.setattr(
        auth,
        "verify_google_id_token",
        lambda *_: {
            "subject": "google-subject-456",
            "email": "test@example.com",
            "full_name": "Test User",
        },
    )

    response = client.post(
        "/auth/google",
        json={"id_token": "a" * 32, "age_group": "18_plus"},
    )
    assert response.status_code == 200
    assert response.json()["user"]["id"] == registered["id"]


def test_authenticated_user_can_link_matching_google_email(
    client: TestClient,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    registered = register(client)
    tokens = client.post(
        "/auth/login",
        json={"email": "test@example.com", "password": "a-secure-password"},
    ).json()
    monkeypatch.setattr(
        auth,
        "verify_google_id_token",
        lambda *_: {
            "subject": "google-subject-789",
            "email": "test@example.com",
            "full_name": "Test User",
        },
    )

    response = client.post(
        "/auth/google/link",
        json={"id_token": "a" * 32},
        headers={"Authorization": f"Bearer {tokens['access_token']}"},
    )
    assert response.status_code == 204

    db_dependency = app.dependency_overrides[get_db_session]
    session_generator = db_dependency()
    session = next(session_generator)
    try:
        identity = session.scalar(
            select(GoogleIdentity).where(GoogleIdentity.subject == "google-subject-789")
        )
        assert identity is not None
        assert identity.user_id == registered["id"]
    finally:
        next(session_generator, None)
