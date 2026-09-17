import pytest
from datetime import date
from fastapi.testclient import TestClient


def test_adverse_event_and_sae_lifecycle(client: TestClient, coordinator_token: str, admin_token: str):
    coord_headers = {"Authorization": f"Bearer {coordinator_token}"}
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    # 1. Report an AE (Mild severity, Non-serious)
    ae_payload = {
        "trial_id": 1,
        "site_id": 1,
        "participant_id": 1,
        "event_description": "Mild abdominal distension after evening dose.",
        "event_term": "Abdominal distension",
        "start_date": str(date.today()),
        "severity": "Mild",
        "seriousness": "None",
        "is_serious": False,
        "relationship_to_intervention": "Possible",
        "action_taken": "No change",
        "outcome": "Recovering",
        "expectedness": "Expected"
    }
    ae_resp = client.post("/api/v1/safety", json=ae_payload, headers=coord_headers)
    assert ae_resp.status_code == 201, ae_resp.text
    ae_data = ae_resp.json()
    ae_id = ae_data["id"]
    assert ae_data["status"] == "Reported"
    assert ae_data["is_serious"] is False

    # 2. Report an SAE (Severe with hospitalization)
    sae_payload = {
        "trial_id": 1,
        "site_id": 1,
        "participant_id": 1,
        "event_description": "Sudden anaphylactoid response and severe bronchospasm.",
        "event_term": "Bronchospasm / Anaphylactoid reaction",
        "start_date": str(date.today()),
        "severity": "Severe",
        "seriousness": "Hospitalization",
        "is_serious": True,
        "sae_criteria": "Hospitalization",
        "sae_report_date": str(date.today()),
        "relationship_to_intervention": "Probable",
        "action_taken": "Intervention stopped",
        "outcome": "Recovering",
        "expectedness": "Unexpected"
    }
    sae_resp = client.post("/api/v1/safety", json=sae_payload, headers=coord_headers)
    assert sae_resp.status_code == 201, sae_resp.text
    sae_data = sae_resp.json()
    sae_id = sae_data["id"]
    assert sae_data["is_serious"] is True
    assert sae_data["status"] in ["Reported", "Under Review"]

    # 3. Medical Safety Review by PV Officer / Admin
    review_payload = {
        "relationship_to_intervention": "Probable",
        "status": "Closed",
        "outcome": "Recovered",
        "investigator_notes": "Allergic symptoms resolved after administration of epinephrine and hydrocortisone. Subject withdrawn from intervention arm."
    }
    rev_resp = client.post(f"/api/v1/safety/{sae_id}/review", json=review_payload, headers=admin_headers)
    assert rev_resp.status_code == 200, rev_resp.text
    reviewed_sae = rev_resp.json()
    assert reviewed_sae["status"] == "Closed"
    assert reviewed_sae["outcome"] == "Recovered"
