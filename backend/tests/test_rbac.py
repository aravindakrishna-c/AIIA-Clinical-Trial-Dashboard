from fastapi.testclient import TestClient


def test_admin_can_access_users_endpoint(client: TestClient, admin_token: str):
    response = client.get(
        "/api/v1/users",
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert response.status_code == 200
    assert isinstance(response.json(), list)


def test_admin_can_access_audit_logs(client: TestClient, admin_token: str):
    response = client.get(
        "/api/v1/audit-logs",
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert response.status_code == 200
    assert isinstance(response.json(), list)


def test_coordinator_denied_from_users_endpoint(client: TestClient, coordinator_token: str):
    response = client.get(
        "/api/v1/users",
        headers={"Authorization": f"Bearer {coordinator_token}"}
    )
    assert response.status_code == 403
    assert "Access denied" in response.text or "403" in response.text


def test_coordinator_denied_from_audit_logs(client: TestClient, coordinator_token: str):
    response = client.get(
        "/api/v1/audit-logs",
        headers={"Authorization": f"Bearer {coordinator_token}"}
    )
    assert response.status_code == 403


def test_ethics_committee_denied_from_users(client: TestClient, ethics_token: str):
    response = client.get(
        "/api/v1/users",
        headers={"Authorization": f"Bearer {ethics_token}"}
    )
    assert response.status_code == 403


def test_unauthenticated_denied_from_protected_endpoints(client: TestClient):
    res1 = client.get("/api/v1/users")
    assert res1.status_code == 401

    res2 = client.get("/api/v1/audit-logs")
    assert res2.status_code == 401
