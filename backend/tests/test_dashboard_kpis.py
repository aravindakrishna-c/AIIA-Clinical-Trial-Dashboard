import pytest
from fastapi.testclient import TestClient


def test_real_time_dashboard_metrics(client: TestClient, admin_token: str):
    headers = {"Authorization": f"Bearer {admin_token}"}
    
    resp = client.get("/api/v1/dashboard/metrics", headers=headers)
    assert resp.status_code == 200, resp.text
    data = resp.json()
    
    # Check trial KPIs
    assert "trial_stats" in data
    assert data["trial_stats"]["total_trials"] >= 3
    
    # Check participant KPIs
    assert "participant_stats" in data
    assert data["participant_stats"]["total_screened"] >= 5
    assert data["participant_stats"]["enrolled"] >= 1
    assert data["participant_stats"]["randomized"] >= 1
    
    # Check safety KPIs
    assert "safety_stats" in data
    assert "total_ae" in data["safety_stats"]
    assert "total_sae" in data["safety_stats"]
    
    # Check enrollment progress
    assert "trial_enrollment_progress" in data
    assert len(data["trial_enrollment_progress"]) >= 1
    first_progress = data["trial_enrollment_progress"][0]
    assert "enrollment_percentage" in first_progress
    assert isinstance(first_progress["enrollment_percentage"], (int, float))
    
    # Check alerts
    alerts_resp = client.get("/api/v1/dashboard/alerts", headers=headers)
    assert alerts_resp.status_code == 200, alerts_resp.text
    alerts = alerts_resp.json()
    assert isinstance(alerts, list)
