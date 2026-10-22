from collections.abc import Generator

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

from sihat.admin import router as admin_router  # noqa: F401
from sihat.config import Settings, get_settings
from sihat.content import clear_support_rate_limits
from sihat.db import Base, get_db_session
from sihat.main import app
from sihat.models import User
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
        jwt_secret="admin-test-jwt-secret-with-more-than-thirty-two-chars"
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


def _create_user(client: TestClient, email: str, role: str = "user") -> dict[str, str]:
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
    if role == "admin":
        db_dependency = app.dependency_overrides[get_db_session]
        session_gen = db_dependency()
        session = next(session_gen)
        try:
            user = session.query(User).filter(User.email == email).first()
            assert user is not None
            user.role = "admin"
            session.commit()
        finally:
            next(session_gen, None)

    token = client.post(
        "/auth/login", json={"email": email, "password": "a-secure-password-123"}
    ).json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def test_admin_rbac_enforcement(client: TestClient) -> None:
    # 1. Unauthenticated request
    assert client.get("/admin/dashboard").status_code == 401

    # 2. Regular user request
    user_headers = _create_user(client, "regular@example.com", role="user")
    assert client.get("/admin/dashboard", headers=user_headers).status_code == 403
    assert client.get("/admin/users", headers=user_headers).status_code == 403

    # 3. Admin request
    admin_headers = _create_user(client, "admin@example.com", role="admin")
    dash = client.get("/admin/dashboard", headers=admin_headers)
    assert dash.status_code == 200
    assert dash.json()["total_users"] == 2


def test_admin_dashboard_aggregate_analytics_only(client: TestClient) -> None:
    admin_headers = _create_user(client, "admin2@example.com", role="admin")
    _create_user(client, "user_teen@example.com", role="user")
    res = client.get("/admin/dashboard", headers=admin_headers)
    assert res.status_code == 200
    data = res.json()
    assert "total_users" in data
    assert "users_by_age_group" in data
    assert "active_users" in data
    assert "tests_by_status" in data
    assert "total_saved_results" in data
    # Ensure no medical questions, individual answers or PII are exposed
    assert "answers" not in data
    assert "medical_data" not in data


def test_admin_users_list_and_self_protection(client: TestClient) -> None:
    admin_headers = _create_user(client, "superadmin@example.com", role="admin")
    _create_user(client, "managed_user@example.com", role="user")

    # List users
    users_res = client.get("/admin/users", headers=admin_headers)
    assert users_res.status_code == 200
    users = users_res.json()
    assert len(users) == 2

    # Target managed user
    managed = next(u for u in users if u["email"] == "managed_user@example.com")
    admin = next(u for u in users if u["email"] == "superadmin@example.com")

    # Update managed user is_active
    patch_res = client.patch(
        f"/admin/users/{managed['id']}",
        json={"is_active": False},
        headers=admin_headers,
    )
    assert patch_res.status_code == 200
    assert patch_res.json()["is_active"] is False

    # Prevent admin self-deactivation
    self_deact = client.patch(
        f"/admin/users/{admin['id']}",
        json={"is_active": False},
        headers=admin_headers,
    )
    assert self_deact.status_code == 400
    assert "deactivate" in self_deact.json()["detail"].lower()

    # Prevent admin self-demotion
    self_demote = client.patch(
        f"/admin/users/{admin['id']}",
        json={"role": "user"},
        headers=admin_headers,
    )
    assert self_demote.status_code == 400
    assert "demote" in self_demote.json()["detail"].lower()


def test_admin_category_and_test_lifecycle(client: TestClient) -> None:
    admin_headers = _create_user(client, "catalogadmin@example.com", role="admin")

    # Create category
    cat_res = client.post(
        "/admin/categories",
        json={
            "slug": "lifecycle-cat",
            "localizations": {
                "ru": {"title": "Категория"},
                "tg": {"title": "Гурӯҳ"},
                "en": {"title": "Category"},
            },
        },
        headers=admin_headers,
    )
    assert cat_res.status_code == 201
    cat_id = cat_res.json()["id"]

    # List categories
    all_cats = client.get("/admin/categories", headers=admin_headers)
    assert all_cats.status_code == 200
    assert any(c["slug"] == "lifecycle-cat" for c in all_cats.json())

    # Create test
    test_res = client.post(
        "/admin/tests",
        json={
            "category_id": cat_id,
            "slug": "admin-lifecycle-test",
            "test_type": "educational_exercise",
            "localizations": {
                "ru": {"title": "Тест"},
                "tg": {"title": "Санҷиш"},
                "en": {"title": "Test"},
            },
            "min_age": 16,
        },
        headers=admin_headers,
    )
    assert test_res.status_code == 201
    test_id = test_res.json()["id"]

    # Patch test settings
    patched_test = client.patch(
        f"/admin/tests/{test_id}",
        json={"guest_allowed": True, "min_age": 18},
        headers=admin_headers,
    )
    assert patched_test.status_code == 200
    assert patched_test.json()["guest_allowed"] is True
    assert patched_test.json()["min_age"] == 18

    # Block test
    blocked = client.post(f"/admin/tests/{test_id}/block", headers=admin_headers)
    assert blocked.status_code == 200
    assert blocked.json()["status"] == "blocked"

    # Unpublish test back to draft
    unpub = client.post(f"/admin/tests/{test_id}/unpublish", headers=admin_headers)
    assert unpub.status_code == 200
    assert unpub.json()["status"] == "draft"


def test_admin_faq_crud(client: TestClient) -> None:
    admin_headers = _create_user(client, "faqadmin@example.com", role="admin")

    # Create FAQ item
    create_res = client.post(
        "/admin/faq",
        json={
            "slug": "what-is-sihat",
            "category": "general",
            "question": {"ru": "Что такое SIHAT?", "tg": "SIHAT чист?", "en": "What is SIHAT?"},
            "answer": {
                "ru": "Платформа ориентировочных тестов.",
                "tg": "Платформаи санҷишҳо.",
                "en": "Educational health screening platform.",
            },
            "sort_order": 1,
            "is_published": True,
        },
        headers=admin_headers,
    )
    assert create_res.status_code == 201
    faq_id = create_res.json()["id"]

    # Duplicate slug returns 409
    dup = client.post(
        "/admin/faq",
        json={
            "slug": "what-is-sihat",
            "category": "general",
            "question": {"ru": "Q", "tg": "Q", "en": "Q"},
            "answer": {"ru": "A", "tg": "A", "en": "A"},
        },
        headers=admin_headers,
    )
    assert dup.status_code == 409

    # Patch FAQ
    patched = client.patch(
        f"/admin/faq/{faq_id}",
        json={"sort_order": 10},
        headers=admin_headers,
    )
    assert patched.status_code == 200
    assert patched.json()["sort_order"] == 10

    # Delete FAQ
    assert client.delete(f"/admin/faq/{faq_id}", headers=admin_headers).status_code == 204
    assert client.get("/admin/faq", headers=admin_headers).json() == []


def test_admin_content_drafting_assistant(client: TestClient) -> None:
    admin_headers = _create_user(client, "contentadmin@example.com", role="admin")

    res = client.post(
        "/admin/content/draft",
        json={"topic": "Visual contrast checks", "content_type": "article", "language": "ru"},
        headers=admin_headers,
    )
    assert res.status_code == 200
    payload = res.json()
    assert "Draft: Visual contrast checks" in payload["title"]
    assert "SIHAT" in payload["content"]
    assert "administrative review" in payload["note"].lower()
