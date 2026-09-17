import pytest
from fastapi.testclient import TestClient


def test_create_and_manage_trial_site(client: TestClient, admin_token: str):
    """Test adding a site, updating its demographics, and transitioning its status."""
    trial_code = "AIIA-CT-2026-003"

    # Add a new site
    site_payload = {
        "site_code": "SITE-VNS-001",
        "site_name": "Faculty of Ayurveda, IMS BHU Hospital",
        "institution": "Banaras Hindu University",
        "location": "Aurobindo Colony, BHU Campus",
        "city": "Varanasi",
        "state": "Uttar Pradesh",
        "country": "India",
        "site_investigator_id": 2,
        "site_status": "Pending",
        "enrollment_target": 50
    }
    create_res = client.post(
        f"/api/v1/trials/{trial_code}/sites",
        json=site_payload,
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert create_res.status_code == 201
    site_data = create_res.json()
    assert site_data["site_code"] == "SITE-VNS-001"
    assert site_data["site_status"] == "Pending"
    site_id = site_data["id"]

    # Reject duplicate site code for same trial
    dup_res = client.post(
        f"/api/v1/trials/{trial_code}/sites",
        json=site_payload,
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert dup_res.status_code == 400
    assert "already registered" in dup_res.json()["message"]

    # Valid site transition: Pending -> Ethics Pending
    trans1 = client.patch(
        f"/api/v1/sites/{site_id}/status",
        json={"site_status": "Ethics Pending", "notes": "Local IEC submission completed"},
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert trans1.status_code == 200
    assert trans1.json()["site_status"] == "Ethics Pending"

    # Valid site transition: Ethics Pending -> Activated
    trans2 = client.patch(
        f"/api/v1/sites/{site_id}/status",
        json={"site_status": "Activated", "notes": "Site initiation visit cleared"},
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert trans2.status_code == 200
    assert trans2.json()["site_status"] == "Activated"
    assert trans2.json()["activation_date"] is not None

    # Valid site transition: Activated -> Recruiting
    trans3 = client.patch(
        f"/api/v1/sites/{site_id}/status",
        json={"site_status": "Recruiting", "notes": "First participant screened"},
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert trans3.status_code == 200
    assert trans3.json()["site_status"] == "Recruiting"


def test_reject_invalid_site_status_transition(client: TestClient, admin_token: str):
    """Ensure site cannot become Recruiting directly from Pending."""
    trial_code = "AIIA-CT-2026-003"
    site_payload = {
        "site_code": "SITE-ERR-001",
        "site_name": "Test Site Error",
        "institution": "Test Inst",
        "location": "Address",
        "city": "City",
        "state": "State",
        "country": "India",
        "site_status": "Pending",
        "enrollment_target": 20
    }
    create_res = client.post(
        f"/api/v1/trials/{trial_code}/sites",
        json=site_payload,
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert create_res.status_code == 201
    site_id = create_res.json()["id"]

    # Invalid jump: Pending -> Recruiting
    inv_res = client.patch(
        f"/api/v1/sites/{site_id}/status",
        json={"site_status": "Recruiting"},
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert inv_res.status_code == 400
    assert "Invalid site status transition" in inv_res.json()["message"]
