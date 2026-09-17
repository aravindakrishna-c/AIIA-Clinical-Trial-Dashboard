from fastapi.testclient import TestClient
from app.database.init_db import DEMO_PASSWORD


def test_login_success(client: TestClient):
    response = client.post(
        "/api/v1/auth/login",
        json={"username": "admin", "password": DEMO_PASSWORD}
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert data["user"]["username"] == "admin"
    assert "password" not in data["user"]
    assert "password_hash" not in data["user"]
    assert "VIEW_DASHBOARD" in data["permissions"]


def test_login_incorrect_password(client: TestClient):
    response = client.post(
        "/api/v1/auth/login",
        json={"username": "admin", "password": "WrongPassword123!"}
    )
    assert response.status_code == 401
    assert "detail" in response.json() or "error" in response.json()


def test_login_unknown_user(client: TestClient):
    response = client.post(
        "/api/v1/auth/login",
        json={"username": "non_existent_user_999", "password": "SomePassword123!"}
    )
    assert response.status_code == 401


def test_get_current_user_me(client: TestClient, admin_token: str):
    response = client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["user"]["username"] == "admin"
    assert data["role_name"] == "ADMIN"
    assert "VIEW_DASHBOARD" in data["permissions"]


def test_logout(client: TestClient, admin_token: str):
    response = client.post(
        "/api/v1/auth/logout",
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert response.status_code == 200
    assert "Successfully logged out" in response.json()["message"]


def test_unauthenticated_request_rejected(client: TestClient):
    response = client.get("/api/v1/auth/me")
    assert response.status_code == 401
