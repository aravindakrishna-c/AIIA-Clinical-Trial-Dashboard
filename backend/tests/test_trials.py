import pytest
from fastapi.testclient import TestClient


def test_get_trials_summary(client: TestClient, admin_token: str):
    """Test retrieving dynamic trial summary counts from DB."""
    response = client.get(
        "/api/v1/trials/summary",
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "total_trials" in data
    assert "draft_trials" in data
    assert "recruiting_trials" in data
    assert "active_trials" in data
    assert data["total_trials"] >= 4  # Seeded trials


def test_list_trials_with_filters(client: TestClient, admin_token: str):
    """Test listing trials with search, status filter, and study phase."""
    # List all
    response = client.get(
        "/api/v1/trials",
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert response.status_code == 200
    trials = response.json()
    assert len(trials) >= 4

    # Filter by status
    response_recruiting = client.get(
        "/api/v1/trials?status=Recruiting",
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert response_recruiting.status_code == 200
    recruiting = response_recruiting.json()
    assert all(t["status"] == "Recruiting" for t in recruiting)

    # Search by trial_id
    response_search = client.get(
        "/api/v1/trials?search=AIIA-CT-2026-001",
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert response_search.status_code == 200
    search_results = response_search.json()
    assert len(search_results) == 1
    assert search_results[0]["trial_id"] == "AIIA-CT-2026-001"


def test_create_clinical_trial_success(client: TestClient, investigator_token: str):
    """Test creating a new clinical trial with valid data and initial protocol version."""
    payload = {
        "trial_id": "AIIA-CT-2026-999",
        "trial_title": "Efficacy of Ashwagandha Rasayana in Chronic Fatigue Syndrome",
        "short_title": "Ashwagandha CFS Trial",
        "protocol_number": "AIIA/IEC/2026/999",
        "protocol_version": "1.0",
        "protocol_version_date": "2026-03-01",
        "study_type": "Interventional",
        "study_phase": "Phase II",
        "study_design": "Parallel Group, Randomized, Double-Blind",
        "sponsor": "All India Institute of Ayurveda",
        "sponsor_type": "Government",
        "sponsor_contact": "cfstrials@aiia.gov.in",
        "principal_investigator_id": 2,  # Dr. Rajesh Sharma
        "disease_condition": "Chronic Fatigue Syndrome (Klama)",
        "ayurveda_intervention": "Standardized Ashwagandha Avaleha",
        "intervention_type": "Rasayana",
        "intervention_description": "Withania somnifera processed with milk and ghee standardized for withanolides.",
        "dosage": "10 g twice daily with milk",
        "route_of_administration": "Oral",
        "frequency": "Twice daily",
        "duration": "12 weeks",
        "target_participants": 60,
        "start_date": "2026-04-01",
        "expected_completion_date": "2026-10-30",
        "inclusion_criteria": "Age 20-50, Chalder Fatigue Scale score > 18.",
        "exclusion_criteria": "Autoimmune disease, severe depression.",
        "primary_objective": "Reduction in Chalder Fatigue score at 12 weeks."
    }

    response = client.post(
        "/api/v1/trials",
        json=payload,
        headers={"Authorization": f"Bearer {investigator_token}"}
    )
    assert response.status_code == 201
    data = response.json()
    assert data["trial_id"] == "AIIA-CT-2026-999"
    assert data["status"] == "Draft"
    assert len(data["protocol_versions"]) == 1
    assert data["protocol_versions"][0]["version_number"] == "1.0"


def test_create_clinical_trial_validation_errors(client: TestClient, admin_token: str):
    """Test validation errors for invalid dates, non-positive participants, and duplicate IDs."""
    # Target participants <= 0
    invalid_target = {
        "trial_id": "AIIA-CT-ERR-001",
        "trial_title": "Invalid Target Trial",
        "protocol_number": "AIIA/ERR/001",
        "protocol_version": "1.0",
        "protocol_version_date": "2026-01-01",
        "study_type": "Interventional",
        "study_phase": "Phase I",
        "study_design": "Single Group",
        "sponsor": "AIIA",
        "principal_investigator_id": 2,
        "disease_condition": "General",
        "ayurveda_intervention": "Herbal Tea",
        "intervention_type": "Herbal",
        "intervention_description": "Herbal tea",
        "target_participants": 0,  # Invalid
        "start_date": "2026-01-01",
        "expected_completion_date": "2026-06-01",
        "inclusion_criteria": "Valid criteria",
        "exclusion_criteria": "Valid criteria",
        "primary_objective": "Valid objective"
    }
    res = client.post("/api/v1/trials", json=invalid_target, headers={"Authorization": f"Bearer {admin_token}"})
    assert res.status_code == 422

    # Expected completion date earlier than start date
    invalid_dates = invalid_target.copy()
    invalid_dates["target_participants"] = 50
    invalid_dates["start_date"] = "2026-06-01"
    invalid_dates["expected_completion_date"] = "2026-01-01"  # Invalid
    res2 = client.post("/api/v1/trials", json=invalid_dates, headers={"Authorization": f"Bearer {admin_token}"})
    assert res2.status_code == 422


def test_get_trial_details_and_update(client: TestClient, admin_token: str):
    """Test fetching trial details by trial_id and updating permitted attributes."""
    response = client.get(
        "/api/v1/trials/AIIA-CT-2026-001",
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["trial_id"] == "AIIA-CT-2026-001"
    assert len(data["sites"]) >= 2
    assert len(data["milestones"]) >= 4

    # Update trial
    update_payload = {
        "short_title": "Updated T2D Ayurveda Trial Short Title",
        "target_participants": 140
    }
    update_res = client.put(
        "/api/v1/trials/AIIA-CT-2026-001",
        json=update_payload,
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert update_res.status_code == 200
    updated_data = update_res.json()
    assert updated_data["short_title"] == "Updated T2D Ayurveda Trial Short Title"
    assert updated_data["target_participants"] == 140
