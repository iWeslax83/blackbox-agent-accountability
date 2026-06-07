import os
os.environ.setdefault("DATABASE_URL",
    os.environ.get("TEST_DATABASE_URL", "postgresql://localhost:5432/blackbox_test"))
os.environ.setdefault("SUPABASE_JWT_SECRET", "test-secret")
os.environ.setdefault("BLACKBOX_SECRET_KEY", "BDUpLFAo9s1dqKy3BZFUcEvdGA7sS0rgdpUEe3Yai8I=")
os.environ["EVENTS_RATE_LIMIT"] = "3/minute"
import importlib, blackbox.ingest as ing
importlib.reload(ing)
from fastapi.testclient import TestClient
from blackbox.migrate import apply_migrations
from blackbox.orgs import create_org
from blackbox.apikeys import create_api_key
from blackbox.db import get_pool

def _clean():
    apply_migrations()
    with get_pool().connection() as conn, conn.cursor() as cur:
        cur.execute("TRUNCATE events, verdicts, api_keys, byok_secrets, org_members, orgs RESTART IDENTITY CASCADE")
        conn.commit()

def test_events_rate_limited():
    _clean()
    org = create_org("Acme", "u1"); key = create_api_key(org, "ci")
    c = TestClient(ing.app)
    h = {"Authorization": f"Bearer {key}"}
    ev = {"agent_id": "a", "session_id": "s", "kind": "tool_call", "tool": "t", "args": {}, "intent": "i"}
    codes = [c.post("/events", json=ev, headers=h).status_code for _ in range(5)]
    assert 429 in codes   # the limiter trips within the window
