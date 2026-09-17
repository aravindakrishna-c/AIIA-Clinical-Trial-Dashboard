import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.database.init_db import get_password_hash
from app.database.session import SessionLocal
from app.models.user import User
from app.models.role import Role

client = TestClient(app)

def get_token(username: str = "admin", password: str = "Password@AIIA2026!"):
    res = client.post("/api/v1/auth/login", json={"username": username, "password": password})
    assert res.status_code == 200, f"Login failed: {res.text}"
    return res.json()["access_token"]

import uuid

def test_full_phase2_lifecycle_e2e():
    suffix = uuid.uuid4().hex[:6].upper()
    trial_id_str = f"AIIA-CT-2026-E2E-{suffix}"
    proto_num_str = f"AIIA-PROTO-2026-E2E-{suffix}"
    site1_code_str = f"SITE-E2E-1-{suffix}"
    site2_code_str = f"SITE-E2E-2-{suffix}"

    admin_token = get_token("admin")
    admin_headers = {"Authorization": f"Bearer {admin_token}"}
    
    # 1. Verification of Summary counts
    res = client.get("/api/v1/trials/summary", headers=admin_headers)
    assert res.status_code == 200
    initial_summary = res.json()
    assert "total_trials" in initial_summary
    assert initial_summary["total_trials"] >= 4

    # Get investigator user ID
    users_res = client.get("/api/v1/users", headers=admin_headers)
    assert users_res.status_code == 200
    users_list = users_res.json()
    investigator = next(u for u in users_list if u["role"]["name"] == "PRINCIPAL_INVESTIGATOR")
    pi_id = investigator["id"]

    # 2. Test 1 - Create Trial
    new_trial_payload = {
        "trial_id": trial_id_str,
        "trial_title": "Evaluation of Haridra (Curcuma longa) in Allergic Rhinitis",
        "short_title": "Haridra Rhinitis Study",
        "protocol_number": proto_num_str,
        "protocol_version": "1.0",
        "protocol_version_date": "2026-09-15",
        "study_type": "Interventional",
        "study_phase": "Phase II",
        "study_design": "Randomized, Double-Blind, Placebo-Controlled",
        "disease_condition": "Allergic Rhinitis (Vataja Pratishyaya)",
        "sponsor": "All India Institute of Ayurveda",
        "sponsor_type": "Institutional",
        "sponsor_contact": "clinical-trials@aiia.gov.in",
        "principal_investigator_id": pi_id,
        "target_participants": 80,
        "start_date": "2026-10-01",
        "expected_completion_date": "2027-04-30",
        "ayurveda_intervention": "Haridra Khanda Tablet 1000mg",
        "intervention_type": "Herbal Formulation",
        "intervention_description": "Traditional classical formulation containing Curcuma longa",
        "dosage": "1000 mg",
        "route_of_administration": "Oral",
        "frequency": "Twice daily after food with lukewarm water",
        "duration": "90 Days",
        "comparator": "Placebo Tablet",
        "comparator_description": "Matching microcrystalline cellulose placebo",
        "inclusion_criteria": "Adults aged 18-60 with diagnosed Pratishyaya (Allergic Rhinitis)",
        "exclusion_criteria": "Patients with nasal polyps, severe asthma, or pregnant women",
        "primary_objective": "Reduction in Total Nasal Symptom Score (TNSS) at Day 90",
        "secondary_objectives": "Improvement in Quality of Life (RQLQ) and reduction in serum IgE levels"
    }
    
    create_res = client.post("/api/v1/trials", json=new_trial_payload, headers=admin_headers)
    assert create_res.status_code == 201, f"Trial creation failed: {create_res.text}"
    trial = create_res.json()
    assert trial["trial_id"] == trial_id_str
    assert trial["status"] == "Draft"
    trial_pk = trial["id"]

    # 3. Test 2 - Edit Trial
    update_payload = {
        "trial_title": "Evaluation of Haridra (Curcuma longa) in Allergic Rhinitis - Revised",
        "target_participants": 100,
        "primary_objective": "Reduction in TNSS score and Absolute Eosinophil Count at Day 90"
    }
    update_res = client.put(f"/api/v1/trials/{trial_pk}", json=update_payload, headers=admin_headers)
    assert update_res.status_code == 200
    updated_trial = update_res.json()
    assert updated_trial["trial_title"] == update_payload["trial_title"]
    assert updated_trial["target_participants"] == 100

    # 4. Test 3 - Add Sites
    site1_payload = {
        "site_code": site1_code_str,
        "site_name": "AIIA Main Hospital OPD",
        "institution": "All India Institute of Ayurveda",
        "location": "Mathura Road, Gautampuri",
        "city": "New Delhi",
        "state": "Delhi",
        "country": "India",
        "enrollment_target": 60,
        "site_status": "Pending"
    }
    site1_res = client.post(f"/api/v1/trials/{trial_pk}/sites", json=site1_payload, headers=admin_headers)
    assert site1_res.status_code == 201, f"Site 1 creation failed: {site1_res.text}"
    site1 = site1_res.json()
    site1_id = site1["id"]
    assert site1["site_code"] == site1_code_str

    site2_payload = {
        "site_code": site2_code_str,
        "site_name": "National Institute of Ayurveda Hospital",
        "institution": "National Institute of Ayurveda",
        "location": "Jorawar Singh Gate, Amer Road",
        "city": "Jaipur",
        "state": "Rajasthan",
        "country": "India",
        "enrollment_target": 40,
        "site_status": "Pending"
    }
    site2_res = client.post(f"/api/v1/trials/{trial_pk}/sites", json=site2_payload, headers=admin_headers)
    assert site2_res.status_code == 201
    
    # Retrieve trial sites
    sites_list_res = client.get(f"/api/v1/trials/{trial_pk}/sites", headers=admin_headers)
    assert sites_list_res.status_code == 200
    sites = sites_list_res.json()
    assert len(sites) >= 2

    # Update site status
    site_status_res = client.patch(f"/api/v1/sites/{site1_id}/status", json={"site_status": "Ethics Pending", "notes": "Submitted site docs"}, headers=admin_headers)
    assert site_status_res.status_code == 200
    assert site_status_res.json()["site_status"] == "Ethics Pending"

    # 5. Test 4 - Status Transition Workflow & Validation
    # Invalid transition directly to Completed
    invalid_res = client.patch(f"/api/v1/trials/{trial_pk}/status", json={"status": "Completed", "notes": "Premature"}, headers=admin_headers)
    assert invalid_res.status_code == 400

    # Valid step-by-step lifecycle: Draft -> Ethics Review -> Ethics Approved -> CTRI Pending -> Recruiting -> Active
    flow = ["Ethics Review", "Ethics Approved", "CTRI Pending", "Recruiting", "Active"]
    for next_st in flow:
        step_res = client.patch(f"/api/v1/trials/{trial_pk}/status", json={"status": next_st, "notes": f"Advancing to {next_st}"}, headers=admin_headers)
        assert step_res.status_code == 200, f"Transition to {next_st} failed: {step_res.text}"
        assert step_res.json()["status"] == next_st

    # 6. Test 5 - Search & Filter
    # Search by trial_id
    search_res = client.get(f"/api/v1/trials?search={trial_id_str}", headers=admin_headers)
    assert search_res.status_code == 200
    search_list = search_res.json()
    assert len(search_list) >= 1
    assert search_list[0]["trial_id"] == trial_id_str

    # Search by disease
    search_disease = client.get("/api/v1/trials?search=Rhinitis", headers=admin_headers)
    assert search_disease.status_code == 200
    assert any(t["trial_id"] == trial_id_str for t in search_disease.json())

    # Filter by status
    filter_active = client.get("/api/v1/trials?status=Active", headers=admin_headers)
    assert filter_active.status_code == 200
    assert all(t["status"] == "Active" for t in filter_active.json())

    # 7. Test 6 - Protocol Versioning
    protocol_payload = {
        "version_number": "1.1",
        "version_date": "2026-10-15",
        "change_summary": "Clarification of inclusion criteria for Pratishyaya severity scores",
        "document_reference": "AIIA-PROTO-2026-E2E-v1.1.pdf"
    }
    proto_res = client.post(f"/api/v1/trials/{trial_pk}/protocols", json=protocol_payload, headers=admin_headers)
    assert proto_res.status_code == 201
    proto_list = client.get(f"/api/v1/trials/{trial_pk}/protocols", headers=admin_headers)
    assert proto_list.status_code == 200
    protocols = proto_list.json()
    assert len(protocols) >= 2
    # Ensure current version is 1.1 and 1.0 is Superseded
    v1_1 = next(p for p in protocols if p["version_number"] == "1.1")
    v1_0 = next(p for p in protocols if p["version_number"] == "1.0")
    assert v1_1["status"] == "Current"
    assert v1_0["status"] == "Superseded"

    # 8. Test 7 - Milestones
    milestone_payload = {
        "milestone_name": "Protocol Finalization",
        "description": "Final review and sign-off by all trial steering committee members",
        "planned_date": "2026-09-20",
        "status": "Completed"
    }
    ms_res = client.post(f"/api/v1/trials/{trial_pk}/milestones", json=milestone_payload, headers=admin_headers)
    assert ms_res.status_code == 201
    ms_list = client.get(f"/api/v1/trials/{trial_pk}/milestones", headers=admin_headers)
    assert ms_list.status_code == 200
    assert len(ms_list.json()) >= 1

    # 9. Test 8 - Audit Trail Verification
    audit_res = client.get(f"/api/v1/trials/{trial_pk}/audit-logs", headers=admin_headers)
    assert audit_res.status_code == 200
    logs = audit_res.json()
    actions = [l["action"] for l in logs]
    assert "TRIAL_CREATED" in actions
    assert "TRIAL_UPDATED" in actions
    assert "TRIAL_STATUS_CHANGED" in actions
    assert "SITE_CREATED" in actions
    assert "PROTOCOL_VERSION_CREATED" in actions
    assert "MILESTONE_CREATED" in actions

    # 10. Test 9 - RBAC Permissions Enforcement
    monitor_token = get_token("monitor")
    monitor_headers = {"Authorization": f"Bearer {monitor_token}"}
    
    # Monitor has read permission
    mon_read = client.get(f"/api/v1/trials/{trial_pk}", headers=monitor_headers)
    assert mon_read.status_code == 200

    # Monitor should NOT have permission to update status or create new trials
    mon_create = client.post("/api/v1/trials", json=new_trial_payload, headers=monitor_headers)
    assert mon_create.status_code == 403

    mon_status = client.patch(f"/api/v1/trials/{trial_pk}/status", json={"status": "Suspended"}, headers=monitor_headers)
    assert mon_status.status_code == 403
