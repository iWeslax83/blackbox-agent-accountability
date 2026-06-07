import os
os.environ.setdefault(
    "DATABASE_URL",
    os.environ.get("TEST_DATABASE_URL", "postgresql://localhost:5432/blackbox_test"),
)
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
