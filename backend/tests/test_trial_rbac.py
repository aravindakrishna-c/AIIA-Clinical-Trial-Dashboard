import pytest
from fastapi.testclient import TestClient


def test_unauthenticated_access_rejected(client: TestClient):
    """Verify endpoints reject requests without token with 401 Unauthorized."""
    response = client.get("/api/v1/trials")
    assert response.status_code == 401


def test_monitor_and_regulator_read_access(client: TestClient, monitor_token: str, regulator_token: str):
    """Verify monitor and regulator can view trials and summary, but cannot create trials."""
    # Read access allowed
    for token in [monitor_token, regulator_token]:
        res_list = client.get("/api/v1/trials", headers={"Authorization": f"Bearer {token}"})
        assert res_list.status_code == 200

        res_sum = client.get("/api/v1/trials/summary", headers={"Authorization": f"Bearer {token}"})
        assert res_sum.status_code == 200

    # Write access denied (403)
    sample_trial = {
        "trial_id": "AIIA-CT-UNAUTH-01",
        "trial_title": "Unauthorized Attempt Trial",
        "protocol_number": "AIIA/UNAUTH/01",
        "protocol_version": "1.0",
        "protocol_version_date": "2026-01-01",
        "study_type": "Interventional",
        "study_phase": "Phase I",
        "study_design": "Single Group",
        "sponsor": "AIIA",
        "principal_investigator_id": 2,
        "disease_condition": "General",
        "ayurveda_intervention": "Intervention",
        "intervention_type": "Herbal",
        "intervention_description": "Description",
        "target_participants": 20,
        "start_date": "2026-01-01",
        "expected_completion_date": "2026-06-01",
        "inclusion_criteria": "Inclusion",
        "exclusion_criteria": "Exclusion",
        "primary_objective": "Objective"
    }
    create_attempt = client.post(
        "/api/v1/trials",
        json=sample_trial,
        headers={"Authorization": f"Bearer {monitor_token}"}
    )
    assert create_attempt.status_code == 403
    assert "Missing required permission 'trial.create'" in create_attempt.json()["message"]


def test_investigator_and_admin_create_access(client: TestClient, investigator_token: str):
    """Verify Principal Investigator has trial.create permission."""
    payload = {
        "trial_id": "AIIA-CT-PI-SUCCESS",
        "trial_title": "PI Created Clinical Trial",
        "protocol_number": "AIIA/PI/001",
        "protocol_version": "1.0",
        "protocol_version_date": "2026-03-01",
        "study_type": "Observational",
        "study_phase": "Not Applicable",
        "study_design": "Single Group, Open Label",
        "sponsor": "All India Institute of Ayurveda",
        "sponsor_type": "Institutional",
        "principal_investigator_id": 2,
        "disease_condition": "Sandhigata Vata",
        "ayurveda_intervention": "Janu Basti with Mahanarayana Taila",
        "intervention_type": "Panchakarma",
        "intervention_description": "Standard Janu Basti external oleation therapy.",
        "target_participants": 40,
        "start_date": "2026-04-01",
        "expected_completion_date": "2026-08-01",
        "inclusion_criteria": "Clinical signs of knee osteoarthritis.",
        "exclusion_criteria": "Previous knee replacement.",
        "primary_objective": "WOMAC index score improvement."
    }
    res = client.post(
        "/api/v1/trials",
        json=payload,
        headers={"Authorization": f"Bearer {investigator_token}"}
    )
    assert res.status_code == 201
    assert res.json()["trial_id"] == "AIIA-CT-PI-SUCCESS"
