from fastapi.testclient import TestClient
import uuid
from app.database.init_db import DEMO_PASSWORD


def test_audit_logs_record_login(client: TestClient, admin_token: str):
    # Perform successful login
    client.post(
        "/api/v1/auth/login",
        json={"username": "admin", "password": DEMO_PASSWORD}
    )

    # Fetch audit logs
    res = client.get(
        "/api/v1/audit-logs",
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert res.status_code == 200
    logs = res.json()
    assert len(logs) > 0

    actions = [log["action"] for log in logs]
    assert "LOGIN_SUCCESS" in actions


def test_audit_logs_record_failed_login(client: TestClient, admin_token: str):
    # Trigger failed login
    client.post(
        "/api/v1/auth/login",
        json={"username": "investigator", "password": "WrongPassword999!"}
    )

    res = client.get(
        "/api/v1/audit-logs?action=LOGIN_FAILED",
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert res.status_code == 200
    logs = res.json()
    assert len(logs) > 0
    assert any("LOGIN_FAILED" in log["action"] for log in logs)


def test_audit_logs_record_user_creation(client: TestClient, admin_token: str):
    unique_suffix = str(uuid.uuid4())[:8]
    client.post(
        "/api/v1/users",
        json={
            "username": f"audit_u_{unique_suffix}",
            "email": f"audit_u_{unique_suffix}@aiia.gov.in",
            "full_name": "Audit Track User",
            "role_id": 4,
            "password": "Password123!"
        },
        headers={"Authorization": f"Bearer {admin_token}"}
    )

    res = client.get(
        "/api/v1/audit-logs?action=USER_CREATED",
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert res.status_code == 200
    logs = res.json()
    assert any(f"audit_u_{unique_suffix}" in log["description"] for log in logs)


def test_audit_logs_immutable_no_update_or_delete_routes(client: TestClient, admin_token: str):
    # Verify PUT/DELETE are rejected on audit endpoints
    put_res = client.put(
        "/api/v1/audit-logs/1",
        json={"description": "Tampered description"},
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert put_res.status_code in [404, 405]

    delete_res = client.delete(
        "/api/v1/audit-logs/1",
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert delete_res.status_code in [404, 405]
