import pytest
from datetime import date
from fastapi.testclient import TestClient


def test_ethics_submission_workflow(client: TestClient, investigator_token: str, admin_token: str):
    inv_headers = {"Authorization": f"Bearer {investigator_token}"}
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    # 1. PI drafts and submits an ethics protocol
    sub_payload = {
        "trial_id": 1,
        "protocol_version": "1.2",
        "submission_date": str(date.today()),
        "comments": "IEC Protocol Amendment submission for adding exploratory serum cytokines."
    }
    resp = client.post("/api/v1/ethics", json=sub_payload, headers=inv_headers)
    assert resp.status_code == 201, resp.text
    sub_data = resp.json()
    sub_id = sub_data["id"]
    assert sub_data["status"] in ["Submitted", "Under Review"]

    # 2. IEC Review and Approval
    dec_payload = {
        "decision": "Approved",
        "review_date": str(date.today()),
        "approval_number": "AIIA/IEC/2026/099-AM",
        "approval_date": str(date.today()),
        "expiry_date": "2027-03-31",
        "comments": "Ethics amendment reviewed in full quorum and sanctioned."
    }
    dec_resp = client.post(f"/api/v1/ethics/{sub_id}/decision", json=dec_payload, headers=admin_headers)
    assert dec_resp.status_code == 200, dec_resp.text
    approved_sub = dec_resp.json()
    assert approved_sub["status"] == "Approved"
    assert approved_sub["approval_number"] == "AIIA/IEC/2026/099-AM"


def test_ctri_and_regulatory_events(client: TestClient, admin_token: str):
    headers = {"Authorization": f"Bearer {admin_token}"}

    # Update CTRI record
    ctri_payload = {
        "ctri_number": "CTRI/2026/03/099999",
        "status": "Registered",
        "registration_date": str(date.today()),
        "next_update_deadline": "2026-09-30",
        "notes": "Full registration certificate uploaded.",
        "responsible_person": "Dr. Rajesh Sharma"
    }
    ctri_resp = client.put("/api/v1/ctri/1", json=ctri_payload, headers=headers)
    assert ctri_resp.status_code == 200, ctri_resp.text
    assert ctri_resp.json()["status"] == "Registered"

    # Create regulatory event
    event_payload = {
        "trial_id": 1,
        "event_type": "Ayush GCP Annual Safety PSUR",
        "due_date": "2026-11-30",
        "notes": "Annual Periodic Safety Update Report submission.",
        "responsible_person": "Dr. Sunita Rao"
    }
    ev_resp = client.post("/api/v1/regulatory/events", json=event_payload, headers=headers)
    assert ev_resp.status_code == 201, ev_resp.text
    assert ev_resp.json()["status"] == "Pending"
