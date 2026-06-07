import os
os.environ.setdefault(
    "DATABASE_URL",
    os.environ.get("TEST_DATABASE_URL", "postgresql://localhost:5432/blackbox_test"),
)
import pytest
from fastapi.testclient import TestClient
from blackbox.migrate import apply_migrations
from blackbox.db import get_pool

@pytest.fixture(autouse=True)
def _clean_db():
    apply_migrations()
    with get_pool().connection() as conn, conn.cursor() as cur:
        cur.execute("TRUNCATE events, verdicts RESTART IDENTITY")
        conn.commit()

@pytest.fixture
def client():
    from blackbox.ingest import app
    return TestClient(app)

def _event(session_id="api-s1"):
    return {"agent_id": "a", "session_id": session_id, "kind": "tool_call",
            "tool": "send_email", "args": {"to": "x@y.com"}, "intent": "test"}

def test_post_and_list_events_roundtrip(client):
    r = client.post("/events", json=_event())
    assert r.status_code == 200 and r.json()["seq"] is not None
    r2 = client.get("/events", params={"session_id": "api-s1"})
    assert r2.status_code == 200 and len(r2.json()) == 1

def test_verify_endpoint_reports_intact_chain(client):
    client.post("/events", json=_event())
    r = client.get("/verify", params={"session_id": "api-s1"})
    assert r.status_code == 200 and r.json()["chain_intact"] is True
