from fastapi.testclient import TestClient

from sihat.main import app


def test_health_endpoint_is_public_and_does_not_require_database() -> None:
    with TestClient(app) as client:
        response = client.get("/health")

    assert response.status_code == 200
    assert response.json()["status"] == "ok"
    assert response.json()["service"] == "sihat-api"


def test_openapi_documents_health_endpoint() -> None:
    with TestClient(app) as client:
        response = client.get("/openapi.json")

    assert response.status_code == 200
    assert "/health" in response.json()["paths"]


def test_cors_permits_browser_authentication_posts() -> None:
    with TestClient(app) as client:
        response = client.options(
            "/auth/login",
            headers={
                "Origin": "http://localhost:5173",
                "Access-Control-Request-Method": "POST",
            },
        )

    assert response.status_code == 200
    assert "POST" in response.headers["access-control-allow-methods"]
