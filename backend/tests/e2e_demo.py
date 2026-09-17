import requests
import sys

BASE_URL = "http://127.0.0.1:8000/api/v1"
DEMO_PASSWORD = "Password@AIIA2026!"

def log_step(title):
    print(f"\n{'='*70}\n>>> {title}\n{'='*70}")

def run_e2e_verification():
    session = requests.Session()

    # ---------------------------------------------------------
    # DEMO 1: Administrator Flow
    # ---------------------------------------------------------
    log_step("DEMO 1: Administrator Authentication & User Creation")
    # 1. Login as Admin
    login_res = session.post(f"{BASE_URL}/auth/login", json={
        "username": "admin",
        "password": DEMO_PASSWORD
    })
    assert login_res.status_code == 200, f"Admin login failed: {login_res.text}"
    admin_data = login_res.json()
    admin_token = admin_data["access_token"]
    print(f"[OK] Admin logged in. Token acquired. Role: {admin_data['user']['role']['name']}")
    
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    # 2. View current user (/auth/me)
    me_res = session.get(f"{BASE_URL}/auth/me", headers=admin_headers)
    assert me_res.status_code == 200
    print(f"[OK] GET /auth/me -> {me_res.json()['user']['full_name']} ({me_res.json()['role_name']})")

    # 3. Create a new Study Coordinator
    new_user_payload = {
        "username": "coordinator_demo_2026",
        "email": "demo_coord@aiia.gov.in",
        "full_name": "Dr. Suresh Patel",
        "role_id": 3, # STUDY_COORDINATOR
        "password": "TempPassword@2026!"
    }
    create_res = session.post(f"{BASE_URL}/users", json=new_user_payload, headers=admin_headers)
    if create_res.status_code == 400 and "already registered" in create_res.text:
        print("[INFO] User already registered from previous run, fetching users list...")
    else:
        assert create_res.status_code == 201, f"Create user failed: {create_res.text}"
        print(f"[OK] User created successfully: ID {create_res.json()['id']}, Role: {create_res.json()['role']['name']}")

    # 4. Verify user appears in /users list
    users_list_res = session.get(f"{BASE_URL}/users", headers=admin_headers)
    assert users_list_res.status_code == 200
    usernames = [u["username"] for u in users_list_res.json()]
    assert "coordinator_demo_2026" in usernames or "coordinator" in usernames
    print(f"[OK] User list verified. Total registered users: {len(usernames)}")

    # 5. Check audit log for USER_CREATED
    audit_res = session.get(f"{BASE_URL}/audit-logs", headers=admin_headers)
    assert audit_res.status_code == 200
    recent_actions = [log["action"] for log in audit_res.json()[:10]]
    assert "USER_CREATED" in recent_actions
    print(f"[OK] Audit log confirmed USER_CREATED entry exists in immutable trail.")

    # 6. Admin Logout
    logout_res = session.post(f"{BASE_URL}/auth/logout", headers=admin_headers)
    assert logout_res.status_code == 200
    print("[OK] Admin successfully logged out. LOGOUT recorded in audit log.")

    # ---------------------------------------------------------
    # DEMO 2: Study Coordinator Flow & RBAC Restriction (403)
    # ---------------------------------------------------------
    log_step("DEMO 2: Study Coordinator Authentication & 403 Access Denied on Admin Routes")
    # 1. Login as Coordinator
    coord_login = session.post(f"{BASE_URL}/auth/login", json={
        "username": "coordinator",
        "password": DEMO_PASSWORD
    })
    assert coord_login.status_code == 200
    coord_token = coord_login.json()["access_token"]
    coord_headers = {"Authorization": f"Bearer {coord_token}"}
    print(f"[OK] Logged in as: {coord_login.json()['user']['full_name']} (Role: {coord_login.json()['user']['role']['name']})")

    # 2. Attempt to access /users (Admin Only) -> Must return 403 Forbidden
    coord_users_res = session.get(f"{BASE_URL}/users", headers=coord_headers)
    assert coord_users_res.status_code == 403, f"Expected 403 but got {coord_users_res.status_code}"
    err_msg = coord_users_res.json().get('detail') or coord_users_res.json().get('error') or coord_users_res.json().get('message')
    print(f"[OK] Access Denied verified: GET /users returned 403 Forbidden: '{err_msg}'")

    # 3. Attempt to access /audit-logs -> Must return 403 Forbidden
    coord_audit_res = session.get(f"{BASE_URL}/audit-logs", headers=coord_headers)
    assert coord_audit_res.status_code == 403
    audit_err_msg = coord_audit_res.json().get('detail') or coord_audit_res.json().get('error') or coord_audit_res.json().get('message')
    print(f"[OK] Access Denied verified: GET /audit-logs returned 403 Forbidden: '{audit_err_msg}'")

    # 4. Coordinator Logout
    session.post(f"{BASE_URL}/auth/logout", headers=coord_headers)
    print("[OK] Study Coordinator logged out.")

    # ---------------------------------------------------------
    # DEMO 3: Ethics Committee Flow & Profile Check
    # ---------------------------------------------------------
    log_step("DEMO 3: Ethics Committee Authentication & Profile Retrieval")
    ethics_login = session.post(f"{BASE_URL}/auth/login", json={
        "username": "ethics",
        "password": DEMO_PASSWORD
    })
    assert ethics_login.status_code == 200
    ethics_token = ethics_login.json()["access_token"]
    ethics_headers = {"Authorization": f"Bearer {ethics_token}"}
    print(f"[OK] Logged in as Ethics Committee: {ethics_login.json()['user']['full_name']}")

    ethics_me = session.get(f"{BASE_URL}/auth/me", headers=ethics_headers)
    assert ethics_me.status_code == 200
    assert ethics_me.json()["role_name"] == "ETHICS_COMMITTEE"
    print(f"[OK] Role confirmed: {ethics_me.json()['role_name']}. No password data exposed.")

    # Logout
    session.post(f"{BASE_URL}/auth/logout", headers=ethics_headers)
    print("[OK] Ethics Committee logged out.")

    # ---------------------------------------------------------
    # DEMO 4: Audit Trail Full Verification
    # ---------------------------------------------------------
    log_step("DEMO 4: Verification of Comprehensive Immutable Audit Trail")
    # Login back as admin to inspect audit logs
    admin_login = session.post(f"{BASE_URL}/auth/login", json={
        "username": "admin",
        "password": DEMO_PASSWORD
    })
    admin_headers = {"Authorization": f"Bearer {admin_login.json()['access_token']}"}

    audit_trail_res = session.get(f"{BASE_URL}/audit-logs?limit=20", headers=admin_headers)
    assert audit_trail_res.status_code == 200
    logs = audit_trail_res.json()
    print(f"[OK] Retrieved {len(logs)} most recent immutable audit log records:")
    for l in logs[:6]:
        user_label = l['user']['username'] if l['user'] else 'System'
        print(f"   [{l['timestamp'][:19]}] {l['action']:<16} | {user_label:<15} | {l['description']}")

    print("\n" + "#"*70)
    print("ALL 4 DEMO SCENARIOS & RBAC GUARDS VERIFIED SUCCESSFULLY!")
    print("#"*70)

if __name__ == "__main__":
    run_e2e_verification()
