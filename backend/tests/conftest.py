import pytest
from typing import Generator
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session

from app.main import app
from app.models.base import Base
from app.database.session import get_db
from sqlalchemy.pool import StaticPool
from app.database.init_db import init_db, DEMO_PASSWORD

TEST_DATABASE_URL = "sqlite:///:memory:"

test_engine = create_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)


@pytest.fixture(scope="session", autouse=True)
def setup_test_db():
    Base.metadata.create_all(bind=test_engine)
    db = TestingSessionLocal()
    try:
        init_db(db)
    finally:
        db.close()
    yield
    Base.metadata.drop_all(bind=test_engine)


@pytest.fixture
def db_session() -> Generator[Session, None, None]:
    connection = test_engine.connect()
    transaction = connection.begin()
    session = TestingSessionLocal(bind=connection)
    try:
        yield session
    finally:
        session.close()
        transaction.rollback()
        connection.close()


@pytest.fixture
def client(db_session: Session) -> Generator[TestClient, None, None]:
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


@pytest.fixture
def admin_token(client: TestClient) -> str:
    response = client.post(
        "/api/v1/auth/login",
        json={"username": "admin", "password": DEMO_PASSWORD}
    )
    assert response.status_code == 200
    return response.json()["access_token"]


@pytest.fixture
def coordinator_token(client: TestClient) -> str:
    response = client.post(
        "/api/v1/auth/login",
        json={"username": "coordinator", "password": DEMO_PASSWORD}
    )
    assert response.status_code == 200
    return response.json()["access_token"]


@pytest.fixture
def ethics_token(client: TestClient) -> str:
    response = client.post(
        "/api/v1/auth/login",
        json={"username": "ethics", "password": DEMO_PASSWORD}
    )
    assert response.status_code == 200
    return response.json()["access_token"]


@pytest.fixture
def investigator_token(client: TestClient) -> str:
    response = client.post(
        "/api/v1/auth/login",
        json={"username": "investigator", "password": DEMO_PASSWORD}
    )
    assert response.status_code == 200
    return response.json()["access_token"]


@pytest.fixture
def monitor_token(client: TestClient) -> str:
    response = client.post(
        "/api/v1/auth/login",
        json={"username": "monitor", "password": DEMO_PASSWORD}
    )
    assert response.status_code == 200
    return response.json()["access_token"]


@pytest.fixture
def regulator_token(client: TestClient) -> str:
    response = client.post(
        "/api/v1/auth/login",
        json={"username": "regulator", "password": DEMO_PASSWORD}
    )
    assert response.status_code == 200
    return response.json()["access_token"]

