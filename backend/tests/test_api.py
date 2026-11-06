from datetime import datetime, timedelta, timezone
import jwt
import pytest
from pydantic import SecretStr
from sqlalchemy import select
from app.database.session import SessionLocal
from app.database.models import Movie
from app.core.config import get_settings
from app.main import app
from app.modules.recommendations.client import get_recommendation_client


def test_catalog(client):
    movies = client.get("/api/movies").json()
    assert len(movies) == 20
    assert client.get("/api/movies/1").json()["title"] == "Inception"
    assert client.get("/api/movies/9999").status_code == 404
    assert client.get("/api/movies/0").status_code == 400
    assert len(client.get("/api/movies?search=Inception&genre=Sci-Fi").json()) == 1
    assert client.get("/api/movies?search=nonexistentxyz").json() == []
    assert all(isinstance(m["genres"], list) and isinstance(m["cast"], list) for m in movies)


def test_auth_and_email_normalization(client):
    body = {"username": " Alice ", "email": " ALICE@EXAMPLE.COM ", "password": "secretpass123"}
    response = client.post("/api/auth/register", json=body)
    assert response.status_code == 201
    assert response.json() == {"id": response.json()["id"], "username": "Alice", "email": "alice@example.com"}
    assert client.post("/api/auth/register", json=body).status_code == 409
    assert client.post("/api/auth/login", json={"email": "alice@example.com", "password": "wrongpass123"}).status_code == 401
    assert client.post("/api/auth/login", json={"email": "alice@example.com", "password": "secretpass123"}).status_code == 200

@pytest.mark.parametrize("path", ["/api/watchlist", "/api/watched"])
def test_guards(client, path):
    assert client.get(path).status_code == 401
    assert client.get(path, headers={"Authorization": "Bearer invalid"}).status_code == 401
    settings = get_settings()
    token = jwt.encode({"sub":"1", "iat":datetime.now(timezone.utc)-timedelta(hours=2), "exp":datetime.now(timezone.utc)-timedelta(hours=1)}, settings.jwt_secret_key, algorithm=settings.jwt_algorithm)
    assert client.get(path, headers={"Authorization": f"Bearer {token}"}).status_code == 401


def test_watchlist_isolation(client, auth):
    a, b = auth(), auth("bob@example.com")
    assert client.get("/api/watchlist", headers=a).json() == []
    added = client.post("/api/watchlist", headers=a, json={"movieId":1,"movie_id":1,"user_id":999})
    assert added.status_code == 201 and added.json()["data"]["movie_id"] == 1
    assert client.post("/api/watchlist", headers=a, json={"movieId":1}).status_code == 409
    assert client.post("/api/watchlist", headers=a, json={"movieId":9999}).status_code == 404
    assert client.get("/api/watchlist", headers=b).json() == []
    assert client.delete("/api/watchlist/1", headers=b).status_code == 404
    assert len(client.get("/api/watchlist", headers=a).json()) == 1
    assert client.delete("/api/watchlist/1", headers=a).status_code == 204
    assert client.get("/api/watchlist", headers=a).json() == []


def test_reviews_repeat_and_isolation(client, auth):
    a, b = auth(), auth("bob@example.com")
    client.post("/api/watchlist", headers=a, json={"movieId":1})
    body = {"movieId":1,"movie_id":1,"rating":5,"review":"<img src=x onerror=alert(1)>","opinion":"ignored", "user_id":999}
    assert client.post("/api/watched", headers=a, json=body).status_code == 201
    assert client.post("/api/watched", headers=a, json=body).status_code == 201
    items = client.get("/api/watched", headers=a).json()
    assert len(items) == 2 and items[0]["review"] == body["review"]
    assert items[0]["created_at"].endswith("Z") or "+00:00" in items[0]["created_at"]
    assert client.get("/api/watched", headers=b).json() == []
    assert len(client.get("/api/watchlist", headers=a).json()) == 1

@pytest.mark.parametrize("changes", [{"rating":0},{"rating":6},{"rating":True},{"rating":1.5},{"review":"  "},{"movieId":-1}])
def test_review_validation(client, auth, changes):
    body = {"movieId":1,"rating":5,"review":"Nice"} | changes
    result = client.post("/api/watched", headers=auth(), json=body)
    assert result.status_code == 400 and "message" in result.json()


def test_cors(client):
    response = client.options("/api/watchlist", headers={"Origin":"http://localhost:3000","Access-Control-Request-Method":"POST","Access-Control-Request-Headers":"authorization,content-type"})
    assert response.status_code == 200
    assert response.headers["access-control-allow-origin"] == "http://localhost:3000"
    denied = client.options("/api/watchlist", headers={"Origin":"https://not-allowed.example","Access-Control-Request-Method":"POST"})
    assert denied.status_code == 400

@pytest.mark.parametrize("output,status", [({"movie_id":1,"reasoning":"Cocok"},200),({"movie_id":999,"reasoning":"Cocok"},502),({"movie_id":True,"reasoning":"Cocok"},502),({"movie_id":1,"reasoning":"  "},502),({"movie_id":"1","reasoning":"Cocok"},502),({},502)])
def test_recommendation_grounding(client, output, status):
    class FakeProvider:
        def generate(self, catalog, prompt):
            assert len(catalog) == 20
            return output
    app.dependency_overrides[get_recommendation_client] = FakeProvider
    assert client.post("/api/movies/recommend", json={"prompt":"misteri","query":"misteri","description":"misteri"}).status_code == status


def test_missing_ai_key(client, monkeypatch):
    monkeypatch.setattr(get_settings(), "ai_api_key", SecretStr(""))
    assert client.post("/api/movies/recommend", json={"prompt":"misteri"}).status_code == 503
    assert client.post("/api/movies/recommend", json={"prompt":" "}).status_code == 400


def test_concurrent_watchlist_requests():
    from concurrent.futures import ThreadPoolExecutor
    from uuid import uuid4
    from fastapi.testclient import TestClient
    from sqlalchemy import delete, func
    from app.database.models import User, Watchlist
    from app.core.security import create_token, hasher
    with SessionLocal.begin() as db:
        user = User(username="race", email=f"race-{uuid4().hex}@example.com", password_hash=hasher.hash("testpass123"))
        db.add(user)
        db.flush()
        user_id = user.id
    headers = {"Authorization": f"Bearer {create_token(user_id)}"}
    def add(_):
        with TestClient(app) as client:
            return client.post("/api/watchlist", json={"movieId":1}, headers=headers).status_code
    try:
        with ThreadPoolExecutor(max_workers=2) as pool:
            assert sorted(pool.map(add, range(2))) == [201,409]
        with SessionLocal() as db:
            assert db.scalar(select(func.count()).select_from(Watchlist).where(Watchlist.user_id == user_id)) == 1
    finally:
        with SessionLocal.begin() as db:
            db.execute(delete(User).where(User.id == user_id))
