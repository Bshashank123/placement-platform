"""
Module 1 Tests — Auth + Tenant System
Run: cd backend && pytest tests/ -v
"""
import os
os.environ["DATABASE_URL"] = "sqlite:///./test_module1.db"  # must be before app import

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.main import app
from app.database import Base, get_db
from app.models import Tenant  # noqa

# ── In-memory SQLite for tests ────────────────────────────────────────────────
TEST_DB_URL = "sqlite:///./test_module1.db"
engine_test = create_engine(TEST_DB_URL, connect_args={"check_same_thread": False})
Session = sessionmaker(autocommit=False, autoflush=False, bind=engine_test)
Base.metadata.create_all(bind=engine_test)  # create tables in test DB


def override_db():
    db = Session()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_db
client = TestClient(app)


@pytest.fixture(autouse=True)
def fresh_db():
    """Wipe and recreate all tables before every test — prevents duplicate-email collisions."""
    Base.metadata.drop_all(bind=engine_test)
    Base.metadata.create_all(bind=engine_test)
    db = Session()
    db.add(Tenant(name="Test College", slug="test", domain="test.edu"))
    db.commit()
    db.close()
    yield


# ── Signup tests ──────────────────────────────────────────────────────────────

class TestSignup:
    def test_valid_student_signup(self):
        r = client.post("/api/v1/auth/signup", json={
            "email": "alice@test.edu", "password": "Password1", "name": "Alice"
        })
        assert r.status_code == 201
        assert r.json()["role"] == "student"

    def test_unknown_domain_rejected(self):
        r = client.post("/api/v1/auth/signup", json={
            "email": "bob@nowhere.xyz", "password": "Password1", "name": "Bob"
        })
        assert r.status_code == 400
        assert "No college found" in r.json()["detail"]

    def test_duplicate_email_rejected(self):
        payload = {"email": "dup@test.edu", "password": "Password1", "name": "Dup"}
        client.post("/api/v1/auth/signup", json=payload)
        r = client.post("/api/v1/auth/signup", json=payload)
        assert r.status_code == 409

    def test_short_password_rejected(self):
        r = client.post("/api/v1/auth/signup", json={
            "email": "short@test.edu", "password": "abc", "name": "Short"
        })
        assert r.status_code == 422

    def test_invalid_email_rejected(self):
        r = client.post("/api/v1/auth/signup", json={
            "email": "notanemail", "password": "Password1", "name": "Bad"
        })
        assert r.status_code == 422

    def test_faculty_signup(self):
        r = client.post("/api/v1/auth/signup", json={
            "email": "prof@test.edu", "password": "Password1",
            "name": "Prof Test", "role": "faculty"
        })
        assert r.status_code == 201
        assert r.json()["role"] == "faculty"


# ── Login tests ───────────────────────────────────────────────────────────────

class TestLogin:
    def _create_user(self):
        client.post("/api/v1/auth/signup", json={
            "email": "loginuser@test.edu", "password": "Password1", "name": "Login"
        })

    def test_correct_credentials_return_token(self):
        self._create_user()
        r = client.post("/api/v1/auth/login", json={
            "email": "loginuser@test.edu", "password": "Password1"
        })
        assert r.status_code == 200
        data = r.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"
        assert data["user"]["email"] == "loginuser@test.edu"

    def test_wrong_password_rejected(self):
        self._create_user()
        r = client.post("/api/v1/auth/login", json={
            "email": "loginuser@test.edu", "password": "WrongPass"
        })
        assert r.status_code == 401

    def test_nonexistent_user_rejected(self):
        r = client.post("/api/v1/auth/login", json={
            "email": "ghost@test.edu", "password": "Password1"
        })
        assert r.status_code == 401


# ── /me tests ─────────────────────────────────────────────────────────────────

class TestMe:
    def _token(self):
        client.post("/api/v1/auth/signup", json={
            "email": "meuser@test.edu", "password": "Password1", "name": "Me"
        })
        r = client.post("/api/v1/auth/login", json={
            "email": "meuser@test.edu", "password": "Password1"
        })
        return r.json()["access_token"]

    def test_me_returns_user(self):
        token = self._token()
        r = client.get("/api/v1/auth/me",
                       headers={"Authorization": f"Bearer {token}"})
        assert r.status_code == 200
        assert r.json()["email"] == "meuser@test.edu"

    def test_me_no_token(self):
        r = client.get("/api/v1/auth/me")
        assert r.status_code in (401, 403)  # HTTPBearer raises 403; some versions 401

    def test_me_bad_token(self):
        r = client.get("/api/v1/auth/me",
                       headers={"Authorization": "Bearer faketoken"})
        assert r.status_code == 401


# ── Tenant isolation test ─────────────────────────────────────────────────────

class TestTenantIsolation:
    def test_tenant_detected_from_domain(self):
        """student@test.edu must be assigned to Test College tenant."""
        r = client.post("/api/v1/auth/signup", json={
            "email": "isolation@test.edu", "password": "Password1", "name": "Iso"
        })
        assert r.status_code == 201
        assert r.json()["tenant_id"] > 0

    def test_cross_domain_blocked(self):
        """Different unregistered domain must fail."""
        r = client.post("/api/v1/auth/signup", json={
            "email": "test@othercollege.edu", "password": "Password1", "name": "Other"
        })
        assert r.status_code == 400
