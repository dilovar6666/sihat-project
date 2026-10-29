from datetime import UTC, datetime, timedelta

from fastapi.testclient import TestClient

from sihat.models import Category, MethodologyPassport, Questionnaire, SavedResult
from sihat.models import TestAttempt as AttemptRecord
from sihat.models import TestDefinition as CatalogTest
from tests.conftest import sync_db_exec


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
    async def seed(session):
        category = Category(slug="wellbeing", localizations={"en": {"title": "Wellbeing"}})
        session.add(category)
        await session.flush()
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
        await session.flush()
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

    sync_db_exec(seed)


def test_attempt_lifecycle_is_authenticated_sanitized_and_immutable(client: TestClient) -> None:
    _published_questionnaire(client)
    assert client.post("/attempts/start", json={"test_slug": "branching-check"}).status_code == 401
    headers = _authorization_header(client)

    started = client.post("/attempts/start", json={"test_slug": "branching-check"}, headers=headers)
    assert started.status_code == 201
    attempt = started.json()
    assert attempt["current_question"]["id"] == "q1"
    assert "points" not in attempt["current_question"]
    assert "correct_answer" not in attempt["current_question"]["options"][0]

    answered = client.post(
        f"/attempts/{attempt['id']}/answer",
        json={"question_id": "q1", "answer": "yes"},
        headers=headers,
    )
    assert answered.status_code == 200
    assert answered.json()["current_question"]["id"] == "q3"

    resumed = client.get(f"/attempts/{attempt['id']}/resume", headers=headers)
    assert resumed.status_code == 200
    assert resumed.json()["current_question"]["id"] == "q3"

    wrong_question = client.post(
        f"/attempts/{attempt['id']}/answer",
        json={"question_id": "q1", "answer": "yes"},
        headers=headers,
    )
    assert wrong_question.status_code == 409

    answered_final = client.post(
        f"/attempts/{attempt['id']}/answer",
        json={"question_id": "q3", "answer": "done"},
        headers=headers,
    )
    assert answered_final.status_code == 200
    assert answered_final.json()["current_question"] is None

    completed = client.post(f"/attempts/{attempt['id']}/complete", headers=headers)
    assert completed.status_code == 200
    assert completed.json()["status"] == "completed"
    assert completed.json()["result"]["points"] == 99

    cannot_answer_after_completion = client.post(
        f"/attempts/{attempt['id']}/answer",
        json={"question_id": "q3", "answer": "done"},
        headers=headers,
    )
    assert cannot_answer_after_completion.status_code == 409


def test_attempts_are_private_discardable_and_expire(client: TestClient) -> None:
    _published_questionnaire(client)
    owner_headers = _authorization_header(client)
    other_headers = _authorization_header(client, email="other@example.com")

    started = client.post(
        "/attempts/start", json={"test_slug": "branching-check"}, headers=owner_headers
    )
    assert started.status_code == 201
    attempt_id = started.json()["id"]

    assert client.get(f"/attempts/{attempt_id}/current", headers=other_headers).status_code == 404
    assert client.post(
        f"/attempts/{attempt_id}/answer",
        json={"question_id": "q1", "answer": "yes"},
        headers=other_headers,
    ).status_code == 404
    assert client.delete(f"/attempts/{attempt_id}/discard", headers=other_headers).status_code == 404

    assert client.delete(f"/attempts/{attempt_id}/discard", headers=owner_headers).status_code == 204
    assert client.get(f"/attempts/{attempt_id}/current", headers=owner_headers).status_code == 404

    expiring = client.post(
        "/attempts/start", json={"test_slug": "branching-check"}, headers=owner_headers
    )

    async def expire(session):
        attempt = await session.get(AttemptRecord, expiring.json()["id"])
        assert attempt is not None
        attempt.expires_at = datetime.now(UTC) - timedelta(seconds=1)

    sync_db_exec(expire)
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
    assert pdf.content.startswith(b"%PDF")

    async def modify_cond(session):
        stored = await session.get(SavedResult, first["id"])
        assert stored is not None
        stored.compatibility_conditions = {"device_conditions": ["Different condition"]}

    sync_db_exec(modify_cond)
    compared_after_condition_change = client.get(f"/results/{first['id']}/compare", headers=headers)
    assert len(compared_after_condition_change.json()["results"]) == 1
    assert client.delete("/results/history", headers=headers).status_code == 204
    assert client.get("/results/history", headers=headers).json() == []
