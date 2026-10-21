from collections.abc import Generator
from datetime import UTC, datetime, timedelta

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

from sihat.db import Base, get_db_session
from sihat.main import app
from sihat.models import PasswordResetToken, User
from sihat.security import hash_token


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

    app.dependency_overrides[get_db_session] = override_db_session
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()
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
