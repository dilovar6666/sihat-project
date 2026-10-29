"""Tests for public content (FAQ, knowledge base) and support tickets."""

from fastapi.testclient import TestClient

from sihat.models import FaqItem, KnowledgeArticle
from tests.conftest import sync_db_exec


def _login_user(client: TestClient, email: str) -> dict[str, str]:
    assert (
        client.post(
            "/auth/register",
            json={
                "full_name": f"User {email}",
                "email": email,
                "password": "a-secure-password-123",
                "age_group": "18_plus",
            },
        ).status_code
        == 201
    )
    token = client.post(
        "/auth/login", json={"email": email, "password": "a-secure-password-123"}
    ).json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def test_public_faq_returns_published_items_only(client: TestClient) -> None:
    async def seed(session):
        session.add(
            FaqItem(
                slug="faq-published",
                category="general",
                question={"ru": "Q1", "tg": "Q1", "en": "Q1"},
                answer={"ru": "A1", "tg": "A1", "en": "A1"},
                is_published=True,
                sort_order=1,
            )
        )
        session.add(
            FaqItem(
                slug="faq-draft",
                category="general",
                question={"ru": "Q2", "tg": "Q2", "en": "Q2"},
                answer={"ru": "A2", "tg": "A2", "en": "A2"},
                is_published=False,
                sort_order=2,
            )
        )

    sync_db_exec(seed)

    res = client.get("/faq")
    assert res.status_code == 200
    slugs = [item["slug"] for item in res.json()]
    assert "faq-published" in slugs
    assert "faq-draft" not in slugs


def test_public_knowledge_articles(client: TestClient) -> None:
    async def seed(session):
        session.add(
            KnowledgeArticle(
                slug="methodology-overview",
                category="methodology",
                is_published=True,
                sort_order=1,
                localizations={
                    "ru": {"title": "О методологии", "summary": "Кратко", "content": "Текст"},
                    "tg": {"title": "Оид ба методология", "summary": "Кӯтоҳ", "content": "Матн"},
                    "en": {"title": "About methodology", "summary": "Brief", "content": "Body"},
                },
            )
        )
        session.add(
            KnowledgeArticle(
                slug="draft-article",
                category="internal",
                is_published=False,
                sort_order=2,
                localizations={
                    "ru": {"title": "Черновик", "summary": "...", "content": "..."},
                },
            )
        )

    sync_db_exec(seed)

    list_res = client.get("/knowledge")
    assert list_res.status_code == 200
    slugs = [item["slug"] for item in list_res.json()]
    assert "methodology-overview" in slugs
    assert "draft-article" not in slugs

    cat_res = client.get("/knowledge?category=methodology")
    assert cat_res.status_code == 200
    assert len(cat_res.json()) == 1
    assert cat_res.json()[0]["slug"] == "methodology-overview"

    empty_cat = client.get("/knowledge?category=unknown-cat")
    assert empty_cat.status_code == 200
    assert len(empty_cat.json()) == 0

    detail_res = client.get("/knowledge/methodology-overview")
    assert detail_res.status_code == 200
    assert detail_res.json()["slug"] == "methodology-overview"
    assert "ru" in detail_res.json()["localizations"]

    not_found = client.get("/knowledge/draft-article")
    assert not_found.status_code == 404


def test_support_ticket_submission_and_rate_limiting(client: TestClient) -> None:
    valid_payload = {
        "contact_email": "guest@example.com",
        "subject": "Platform inquiry",
        "message": "Hello, I have a question about device conditions for exercises.",
    }
    created = client.post("/support/tickets", json=valid_payload)
    assert created.status_code == 201
    ticket_data = created.json()
    assert ticket_data["status"] == "open"
    assert ticket_data["contact_email"] == "guest@example.com"
    assert ticket_data["user_id"] is None

    auth_headers = _login_user(client, "support-user@example.com")
    auth_ticket = client.post(
        "/support/tickets",
        json={
            "contact_email": "support-user@example.com",
            "subject": "Audio test question",
            "message": "Headphone requirements detail.",
        },
        headers=auth_headers,
    )
    assert auth_ticket.status_code == 201
    assert auth_ticket.json()["user_id"] is not None

    my_tickets = client.get("/support/my-tickets", headers=auth_headers)
    assert my_tickets.status_code == 200
    assert len(my_tickets.json()) == 1

    assert client.get("/support/my-tickets").status_code == 401

    invalid_email = client.post(
        "/support/tickets",
        json={"contact_email": "not-an-email", "subject": "Hi", "message": "Test"},
    )
    assert invalid_email.status_code == 422

    short_msg = client.post(
        "/support/tickets",
        json={"contact_email": "guest@example.com", "subject": "Hi", "message": "short"},
    )
    assert short_msg.status_code == 422
