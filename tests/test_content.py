from collections.abc import Generator

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

from sihat.config import Settings, get_settings
from sihat.content import clear_support_rate_limits
from sihat.db import Base, get_db_session
from sihat.main import app
from sihat.models import FaqItem, KnowledgeArticle
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
        jwt_secret="content-test-jwt-secret-with-more-than-thirty-two-chars"
    )
    clear_auth_rate_limits()
    clear_support_rate_limits()
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()
    clear_auth_rate_limits()
    clear_support_rate_limits()
    Base.metadata.drop_all(engine)
    engine.dispose()


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
    db_dependency = app.dependency_overrides[get_db_session]
    session_gen = db_dependency()
    session = next(session_gen)
    try:
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
        session.commit()
    finally:
        next(session_gen, None)

    res = client.get("/faq")
    assert res.status_code == 200
    slugs = [item["slug"] for item in res.json()]
    assert "faq-published" in slugs
    assert "faq-draft" not in slugs


def test_public_knowledge_articles(client: TestClient) -> None:
    db_dependency = app.dependency_overrides[get_db_session]
    session_gen = db_dependency()
    session = next(session_gen)
    try:
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
        session.commit()
    finally:
        next(session_gen, None)

    list_res = client.get("/knowledge")
    assert list_res.status_code == 200
    slugs = [item["slug"] for item in list_res.json()]
    assert "methodology-overview" in slugs
    assert "draft-article" not in slugs

    single_res = client.get("/knowledge/methodology-overview")
    assert single_res.status_code == 200
    assert single_res.json()["slug"] == "methodology-overview"

    assert client.get("/knowledge/draft-article").status_code == 404
    assert client.get("/knowledge/nonexistent").status_code == 404


def test_support_ticket_submission_and_rate_limiting(client: TestClient) -> None:
    # 1. Guest ticket
    guest_res = client.post(
        "/support/tickets",
        json={
            "contact_email": "guest@example.com",
            "subject": "Platform inquiry",
            "message": "Hello, I have a question about device conditions for exercises.",
        },
    )
    assert guest_res.status_code == 201
    ticket = guest_res.json()
    assert ticket["contact_email"] == "guest@example.com"
    assert ticket["user_id"] is None
    assert ticket["status"] == "open"

    # 2. Authenticated user ticket
    user_headers = _login_user(client, "ticket_user@example.com")
    auth_res = client.post(
        "/support/tickets",
        json={
            "contact_email": "ticket_user@example.com",
            "subject": "Export question",
            "message": "How do I download a PDF with only selected answers?",
        },
        headers=user_headers,
    )
    assert auth_res.status_code == 201
    assert auth_res.json()["user_id"] is not None

    # Check my-tickets
    my_tickets = client.get("/support/my-tickets", headers=user_headers)
    assert my_tickets.status_code == 200
    assert len(my_tickets.json()) == 1

    # Unauthenticated my-tickets -> 401
    assert client.get("/support/my-tickets").status_code == 401

    # 3. Rate limiting (limit is 5 requests per window)
    for _ in range(4):
        client.post(
            "/support/tickets",
            json={
                "contact_email": "spam@example.com",
                "subject": "Rapid query",
                "message": "Testing the support rate limiter threshold.",
            },
        )
    blocked = client.post(
        "/support/tickets",
        json={
            "contact_email": "spam@example.com",
            "subject": "Rapid query",
            "message": "Testing the support rate limiter threshold.",
        },
    )
    assert blocked.status_code == 429
