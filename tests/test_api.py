import os, time
os.environ.setdefault("DATABASE_URL",
    os.environ.get("TEST_DATABASE_URL", "postgresql://localhost:5432/blackbox_test"))
os.environ.setdefault("SUPABASE_JWT_SECRET", "test-secret")
import jwt, pytest
from fastapi.testclient import TestClient
from blackbox.migrate import apply_migrations
from blackbox.db import get_pool
from blackbox.orgs import create_org
from blackbox.apikeys import create_api_key

@pytest.fixture(autouse=True)
def _clean_db():
    apply_migrations()
    with get_pool().connection() as conn, conn.cursor() as cur:
        cur.execute("TRUNCATE events, verdicts, api_keys, org_members, orgs RESTART IDENTITY CASCADE")
        conn.commit()

@pytest.fixture
def client():
    from blackbox.ingest import app
    return TestClient(app)

def _jwt(user_id):
    now = int(time.time())
    return jwt.encode({"sub": user_id, "aud": "authenticated", "iat": now, "exp": now + 3600},
                      "test-secret", algorithm="HS256")

def _event(session_id="s1"):
    return {"agent_id": "a", "session_id": session_id, "kind": "tool_call",
            "tool": "send_email", "args": {"to": "x@y.com"}, "intent": "t"}

def test_events_require_api_key(client):
    assert client.post("/events", json=_event()).status_code == 401

def test_ingest_with_key_then_read_with_jwt(client):
    org = create_org("Acme", "u1")
    key = create_api_key(org, "ci")
    r = client.post("/events", json=_event(), headers={"Authorization": f"Bearer {key}"})
    assert r.status_code == 200
    r2 = client.get("/events", params={"session_id": "s1"},
                    headers={"Authorization": f"Bearer {_jwt('u1')}"})
    assert r2.status_code == 200 and len(r2.json()) == 1

def test_cross_tenant_read_is_empty(client):
    org_a = create_org("A", "ua"); create_org("B", "ub")
    key_a = create_api_key(org_a, "ci")
    client.post("/events", json=_event("secret"), headers={"Authorization": f"Bearer {key_a}"})
    # user B reads — must NOT see org A's event
    r = client.get("/events", params={"session_id": "secret"},
                   headers={"Authorization": f"Bearer {_jwt('ub')}"})
    assert r.status_code == 200 and r.json() == []

def test_dashboard_endpoints_reject_anonymous(client):
    for path in ["/events", "/verdicts", "/verify"]:
        assert client.get(path).status_code == 401

def test_create_and_list_keys(client):
    create_org("Acme", "u1")
    h = {"Authorization": f"Bearer {_jwt('u1')}"}
    r = client.post("/keys", json={"name": "prod"}, headers=h)
    assert r.status_code == 200 and r.json()["key"].startswith("bb_live_")
    r2 = client.get("/keys", headers=h)
    assert r2.status_code == 200 and len(r2.json()) == 1 and "key_hash" not in r2.json()[0]
