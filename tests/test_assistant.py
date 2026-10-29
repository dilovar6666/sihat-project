import pytest
from fastapi.testclient import TestClient

from sihat import assistant
from sihat.models import Category
from sihat.models import TestDefinition as CatalogTest
from tests.conftest import sync_db_exec


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
    async def seed(session):
        category = Category(slug="assistant", localizations={"en": {"title": "Assistant"}})
        session.add(category)
        await session.flush()
        session.add(
            CatalogTest(
                category_id=category.id,
                slug="openable-exercise",
                test_type="educational_exercise",
                availability_status="published",
                localizations={"en": {"title": "Openable"}},
            )
        )

    sync_db_exec(seed)


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
