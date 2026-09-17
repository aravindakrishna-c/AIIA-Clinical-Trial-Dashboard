from fastapi.testclient import TestClient
import uuid


def test_create_user_success(client: TestClient, admin_token: str):
    unique_suffix = str(uuid.uuid4())[:8]
    payload = {
        "username": f"user_{unique_suffix}",
        "email": f"user_{unique_suffix}@aiia.gov.in",
        "full_name": "Test Trial Coordinator",
        "role_id": 3,  # STUDY_COORDINATOR
        "password": "SecurePassword123!"
    }
    response = client.post(
        "/api/v1/users",
        json=payload,
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert response.status_code == 201
    data = response.json()
    assert data["username"] == payload["username"]
    assert data["email"] == payload["email"]
    assert data["is_active"] is True
    assert "password" not in data
    assert "password_hash" not in data


def test_create_user_duplicate_username(client: TestClient, admin_token: str):
    payload = {
        "username": "admin",  # Already exists
        "email": "another_admin@aiia.gov.in",
        "full_name": "Duplicate Admin",
        "role_id": 1,
        "password": "SecurePassword123!"
    }
    response = client.post(
        "/api/v1/users",
        json=payload,
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert response.status_code == 400
    assert "already registered" in response.text


def test_create_user_duplicate_email(client: TestClient, admin_token: str):
    payload = {
        "username": "unique_username_987",
        "email": "admin@aiia.gov.in",  # Already exists
        "full_name": "Duplicate Email User",
        "role_id": 1,
        "password": "SecurePassword123!"
    }
    response = client.post(
        "/api/v1/users",
        json=payload,
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert response.status_code == 400
    assert "already registered" in response.text


def test_toggle_user_status(client: TestClient, admin_token: str):
    # 1. Create user
    unique_suffix = str(uuid.uuid4())[:8]
    user_payload = {
        "username": f"toggle_{unique_suffix}",
        "email": f"toggle_{unique_suffix}@aiia.gov.in",
        "full_name": "Toggle Test User",
        "role_id": 2,
        "password": "TogglePass123!"
    }
    create_res = client.post(
        "/api/v1/users",
        json=user_payload,
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    user_id = create_res.json()["id"]

    # 2. Deactivate
    deact_res = client.patch(
        f"/api/v1/users/{user_id}/status",
        json={"is_active": False},
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert deact_res.status_code == 200
    assert deact_res.json()["is_active"] is False

    # 3. Verify deactivated user cannot login
    login_res = client.post(
        "/api/v1/auth/login",
        json={"username": user_payload["username"], "password": user_payload["password"]}
    )
    assert login_res.status_code == 403

    # 4. Reactivate
    react_res = client.patch(
        f"/api/v1/users/{user_id}/status",
        json={"is_active": True},
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert react_res.status_code == 200
    assert react_res.json()["is_active"] is True
