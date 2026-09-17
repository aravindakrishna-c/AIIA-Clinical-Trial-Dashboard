import pytest
from fastapi.testclient import TestClient


def test_trial_workflow_transitions(client: TestClient, admin_token: str):
    """Test valid sequential status transitions from Draft to Ethics Review, etc."""
    # AIIA-CT-2026-004 is currently Draft
    trial_code = "AIIA-CT-2026-004"

    # Step 1: Draft -> Ethics Review
    res1 = client.patch(
        f"/api/v1/trials/{trial_code}/status",
        json={"status": "Ethics Review", "notes": "Submitted protocol to IEC for initial review"},
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert res1.status_code == 200
    assert res1.json()["status"] == "Ethics Review"

    # Step 2: Ethics Review -> Ethics Approved
    res2 = client.patch(
        f"/api/v1/trials/{trial_code}/status",
        json={"status": "Ethics Approved", "notes": "IEC meeting approved protocol unconditionally"},
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert res2.status_code == 200
    assert res2.json()["status"] == "Ethics Approved"

    # Step 3: Ethics Approved -> CTRI Pending
    res3 = client.patch(
        f"/api/v1/trials/{trial_code}/status",
        json={"status": "CTRI Pending", "notes": "Application submitted to CTRI portal"},
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert res3.status_code == 200
    assert res3.json()["status"] == "CTRI Pending"

    # Step 4: CTRI Pending -> Recruiting
    res4 = client.patch(
        f"/api/v1/trials/{trial_code}/status",
        json={"status": "Recruiting", "notes": "Registration issued, recruiting participants"},
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert res4.status_code == 200
    assert res4.json()["status"] == "Recruiting"

    # Step 5: Recruiting -> Active
    res5 = client.patch(
        f"/api/v1/trials/{trial_code}/status",
        json={"status": "Active", "notes": "Target enrollment completed, active treatment ongoing"},
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert res5.status_code == 200
    assert res5.json()["status"] == "Active"

    # Step 6: Active -> Completed
    res6 = client.patch(
        f"/api/v1/trials/{trial_code}/status",
        json={"status": "Completed", "notes": "All participant visits and data lock completed"},
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert res6.status_code == 200
    assert res6.json()["status"] == "Completed"

    # Step 7: Completed -> Closed
    res7 = client.patch(
        f"/api/v1/trials/{trial_code}/status",
        json={"status": "Closed", "notes": "Final clinical study report archived"},
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert res7.status_code == 200
    assert res7.json()["status"] == "Closed"


def test_reject_invalid_status_transition(client: TestClient, admin_token: str):
    """Ensure backend validates and rejects arbitrary invalid status transitions."""
    # AIIA-CT-2026-004 is Draft. Try jumping directly to Completed (invalid)
    res = client.patch(
        "/api/v1/trials/AIIA-CT-2026-004/status",
        json={"status": "Completed", "notes": "Attempting invalid jump"},
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert res.status_code == 400
    assert "Invalid workflow transition" in res.json()["message"]


def test_workflow_audit_logging(client: TestClient, admin_token: str):
    """Verify that trial status transition records audit trail events."""
    # Execute a status transition
    client.patch(
        "/api/v1/trials/AIIA-CT-2026-004/status",
        json={"status": "Ethics Review", "notes": "Test transition"},
        headers={"Authorization": f"Bearer {admin_token}"}
    )

    audit_res = client.get(
        "/api/v1/trials/AIIA-CT-2026-004/audit-trail",
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert audit_res.status_code == 200
    logs = audit_res.json()
    assert len(logs) > 0
    actions = [l["action"] for l in logs]
    assert "TRIAL_STATUS_CHANGED" in actions
