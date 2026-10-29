"""HTTP-level tests of the interactive exercise flow (start → event log → server scoring)."""

from concurrent.futures import ThreadPoolExecutor

from fastapi.testclient import TestClient
from sqlalchemy import select

from sihat.engine_catalog import sync_engine_catalog
from sihat.models import Category, TestDefinition
from sihat.test_generators import ENGINE_SLUGS
from tests.conftest import sync_db_exec
from tests.test_engine_scoring import _perfect


def _seed(extra_legacy: bool = False) -> dict:
    async def run(session):
        if extra_legacy:
            category = Category(slug="legacy", localizations={"en": {"title": "Legacy"}})
            session.add(category)
            await session.flush()
            session.add(
                TestDefinition(
                    category_id=category.id,
                    slug="color-perception",
                    test_type="educational_exercise",
                    availability_status="published",
                    guest_allowed=True,
                    localizations={"en": {"title": "Colour"}},
                )
            )
            await session.flush()
        return await session.run_sync(lambda sync: sync_engine_catalog(sync, hide_unapproved=True))

    return sync_db_exec(run)


def _login(client: TestClient, email: str = "engine@example.com") -> dict[str, str]:
    client.post(
        "/auth/register",
        json={
            "full_name": "Engine User",
            "email": email,
            "password": "a-secure-password",
            "age_group": "18_plus",
        },
    )
    token = client.post(
        "/auth/login", json={"email": email, "password": "a-secure-password"}
    ).json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def _stored_challenge(attempt_id: str) -> dict:
    from sihat.models import TestAttempt

    async def run(session):
        attempt = await session.get(TestAttempt, attempt_id)
        return attempt.definition_snapshot["challenge"]

    return sync_db_exec(run)


def test_catalog_sync_publishes_fifteen_and_hides_legacy_tests(client: TestClient) -> None:
    report = _seed(extra_legacy=True)
    assert "color-perception" in report["hidden"]
    assert len(report["created"]) == 15
    again = _seed()
    assert again["created"] == []  # idempotent

    slugs = {t["slug"] for t in client.get("/tests").json()}
    assert slugs == ENGINE_SLUGS
    categories = client.get("/categories").json()
    assert {c["slug"] for c in categories} == {
        "memory-attention",
        "vision",
        "hearing",
        "reaction-coordination",
    }

    async def status_of(session):
        test = await session.scalar(select(TestDefinition).where(TestDefinition.slug == "color-perception"))
        return test.availability_status

    assert sync_db_exec(status_of) == "draft"  # hidden, not deleted


def test_attempt_flow_keeps_answers_private_and_scores_on_server(client: TestClient) -> None:
    _seed()
    headers = _login(client)
    started = client.post(
        "/attempts/start", json={"test_slug": "pattern-matrix"}, headers=headers
    )
    assert started.status_code == 201
    attempt = started.json()
    assert "correct" not in str(attempt["challenge"])
    assert len(attempt["challenge"]["items"]) == 6

    # reloading an unfinished attempt keeps the very same tasks
    resumed = client.get(f"/attempts/{attempt['id']}/resume", headers=headers).json()
    assert resumed["challenge"] == attempt["challenge"]

    stored = _stored_challenge(attempt["id"])
    telemetry = _perfect("pattern-matrix", stored)
    completed = client.post(
        f"/attempts/{attempt['id']}/complete", json={"telemetry": telemetry}, headers=headers
    )
    assert completed.status_code == 200
    result = completed.json()["result"]
    assert result["version"] == 2 and result["metrics"]["correct_count"] == 6

    saved = client.post(f"/attempts/{attempt['id']}/save", headers=headers)
    assert saved.status_code == 201
    history = client.get("/results/history", headers=headers).json()
    assert history[0]["result"]["metrics"]["accuracy_pct"] == 100.0


def test_invalid_event_log_is_rejected_and_attempt_stays_open(client: TestClient) -> None:
    _seed()
    headers = _login(client, "bad@example.com")
    attempt = client.post(
        "/attempts/start", json={"test_slug": "attention-concentration"}, headers=headers
    ).json()
    rejected = client.post(
        f"/attempts/{attempt['id']}/complete",
        json={"telemetry": {"clicks": [{"v": 1, "t": 100}]}},
        headers=headers,
    )
    assert rejected.status_code == 422
    still_open = client.get(f"/attempts/{attempt['id']}/resume", headers=headers)
    assert still_open.json()["status"] == "in_progress"
    ok = client.post(
        f"/attempts/{attempt['id']}/complete",
        json={"telemetry": _perfect("attention-concentration", _stored_challenge(attempt["id"]))},
        headers=headers,
    )
    assert ok.status_code == 200


def test_concurrent_completion_scores_exactly_once(client: TestClient) -> None:
    _seed()
    headers = _login(client, "race@example.com")
    attempt = client.post(
        "/attempts/start", json={"test_slug": "reaction-speed"}, headers=headers
    ).json()
    telemetry = _perfect("reaction-speed", _stored_challenge(attempt["id"]))

    def complete() -> dict:
        response = client.post(
            f"/attempts/{attempt['id']}/complete", json={"telemetry": telemetry}, headers=headers
        )
        assert response.status_code == 200
        return response.json()

    with ThreadPoolExecutor(max_workers=6) as pool:
        bodies = list(pool.map(lambda _: complete(), range(6)))
    assert len({b["completed_at"] for b in bodies}) == 1
    assert len({str(b["result"]) for b in bodies}) == 1


def test_guest_can_try_an_exercise_without_storage(client: TestClient) -> None:
    _seed()
    started = client.post("/guest-attempts/start", json={"test_slug": "go-no-go"})
    assert started.status_code == 200
    body = started.json()
    assert len(body["challenge"]["trials"]) == 40
    from jwt import decode

    private = decode(body["token"], options={"verify_signature": False})["challenge"]
    done = client.post(
        "/guest-attempts/complete",
        json={"token": body["token"], "telemetry": _perfect("go-no-go", private)},
    )
    assert done.status_code == 200
    assert done.json()["result"]["metrics"]["accuracy_pct"] == 100.0

    tampered = client.post(
        "/guest-attempts/complete",
        json={"token": body["token"][:-4] + "abcd", "telemetry": {}},
    )
    assert tampered.status_code == 410
    assert client.post("/guest-attempts/start", json={"test_slug": "nope"}).status_code == 404
    assert client.get("/results/history").status_code == 401  # nothing persisted for guests
