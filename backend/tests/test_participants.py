import pytest
from datetime import date
from fastapi.testclient import TestClient


def test_participant_screening_and_eligibility(client: TestClient, investigator_token: str):
    headers = {"Authorization": f"Bearer {investigator_token}"}
    
    # 1. Screen prospective participant
    screen_payload = {
        "trial_id": 1,
        "site_id": 1,
        "age": 55,
        "age_group": "45-64",
        "sex": "Female",
        "screening_date": str(date.today()),
        "inclusion_criteria_eval": {"Met": True, "AgeMet": True},
        "exclusion_criteria_eval": {"Present": False},
        "notes": "Subject meets diagnostic criteria for Sandhigata Vata."
    }
    resp = client.post("/api/v1/participants/screen", json=screen_payload, headers=headers)
    assert resp.status_code == 201, resp.text
    part = resp.json()
    part_id = part["id"]
    assert part["participant_status"] == "Screened"
    assert part["eligibility_status"] == "Pending"
    assert part["participant_id"].startswith("AIIA-")

    # 2. Cannot enroll while pending/ineligible
    enroll_resp = client.post(f"/api/v1/participants/{part_id}/enroll", json={}, headers=headers)
    assert enroll_resp.status_code == 400
    assert "Eligible" in str(enroll_resp.json())

    # 3. Mark Eligible
    elig_payload = {
        "eligibility_status": "Eligible",
        "notes": "Blood chemistry, renal profile, and baseline joint radiograph within protocol parameters."
    }
    elig_resp = client.post(f"/api/v1/participants/{part_id}/evaluate", json=elig_payload, headers=headers)
    assert elig_resp.status_code == 200
    assert elig_resp.json()["eligibility_status"] == "Eligible"

    # 4. Enroll participant
    enroll_success = client.post(f"/api/v1/participants/{part_id}/enroll", json={}, headers=headers)
    assert enroll_success.status_code == 200
    enrolled_part = enroll_success.json()
    assert enrolled_part["participant_status"] == "Enrolled"
    assert enrolled_part["enrollment_date"] is not None

    # 5. Server-side Randomization
    rand_resp = client.post(f"/api/v1/participants/{part_id}/randomize", json={}, headers=headers)
    assert rand_resp.status_code == 200
    rand_part = rand_resp.json()
    assert rand_part["participant_status"] == "Randomized"
    assert ("Group A" in rand_part["treatment_group"]) or ("Group B" in rand_part["treatment_group"])
    assert rand_part["randomization_number"].startswith("RND-")

    # 6. Check Visit Generation
    visits_resp = client.get(f"/api/v1/participants/{part_id}/visits", headers=headers)
    assert visits_resp.status_code == 200
    visits = visits_resp.json()
    assert len(visits) > 0
    
    # Complete Baseline Visit
    first_visit = visits[0]
    complete_resp = client.put(
        f"/api/v1/participants/{part_id}/visits/{first_visit['id']}",
        json={"visit_status": "Completed", "actual_date": str(date.today()), "notes": "Baseline vitals recorded."},
        headers=headers
    )
    assert complete_resp.status_code == 200
    assert complete_resp.json()["visit_status"] == "Completed"


def test_participant_rejection_when_ineligible(client: TestClient, coordinator_token: str):
    headers = {"Authorization": f"Bearer {coordinator_token}"}

    screen_payload = {
        "trial_id": 1,
        "site_id": 1,
        "age": 32,
        "age_group": "18-44",
        "sex": "Male",
        "screening_date": str(date.today()),
        "notes": "Screening failure due to systemic corticosteroid use."
    }
    resp = client.post("/api/v1/participants/screen", json=screen_payload, headers=headers)
    assert resp.status_code == 201
    part_id = resp.json()["id"]

    # Mark Ineligible
    elig_resp = client.post(
        f"/api/v1/participants/{part_id}/evaluate",
        json={"eligibility_status": "Ineligible", "notes": "Failed exclusion criterion #3"},
        headers=headers
    )
    assert elig_resp.status_code == 200
    assert elig_resp.json()["participant_status"] == "Ineligible"

    # Attempt to enroll
    fail_enroll = client.post(f"/api/v1/participants/{part_id}/enroll", json={}, headers=headers)
    assert fail_enroll.status_code == 400
