from collections.abc import Generator
from datetime import UTC, datetime, timedelta

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

from sihat.config import Settings, get_settings
from sihat.db import Base, get_db_session
from sihat.main import app
from sihat.models import Category, Questionnaire
from sihat.models import TestAttempt as AttemptRecord
from sihat.models import TestDefinition as CatalogTest
from sihat.rate_limit import clear_auth_rate_limits


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
    app.dependency_overrides[get_settings] = lambda: Settings(
        jwt_secret="test-only-jwt-secret-with-more-than-thirty-two-characters"
    )
    clear_auth_rate_limits()
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()
    clear_auth_rate_limits()
    Base.metadata.drop_all(engine)
    engine.dispose()


def _authorization_header(client: TestClient, email: str = "attempt@example.com") -> dict[str, str]:
    registration = client.post(
        "/auth/register",
        json={
            "full_name": "Attempt User",
            "email": email,
            "password": "a-secure-password",
            "age_group": "18_plus",
        },
    )
    assert registration.status_code == 201
    login = client.post("/auth/login", json={"email": email, "password": "a-secure-password"})
    assert login.status_code == 200
    return {"Authorization": f"Bearer {login.json()['access_token']}"}


def _published_questionnaire(client: TestClient) -> None:
    db_dependency = app.dependency_overrides[get_db_session]
    session_generator = db_dependency()
    session = next(session_generator)
    try:
        category = Category(slug="wellbeing", localizations={"en": {"title": "Wellbeing"}})
        session.add(category)
        session.flush()
        test = CatalogTest(
            category_id=category.id,
            slug="branching-check",
            test_type="educational_exercise",
            availability_status="published",
            guest_allowed=False,
            min_age=16,
            localizations={"en": {"title": "Branching check"}},
        )
        session.add(test)
        session.flush()
        session.add(
            Questionnaire(
                test_id=test.id,
                definition_version="v1",
                questions=[
                    {
                        "id": "q1",
                        "localizations": {"en": {"text": "Continue?"}},
                        "options": [
                            {
                                "id": "yes",
                                "localizations": {"en": {"text": "Yes"}},
                                "correct_answer": True,
                                "points": 99,
                            },
                            {"id": "no", "localizations": {"en": {"text": "No"}}},
                        ],
                        "correct_answer_id": "yes",
                        "points": 99,
                    },
                    {"id": "q2", "localizations": {"en": {"text": "Fallback"}}},
                    {"id": "q3", "localizations": {"en": {"text": "Branched"}}},
                ],
                branching_rules=[
                    {"when": {"question_id": "q1", "equals": "yes"}, "next_question_id": "q3"},
                    {"when": {"question_id": "q1", "equals": "no"}, "next_question_id": "q2"},
                ],
                scoring_config={"points": {"yes": 99}, "answer_key": "yes"},
            )
        )
        session.commit()
    finally:
        next(session_generator, None)


def test_attempt_lifecycle_is_authenticated_sanitized_and_immutable(client: TestClient) -> None:
    _published_questionnaire(client)
    assert client.post("/attempts/start", json={"test_slug": "branching-check"}).status_code == 401
    headers = _authorization_header(client)

    started = client.post("/attempts/start", json={"test_slug": "branching-check"}, headers=headers)
    assert started.status_code == 201
    attempt = started.json()
    assert attempt["current_question"]["id"] == "q1"
    serialized_question = str(attempt["current_question"])
    assert "correct" not in serialized_question
    assert "points" not in serialized_question
    assert "scoring" not in serialized_question

    branched = client.post(
        f"/attempts/{attempt['id']}/answer",
        json={"question_id": "q1", "answer": "yes"},
        headers=headers,
    )
    assert branched.status_code == 200
    assert branched.json()["current_question"]["id"] == "q3"
    assert (
        client.post(
            f"/attempts/{attempt['id']}/answer",
            json={"question_id": "q2", "answer": "ignored"},
            headers=headers,
        ).status_code
        == 409
    )
    resumed = client.get(f"/attempts/{attempt['id']}/resume", headers=headers)
    assert resumed.status_code == 200
    assert resumed.json()["current_question"]["id"] == "q3"
    assert (
        client.post(
            f"/attempts/{attempt['id']}/answer",
            json={"question_id": "q3", "answer": "done"},
            headers=headers,
        ).status_code
        == 200
    )

    completed = client.post(f"/attempts/{attempt['id']}/complete", headers=headers)
    assert completed.status_code == 200
    assert completed.json()["status"] == "completed"
    assert completed.json()["save_consent_required"] is True
    assert (
        client.post(f"/attempts/{attempt['id']}/complete", headers=headers).json()
        == completed.json()
    )
    assert (
        client.post(
            f"/attempts/{attempt['id']}/answer",
            json={"question_id": "q3", "answer": "changed"},
            headers=headers,
        ).status_code
        == 409
    )
    assert client.delete(f"/attempts/{attempt['id']}/discard", headers=headers).status_code == 409


def test_attempts_are_private_discardable_and_expire(client: TestClient) -> None:
    _published_questionnaire(client)
    owner_headers = _authorization_header(client)
    other_headers = _authorization_header(client, email="other@example.com")
    started = client.post(
        "/attempts/start", json={"test_slug": "branching-check"}, headers=owner_headers
    )
    attempt_id = started.json()["id"]
    assert client.get(f"/attempts/{attempt_id}/current", headers=other_headers).status_code == 404
    assert (
        client.delete(f"/attempts/{attempt_id}/discard", headers=owner_headers).status_code == 204
    )
    assert client.get(f"/attempts/{attempt_id}/resume", headers=owner_headers).status_code == 404

    expiring = client.post(
        "/attempts/start", json={"test_slug": "branching-check"}, headers=owner_headers
    )
    db_dependency = app.dependency_overrides[get_db_session]
    session_generator = db_dependency()
    session = next(session_generator)
    try:
        attempt = session.get(AttemptRecord, expiring.json()["id"])
        assert attempt is not None
        attempt.expires_at = datetime.now(UTC) - timedelta(seconds=1)
        session.commit()
    finally:
        next(session_generator, None)
    assert (
        client.get(f"/attempts/{expiring.json()['id']}/current", headers=owner_headers).status_code
        == 410
    )
