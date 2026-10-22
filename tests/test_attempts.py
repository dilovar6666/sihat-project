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
from sihat.models import Category, MethodologyPassport, Questionnaire, SavedResult
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
            MethodologyPassport(
                test_id=test.id,
                methodology_name="Original educational exercise",
                methodology_version="1.0",
                evidence_status="educational",
                device_conditions=["A standard browser"],
                limitations="This exercise does not diagnose a condition.",
                warnings=["Use a comfortable setting."],
            )
        )
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


def _complete_attempt(client: TestClient, headers: dict[str, str]) -> str:
    started = client.post("/attempts/start", json={"test_slug": "branching-check"}, headers=headers)
    assert started.status_code == 201
    attempt_id = started.json()["id"]
    assert (
        client.post(
            f"/attempts/{attempt_id}/answer",
            json={"question_id": "q1", "answer": "yes"},
            headers=headers,
        ).status_code
        == 200
    )
    assert (
        client.post(
            f"/attempts/{attempt_id}/answer",
            json={"question_id": "q3", "answer": "done"},
            headers=headers,
        ).status_code
        == 200
    )
    assert client.post(f"/attempts/{attempt_id}/complete", headers=headers).status_code == 200
    return attempt_id


def test_completed_attempt_requires_explicit_save_or_discards_sensitive_data(
    client: TestClient,
) -> None:
    _published_questionnaire(client)
    headers = _authorization_header(client)
    attempt_id = _complete_attempt(client, headers)
    assert client.get("/results/history", headers=headers).json() == []
    assert client.post(f"/attempts/{attempt_id}/do-not-save", headers=headers).status_code == 204
    assert client.get(f"/attempts/{attempt_id}/current", headers=headers).status_code == 404
    assert client.get("/results/history", headers=headers).json() == []


def test_saved_result_is_owner_only_immutable_and_deletable(client: TestClient) -> None:
    _published_questionnaire(client)
    owner_headers = _authorization_header(client)
    other_headers = _authorization_header(client, email="other-results@example.com")
    attempt_id = _complete_attempt(client, owner_headers)
    saved = client.post(f"/attempts/{attempt_id}/save", headers=owner_headers)
    assert saved.status_code == 201
    result = saved.json()
    assert "answers" not in result
    assert client.get(f"/attempts/{attempt_id}/current", headers=owner_headers).status_code == 404
    assert len(client.get("/results/history", headers=owner_headers).json()) == 1
    assert client.get("/results/history", headers=other_headers).json() == []
    assert client.get(f"/results/{result['id']}/compare", headers=other_headers).status_code == 404
    assert client.delete(f"/results/{result['id']}", headers=other_headers).status_code == 404
    assert client.put(f"/results/{result['id']}", headers=owner_headers).status_code == 405
    assert client.delete(f"/results/{result['id']}", headers=owner_headers).status_code == 204
    assert client.get("/results/history", headers=owner_headers).json() == []


def test_history_compares_only_matching_versions_and_conditions_and_exports_pdf(
    client: TestClient,
) -> None:
    _published_questionnaire(client)
    headers = _authorization_header(client)
    first_id = _complete_attempt(client, headers)
    first = client.post(f"/attempts/{first_id}/save", headers=headers).json()
    second_id = _complete_attempt(client, headers)
    second = client.post(f"/attempts/{second_id}/save", headers=headers)
    assert second.status_code == 201
    compared = client.get(f"/results/{first['id']}/compare", headers=headers)
    assert compared.status_code == 200
    assert [item["id"] for item in compared.json()["results"]] == [first["id"], second.json()["id"]]
    pdf = client.post(
        f"/results/{first['id']}/pdf",
        json={"include_answers": True, "include_warnings": True},
        headers=headers,
    )
    assert pdf.status_code == 200
    assert pdf.headers["content-type"].startswith("application/pdf")
    assert pdf.content.startswith(b"%PDF-1.4")

    db_dependency = app.dependency_overrides[get_db_session]
    session_generator = db_dependency()
    session = next(session_generator)
    try:
        stored = session.get(SavedResult, first["id"])
        assert stored is not None
        stored.compatibility_conditions = {"device_conditions": ["Different condition"]}
        session.commit()
    finally:
        next(session_generator, None)
    compared_after_condition_change = client.get(f"/results/{first['id']}/compare", headers=headers)
    assert len(compared_after_condition_change.json()["results"]) == 1
    assert client.delete("/results/history", headers=headers).status_code == 204
    assert client.get("/results/history", headers=headers).json() == []
