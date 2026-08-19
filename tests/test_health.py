import os
os.environ.setdefault("DATABASE_URL",
    os.environ.get("TEST_DATABASE_URL", "postgresql://localhost:5432/teluvane_test"))
os.environ.setdefault("SUPABASE_JWT_SECRET", "test-secret")
os.environ.setdefault("TELUVANE_SECRET_KEY", "BDUpLFAo9s1dqKy3BZFUcEvdGA7sS0rgdpUEe3Yai8I=")
from fastapi.testclient import TestClient

def test_health_is_public_and_ok():
    from teluvane.ingest import app
    c = TestClient(app)
    assert c.get("/health").json() == {"status": "ok"}

def test_ready_checks_db():
    from teluvane.ingest import app
    from teluvane.migrate import apply_migrations
    apply_migrations()
    c = TestClient(app)
    r = c.get("/ready")
    assert r.status_code == 200 and r.json()["db"] is True
