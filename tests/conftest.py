import os
os.environ.setdefault(
    "DATABASE_URL",
    os.environ.get("TEST_DATABASE_URL", "postgresql://localhost:5432/blackbox_test"),
)
os.environ.setdefault("SUPABASE_JWT_SECRET", "test-secret")
import pytest
from blackbox.db import get_pool
from blackbox.migrate import apply_migrations
from blackbox.store import Store

@pytest.fixture(scope="session", autouse=True)
def _migrate():
    apply_migrations()

@pytest.fixture
def store():
    s = Store()
    with s.pool.connection() as conn, conn.cursor() as cur:
        cur.execute("TRUNCATE events, verdicts, api_keys, org_members, orgs RESTART IDENTITY CASCADE")
        conn.commit()
    return s

import time, jwt

@pytest.fixture
def make_jwt():
    def _make(user_id: str, *, expired: bool = False, secret: str = None):
        now = int(time.time())
        payload = {"sub": user_id, "aud": "authenticated",
                   "iat": now, "exp": now - 10 if expired else now + 3600}
        return jwt.encode(payload, secret or os.environ["SUPABASE_JWT_SECRET"], algorithm="HS256")
    return _make
