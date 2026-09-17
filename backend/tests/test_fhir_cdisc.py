import pytest
from fastapi.testclient import TestClient


def test_fhir_r4_endpoints(client: TestClient, admin_token: str):
    headers = {"Authorization": f"Bearer {admin_token}"}

    # 1. FHIR Patient
    p_resp = client.get("/api/v1/fhir/Patient/1", headers=headers)
    assert p_resp.status_code == 200, p_resp.text
    p_fhir = p_resp.json()
    assert p_fhir["resourceType"] == "Patient"
    assert "identifier" in p_fhir
    assert "gender" in p_fhir

    # 2. FHIR Condition
    c_resp = client.get("/api/v1/fhir/Condition/1", headers=headers)
    assert c_resp.status_code == 200, c_resp.text
    c_fhir = c_resp.json()
    assert c_fhir["resourceType"] == "Condition"

    # 3. FHIR Medication
    m_resp = client.get("/api/v1/fhir/Medication/1", headers=headers)
    assert m_resp.status_code == 200, m_resp.text
    assert m_resp.json()["resourceType"] == "Medication"

    # 4. FHIR Encounter
    e_resp = client.get("/api/v1/fhir/Encounter/1", headers=headers)
    assert e_resp.status_code == 200, e_resp.text
    assert e_resp.json()["resourceType"] == "Encounter"

    # 5. FHIR Consent
    cons_resp = client.get("/api/v1/fhir/Consent/1", headers=headers)
    assert cons_resp.status_code == 200, cons_resp.text
    assert cons_resp.json()["resourceType"] == "Consent"


def test_cdisc_dataset_exports(client: TestClient, admin_token: str):
    headers = {"Authorization": f"Bearer {admin_token}"}

    # CDISC DM (Demographics) CSV export
    dm_resp = client.get("/api/v1/export/cdisc/dm?trial_id=1", headers=headers)
    assert dm_resp.status_code == 200, dm_resp.text
    assert "text/csv" in dm_resp.headers["content-type"]
    assert "USUBJID" in dm_resp.text

    # CDISC AE (Adverse Events) CSV export
    ae_resp = client.get("/api/v1/export/cdisc/ae?trial_id=1", headers=headers)
    assert ae_resp.status_code == 200, ae_resp.text
    assert "text/csv" in ae_resp.headers["content-type"]
    assert "AETERM" in ae_resp.text

    # CDISC SV (Subject Visits) CSV export
    sv_resp = client.get("/api/v1/export/cdisc/sv?trial_id=1", headers=headers)
    assert sv_resp.status_code == 200, sv_resp.text
    assert "text/csv" in sv_resp.headers["content-type"]
    assert "VISITNUM" in sv_resp.text
