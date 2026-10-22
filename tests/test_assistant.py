from collections.abc import Generator

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

from sihat import assistant
from sihat.config import Settings, get_settings
from sihat.db import Base, get_db_session
from sihat.main import app
from sihat.models import Category
from sihat.models import TestDefinition as CatalogTest
from sihat.rate_limit import clear_auth_rate_limits


@pytest.fixture
def client() -> Generator[TestClient, None, None]:
    engine = create_engine(
        "sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool
    )
    Base.metadata.create_all(engine)
    testing_session = sessionmaker(bind=engine, autocommit=False, autoflush=False)

    def override_db_session() -> Generator[Session, None, None]:
        with testing_session() as session:
            yield session

    app.dependency_overrides[get_db_session] = override_db_session
    app.dependency_overrides[get_settings] = lambda: Settings(
        jwt_secret="test-only-jwt-secret-with-more-than-thirty-two-characters",
        gemini_api_key="test-key",
    )
    clear_auth_rate_limits()
    assistant.clear_assistant_rate_limits()
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()
    clear_auth_rate_limits()
    assistant.clear_assistant_rate_limits()
    Base.metadata.drop_all(engine)
    engine.dispose()


def _headers(client: TestClient) -> dict[str, str]:
    assert (
        client.post(
            "/auth/register",
            json={
                "full_name": "Assistant User",
                "email": "assistant@example.com",
                "password": "a-secure-password",
                "age_group": "18_plus",
            },
        ).status_code
        == 201
    )
    token = client.post(
        "/auth/login", json={"email": "assistant@example.com", "password": "a-secure-password"}
    ).json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def _published_test(client: TestClient) -> None:
    db_dependency = app.dependency_overrides[get_db_session]
    session_generator = db_dependency()
    session = next(session_generator)
    try:
        category = Category(slug="assistant", localizations={"en": {"title": "Assistant"}})
        session.add(category)
        session.flush()
        session.add(
            CatalogTest(
                category_id=category.id,
                slug="openable-exercise",
                test_type="educational_exercise",
                availability_status="published",
                localizations={"en": {"title": "Openable"}},
            )
        )
        session.commit()
    finally:
        next(session_generator, None)


def test_assistant_uses_current_dialog_only_and_filters_actions(
    client: TestClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    headers = _headers(client)
    _published_test(client)
    received: dict[str, object] = {}

    def fake_gemini(**kwargs: object) -> dict[str, object]:
        received.update(kwargs)
        return {
            "message": "I can open the exercise.",
            "actions": [
                {"name": "open_test", "arguments": {"slug": "openable-exercise"}},
                {"name": "run_javascript", "arguments": {"code": "alert(1)"}},
                {"name": "prepare_test_start", "arguments": {"slug": "openable-exercise"}},
            ],
        }

    monkeypatch.setattr(assistant, "generate_assistant_response", fake_gemini)
    response = client.post(
        "/assistant/message",
        json={"text": "Open an exercise", "conversation": [{"role": "assistant", "text": "Hello"}]},
        headers=headers,
    )
    assert response.status_code == 200
    assert received["shared_results"] == []
    assert [action["name"] for action in response.json()["actions"]] == [
        "open_test",
        "prepare_test_start",
    ]
    assert response.json()["actions"][1]["requires_confirmation"] is True


def test_assistant_requires_explicit_result_sharing_and_falls_back(client: TestClient) -> None:
    headers = _headers(client)
    fallback = client.post(
        "/assistant/message", json={"text": "Can you diagnose me?"}, headers=headers
    )
    assert fallback.status_code == 200
    assert fallback.json()["provider_available"] is False
    assert "does not diagnose" in fallback.json()["message"]
    assert (
        client.post(
            "/assistant/message",
            json={"text": "Use a result", "shared_result_ids": ["missing-result"]},
            headers=headers,
        ).status_code
        == 404
    )
