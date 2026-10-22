from fastapi.testclient import TestClient

from sihat.main import app


def test_unapproved_symptom_triage_is_explicitly_blocked() -> None:
    with TestClient(app) as client:
        assert client.get("/symptom-triage/headache").status_code == 409
        assert client.get("/symptom-triage/unknown").status_code == 404
