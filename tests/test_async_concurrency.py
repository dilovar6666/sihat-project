from concurrent.futures import ThreadPoolExecutor
from unittest.mock import patch

import httpx
import pytest
from fastapi.testclient import TestClient

from sihat.config import Settings
from sihat.gemini import GeminiUnavailableError, generate_assistant_response_async
from sihat.models import Category, MethodologyPassport, Questionnaire
from sihat.models import TestDefinition as CatalogTest
from tests.conftest import sync_db_exec


def _register_and_login(client: TestClient, email: str = "concurrency@example.com") -> dict[str, str]:
    client.post(
        "/auth/register",
        json={
            "full_name": "Concurrent Tester",
            "email": email,
            "password": "a-secure-password-123",
            "age_group": "18_plus",
        },
    )
    tokens = client.post(
        "/auth/login",
        json={"email": email, "password": "a-secure-password-123"},
    ).json()
    return {"Authorization": f"Bearer {tokens['access_token']}"}


def _seed_test_definition() -> None:
    async def seed(session):
        category = Category(slug="speed", localizations={"en": {"title": "Speed"}})
        session.add(category)
        await session.flush()
        test = CatalogTest(
            category_id=category.id,
            slug="reaction-test",
            test_type="educational_exercise",
            availability_status="published",
            guest_allowed=False,
            min_age=16,
            localizations={"en": {"title": "Reaction speed"}},
        )
        session.add(test)
        await session.flush()
        session.add(
            MethodologyPassport(
                test_id=test.id,
                methodology_name="Reaction Test 1.0",
                methodology_version="1.0",
                evidence_status="educational",
                device_conditions=["Keyboard or mouse"],
                limitations="This exercise does not diagnose a condition.",
                warnings=["None"],
            )
        )
        session.add(
            Questionnaire(
                test_id=test.id,
                definition_version="v1",
                questions=[
                    {
                        "id": "q1",
                        "localizations": {"en": {"text": "Click when ready"}},
                        "options": [{"id": "ready", "points": 10}],
                    }
                ],
            )
        )
    sync_db_exec(seed)


def test_concurrent_attempt_completions(client: TestClient) -> None:
    _seed_test_definition()
    headers = _register_and_login(client, "concurrent1@example.com")
    
    start_resp = client.post(
        "/attempts/start",
        json={"test_slug": "reaction-test"},
        headers=headers,
    )
    assert start_resp.status_code == 201
    attempt_id = start_resp.json()["id"]

    # Submit an answer first
    client.post(
        f"/attempts/{attempt_id}/answer",
        json={"question_id": "q1", "answer": "ready"},
        headers=headers,
    )

    # Perform concurrent completion calls in parallel threads
    results = []
    def complete_call():
        return client.post(
            f"/attempts/{attempt_id}/complete",
            json={"telemetry": {"raw_reaction_ms": 250}},
            headers=headers,
        )

    with ThreadPoolExecutor(max_workers=5) as executor:
        futures = [executor.submit(complete_call) for _ in range(5)]
        results = [f.result() for f in futures]

    # All should return 200, matching result, no duplicate attempts or corruption
    assert all(r.status_code == 200 for r in results)
    first_result = results[0].json()
    assert first_result["status"] == "completed"
    assert all(r.json()["id"] == attempt_id for r in results)
    assert all(r.json()["status"] == "completed" for r in results)


def test_database_rollback_and_session_cleanup(client: TestClient) -> None:
    headers = _register_and_login(client, "rollback@example.com")

    # Attempting to answer with invalid payload causes 422
    response = client.post(
        "/attempts/invalid-id/answer",
        json={"question_id": "none", "answer": 123},
        headers=headers,
    )
    assert response.status_code in (404, 422)

    # Database session remains healthy and responsive for subsequent requests
    profile = client.get("/me/profile", headers=headers)
    assert profile.status_code == 200
    assert profile.json()["email"] == "rollback@example.com"


@pytest.mark.asyncio
async def test_external_api_timeout_graceful_handling() -> None:
    settings = Settings(gemini_api_key="fake-test-key")

    with patch("httpx.AsyncClient.post", side_effect=httpx.TimeoutException("Connection timed out")):
        with pytest.raises(GeminiUnavailableError):
            await generate_assistant_response_async(
                settings=settings,
                conversation=[{"role": "user", "text": "Hello"}],
                shared_results=[],
            )


def test_concurrent_auth_requests(client: TestClient) -> None:
    # 10 concurrent requests to an auth endpoint
    def login_attempt(i: int):
        return client.post(
            "/auth/login",
            json={"email": f"nonexistent_{i}@example.com", "password": "pass"},
        )

    with ThreadPoolExecutor(max_workers=5) as executor:
        futures = [executor.submit(login_attempt, i) for i in range(10)]
        results = [f.result() for f in futures]

    assert all(r.status_code in (401, 429) for r in results)
