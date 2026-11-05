import pytest
from sqlalchemy.orm import Session
from fastapi.testclient import TestClient
from app.main import app
from app.database.session import engine, get_db

@pytest.fixture
def client():
    # Tests run on real PostgreSQL; external transaction rolls back every fixture.
    connection = engine.connect()
    transaction = connection.begin()
    session = Session(bind=connection, join_transaction_mode="create_savepoint", expire_on_commit=False)
    app.dependency_overrides[get_db] = lambda: session
    with TestClient(app) as client:
        yield client
    app.dependency_overrides.clear()
    session.close()
    transaction.rollback()
    connection.close()

@pytest.fixture
def auth(client):
    def create(email="alice@example.com"):
        assert client.post("/api/auth/register", json={"username": "tester", "email": email, "password": "secretpass123"}).status_code == 201
        token = client.post("/api/auth/login", json={"email": email, "password": "secretpass123"}).json()["token"]
        return {"Authorization": f"Bearer {token}"}
    return create
