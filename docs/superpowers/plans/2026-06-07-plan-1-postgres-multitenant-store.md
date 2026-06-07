# Plan 1 — Postgres-backed Multi-Tenant Store

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development
> (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use
> checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the single-tenant SQLite store with a Postgres store where every event and
verdict is scoped to an `org_id`, the hash chain runs per `(org_id, session_id)`, and no
un-scoped query path exists.

**Architecture:** psycopg3 with a bounded connection pool pointed at the Supabase transaction
pooler. A single `_assert_scoped` guard sits in front of every SQL statement and refuses any
call missing `org_id`. Schema is applied via plain SQL migration files and a tiny idempotent
runner. The ingest API keeps working via a temporary `DEFAULT_ORG` shim that Plan 2 replaces
with the authenticated org.

**Tech Stack:** Python 3.11, psycopg[binary,pool] 3.x, Postgres 15 (Supabase), pytest.

**Prerequisite:** A local Postgres for tests. Create the test DB once:
```bash
createdb blackbox_test    # or: psql -c 'CREATE DATABASE blackbox_test;'
export TEST_DATABASE_URL=postgresql://localhost:5432/blackbox_test
```
Recreate the venv first (the repo was moved):
```bash
cd /home/weslax83/blackbox && rm -rf .venv && python -m venv .venv && source .venv/bin/activate && pip install -e ".[dev]"
```

---

### Task 1: Add psycopg dependency + bounded connection pool

**Files:**
- Modify: `pyproject.toml` (dependencies list)
- Modify: `requirements.txt`
- Create: `blackbox/db.py`
- Test: `tests/test_db.py`

- [ ] **Step 1: Add the dependency**

In `pyproject.toml`, add to the `dependencies` array:
```toml
    "psycopg[binary,pool]>=3.1",
```
In `requirements.txt`, add a line:
```
psycopg[binary,pool]>=3.1
```
Then install: `pip install -e ".[dev]"`

- [ ] **Step 2: Write the failing test**

Create `tests/test_db.py`:
```python
from blackbox.db import get_pool, POOL_MAX_SIZE

def test_pool_is_singleton_and_bounded():
    p1 = get_pool()
    p2 = get_pool()
    assert p1 is p2                      # one shared pool
    assert p1.max_size == POOL_MAX_SIZE  # bounded for the free tier
    assert POOL_MAX_SIZE <= 7            # well under Supabase free direct-conn ceiling
```

- [ ] **Step 3: Run test to verify it fails**

Run: `pytest tests/test_db.py -v`
Expected: FAIL with `ModuleNotFoundError: No module named 'blackbox.db'`

- [ ] **Step 4: Write minimal implementation**

Create `blackbox/db.py`:
```python
# blackbox/blackbox/db.py
import os
from psycopg_pool import ConnectionPool

# Supabase free-tier Postgres has a low direct-connection ceiling. We connect through the
# transaction pooler (pgBouncer, port 6543) and keep our own pool small. The tribunal's
# LangGraph fan-out does LLM work, not DB work — DB access is one read up front and one write
# after consolidation — so pool size is deliberately decoupled from fan-out width.
POOL_MIN_SIZE = 1
POOL_MAX_SIZE = 5      # hard cap; total app connections stay well under the tier limit
POOL_TIMEOUT = 10      # seconds to wait for a free connection before erroring

_pool: ConnectionPool | None = None

def get_pool() -> ConnectionPool:
    global _pool
    if _pool is None:
        dsn = os.environ["DATABASE_URL"]
        _pool = ConnectionPool(
            conninfo=dsn,
            min_size=POOL_MIN_SIZE,
            max_size=POOL_MAX_SIZE,
            timeout=POOL_TIMEOUT,
            check=ConnectionPool.check_connection,   # pre-ping: drop dead conns
            kwargs={"autocommit": False},
        )
    return _pool

def reset_pool() -> None:
    """Test helper: close and forget the pool so a new DATABASE_URL takes effect."""
    global _pool
    if _pool is not None:
        _pool.close()
        _pool = None
```

- [ ] **Step 5: Point DATABASE_URL at the test DB and run**

Run:
```bash
DATABASE_URL="${TEST_DATABASE_URL:-postgresql://localhost:5432/blackbox_test}" pytest tests/test_db.py -v
```
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add pyproject.toml requirements.txt blackbox/db.py tests/test_db.py
git commit -m "feat: bounded psycopg connection pool for Supabase transaction pooler"
```

---

### Task 2: SQL migrations + idempotent runner

**Files:**
- Create: `migrations/0001_init_tenant_store.sql`
- Create: `blackbox/migrate.py`
- Test: `tests/test_migrate.py`

- [ ] **Step 1: Write the migration SQL**

Create `migrations/0001_init_tenant_store.sql`:
```sql
-- 0001: tenant-scoped event + verdict store
CREATE TABLE IF NOT EXISTS events (
    seq         BIGSERIAL PRIMARY KEY,
    org_id      TEXT NOT NULL,
    agent_id    TEXT NOT NULL,
    session_id  TEXT NOT NULL,
    kind        TEXT NOT NULL,
    intent      TEXT NOT NULL DEFAULT '',
    tool        TEXT,
    args        JSONB NOT NULL DEFAULT '{}',
    output      TEXT NOT NULL DEFAULT '',
    approved_by TEXT,
    ts          TEXT NOT NULL,
    prev_hash   TEXT NOT NULL,
    hash        TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_events_org_session_seq ON events (org_id, session_id, seq);

CREATE TABLE IF NOT EXISTS verdicts (
    id            BIGSERIAL PRIMARY KEY,
    org_id        TEXT NOT NULL,
    session_id    TEXT NOT NULL,
    rule_id       TEXT NOT NULL,
    severity      TEXT NOT NULL,
    violation     BOOLEAN NOT NULL,
    confidence    DOUBLE PRECISION NOT NULL,
    evidence_seqs JSONB NOT NULL DEFAULT '[]',
    rationale     TEXT NOT NULL DEFAULT '',
    framework_ref TEXT NOT NULL DEFAULT '',
    ts            TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_verdicts_org_session ON verdicts (org_id, session_id);
```

- [ ] **Step 2: Write the failing test**

Create `tests/test_migrate.py`:
```python
from blackbox.db import get_pool
from blackbox.migrate import apply_migrations

def test_apply_migrations_creates_tables_idempotently():
    apply_migrations()
    apply_migrations()  # second run must not error
    with get_pool().connection() as conn, conn.cursor() as cur:
        cur.execute("SELECT to_regclass('public.events'), to_regclass('public.verdicts')")
        events_tbl, verdicts_tbl = cur.fetchone()
    assert events_tbl == "events"
    assert verdicts_tbl == "verdicts"
```

- [ ] **Step 3: Run test to verify it fails**

Run: `DATABASE_URL="${TEST_DATABASE_URL}" pytest tests/test_migrate.py -v`
Expected: FAIL with `ModuleNotFoundError: No module named 'blackbox.migrate'`

- [ ] **Step 4: Write the runner**

Create `blackbox/migrate.py`:
```python
# blackbox/blackbox/migrate.py
import pathlib
from .db import get_pool

MIGRATIONS_DIR = pathlib.Path(__file__).resolve().parent.parent / "migrations"

def apply_migrations(pool=None) -> list[str]:
    """Apply every *.sql in migrations/ in lexical order, exactly once. Returns names applied."""
    pool = pool or get_pool()
    newly_applied: list[str] = []
    with pool.connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "CREATE TABLE IF NOT EXISTS schema_migrations ("
                " name TEXT PRIMARY KEY, applied_at TIMESTAMPTZ NOT NULL DEFAULT now())")
            cur.execute("SELECT name FROM schema_migrations")
            applied = {r[0] for r in cur.fetchall()}
        for path in sorted(MIGRATIONS_DIR.glob("*.sql")):
            if path.name in applied:
                continue
            with conn.cursor() as cur:
                cur.execute(path.read_text(encoding="utf-8"))
                cur.execute("INSERT INTO schema_migrations(name) VALUES(%s)", (path.name,))
            newly_applied.append(path.name)
        conn.commit()
    return newly_applied
```

- [ ] **Step 5: Run test to verify it passes**

Run: `DATABASE_URL="${TEST_DATABASE_URL}" pytest tests/test_migrate.py -v`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add migrations/0001_init_tenant_store.sql blackbox/migrate.py tests/test_migrate.py
git commit -m "feat: SQL migrations + idempotent runner for tenant store schema"
```

---

### Task 3: Add `org_id` to the Event and Verdict models

**Files:**
- Modify: `blackbox/schema.py`
- Test: `tests/test_schema_org.py`

- [ ] **Step 1: Write the failing test**

Create `tests/test_schema_org.py`:
```python
from blackbox.schema import Event, Verdict

def test_event_has_optional_org_id_default_none():
    e = Event(agent_id="a", session_id="s", kind="llm_call")
    assert e.org_id is None          # assigned by the store on persist, like seq/hash
    e.org_id = "org1"
    assert e.model_dump()["org_id"] == "org1"

def test_verdict_has_optional_org_id():
    v = Verdict(session_id="s", rule_id="r", severity="low", violation=False, confidence=0.0)
    assert v.org_id is None
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pytest tests/test_schema_org.py -v`
Expected: FAIL with `KeyError: 'org_id'` (or AttributeError)

- [ ] **Step 3: Add the fields**

In `blackbox/schema.py`, in `class Event`, add to the "assigned on persist" block:
```python
    org_id: Optional[str] = None       # tenant; assigned by the store on persist
```
In `class Verdict`, add after `session_id`:
```python
    org_id: Optional[str] = None       # tenant; assigned by the store on persist
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pytest tests/test_schema_org.py -v`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add blackbox/schema.py tests/test_schema_org.py
git commit -m "feat: add tenant org_id to Event and Verdict models"
```

---

### Task 4: Rewrite the store as a tenant-scoped Postgres store

**Files:**
- Rewrite: `blackbox/store.py`
- Create: `tests/conftest.py`
- Rewrite: `tests/test_store.py`

- [ ] **Step 1: Write the test fixtures**

Create `tests/conftest.py`:
```python
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
        cur.execute("TRUNCATE events, verdicts RESTART IDENTITY")
        conn.commit()
    return s
```

- [ ] **Step 2: Write the failing store tests**

Rewrite `tests/test_store.py`:
```python
import pytest
from blackbox.schema import Event, Verdict

def _ev(session_id="s1", **kw):
    return Event(agent_id="a", session_id=session_id, kind="tool_call", **kw)

def _vd(session_id="s1"):
    return Verdict(session_id=session_id, rule_id="data_exfiltration", severity="critical",
                   violation=True, confidence=0.9, evidence_seqs=[1])

def test_append_assigns_seq_hash_and_org(store):
    e = store.append("orgA", _ev())
    assert e.seq is not None and e.hash and e.prev_hash == "GENESIS" and e.org_id == "orgA"

def test_chain_links_within_org_session(store):
    e1 = store.append("orgA", _ev())
    e2 = store.append("orgA", _ev())
    assert e2.prev_hash == e1.hash

def test_chain_is_independent_per_org(store):
    store.append("orgA", _ev(session_id="s1"))
    b1 = store.append("orgB", _ev(session_id="s1"))
    assert b1.prev_hash == "GENESIS"     # orgB starts its own genesis, not chained to orgA

def test_events_are_scoped_to_org(store):
    store.append("orgA", _ev())
    store.append("orgB", _ev())
    evs = store.events("orgA")
    assert len(evs) == 1 and all(e.org_id == "orgA" for e in evs)

def test_tenant_isolation_no_cross_read(store):   # <-- GATE TEST
    store.append("orgA", _ev(session_id="secret"))
    assert store.events("orgB", session_id="secret") == []

def test_verify_chain_true_for_intact_org_chain(store):
    store.append("orgA", _ev()); store.append("orgA", _ev())
    assert store.verify_chain("orgA") is True

def test_verdicts_scoped_to_org(store):
    store.append("orgA", _ev())
    store.add_verdict("orgA", _vd())
    assert len(store.verdicts("orgA")) == 1
    assert store.verdicts("orgB") == []

def test_assert_scoped_rejects_empty_org(store):
    with pytest.raises(ValueError):
        store._assert_scoped("", "SELECT 1 FROM events WHERE org_id=%s")

def test_assert_scoped_rejects_unscoped_sql(store):
    with pytest.raises(ValueError):
        store._assert_scoped("orgA", "SELECT 1 FROM events")

@pytest.mark.parametrize("call", [
    lambda s: s.events(""),
    lambda s: s.verdicts(""),
    lambda s: s.verify_chain(""),
    lambda s: s.append("", _ev()),
    lambda s: s.add_verdict("", _vd()),
])
def test_every_public_method_requires_org(store, call):
    with pytest.raises(ValueError):
        call(store)
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `DATABASE_URL="${TEST_DATABASE_URL}" pytest tests/test_store.py -v`
Expected: FAIL (current `Store.__init__` takes a path and methods have no `org_id`)

- [ ] **Step 4: Rewrite the store**

Rewrite `blackbox/store.py`:
```python
# blackbox/blackbox/store.py
import hashlib, json
from typing import Optional
from psycopg.rows import dict_row
from .schema import Event, Verdict
from .db import get_pool

def _event_digest(prev_hash: str, e: Event) -> str:
    # org_id is part of the digest so an event is cryptographically bound to its tenant.
    payload = json.dumps({
        "prev": prev_hash, "org_id": e.org_id, "agent_id": e.agent_id,
        "session_id": e.session_id, "kind": e.kind, "intent": e.intent,
        "tool": e.tool, "args": e.args, "output": e.output,
        "approved_by": e.approved_by, "ts": e.ts,
    }, sort_keys=True, ensure_ascii=False)
    return hashlib.sha256(payload.encode("utf-8")).hexdigest()

class Store:
    """Tenant-scoped Postgres store. EVERY public method takes org_id as its first argument;
    the _assert_scoped guard makes an un-scoped query impossible by construction."""

    def __init__(self, pool=None):
        self.pool = pool or get_pool()

    # ---- the single audited scoping guard (spec §9.1.1) -------------------------------------
    @staticmethod
    def _assert_scoped(org_id: str, sql: str) -> None:
        if not org_id:
            raise ValueError("org_id is required for every query")
        if "org_id" not in sql.lower():
            raise ValueError(f"refusing un-scoped query (no org_id predicate): {sql!r}")

    # ---- writes -----------------------------------------------------------------------------
    def append(self, org_id: str, e: Event) -> Event:
        sql_last = "SELECT hash FROM events WHERE org_id=%s AND session_id=%s ORDER BY seq DESC LIMIT 1"
        sql_ins = ("INSERT INTO events"
                   "(org_id,agent_id,session_id,kind,intent,tool,args,output,approved_by,ts,prev_hash,hash)"
                   " VALUES(%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s) RETURNING seq")
        self._assert_scoped(org_id, sql_last)
        self._assert_scoped(org_id, sql_ins)
        e.org_id = org_id
        with self.pool.connection() as conn:
            with conn.cursor(row_factory=dict_row) as cur:
                cur.execute(sql_last, (org_id, e.session_id))
                row = cur.fetchone()
                e.prev_hash = row["hash"] if row else "GENESIS"
                e.hash = _event_digest(e.prev_hash, e)
                cur.execute(sql_ins, (
                    org_id, e.agent_id, e.session_id, e.kind, e.intent, e.tool,
                    json.dumps(e.args, ensure_ascii=False), e.output, e.approved_by,
                    e.ts, e.prev_hash, e.hash))
                e.seq = cur.fetchone()["seq"]
            conn.commit()
        return e

    def add_verdict(self, org_id: str, v: Verdict) -> None:
        sql = ("INSERT INTO verdicts"
               "(org_id,session_id,rule_id,severity,violation,confidence,evidence_seqs,rationale,framework_ref,ts)"
               " VALUES(%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)")
        self._assert_scoped(org_id, sql)
        v.org_id = org_id
        with self.pool.connection() as conn:
            with conn.cursor() as cur:
                cur.execute(sql, (
                    org_id, v.session_id, v.rule_id, v.severity, v.violation, v.confidence,
                    json.dumps(v.evidence_seqs), v.rationale, v.framework_ref, v.ts))
            conn.commit()

    # ---- reads ------------------------------------------------------------------------------
    def events(self, org_id: str, session_id: Optional[str] = None) -> list[Event]:
        sql = "SELECT * FROM events WHERE org_id=%s"
        params: tuple = (org_id,)
        if session_id:
            sql += " AND session_id=%s"; params += (session_id,)
        sql += " ORDER BY seq ASC"
        self._assert_scoped(org_id, sql)
        with self.pool.connection() as conn, conn.cursor(row_factory=dict_row) as cur:
            cur.execute(sql, params)
            rows = cur.fetchall()
        return [Event(**r) for r in rows]

    def verdicts(self, org_id: str, session_id: Optional[str] = None) -> list[Verdict]:
        sql = "SELECT * FROM verdicts WHERE org_id=%s"
        params: tuple = (org_id,)
        if session_id:
            sql += " AND session_id=%s"; params += (session_id,)
        self._assert_scoped(org_id, sql)
        with self.pool.connection() as conn, conn.cursor(row_factory=dict_row) as cur:
            cur.execute(sql, params)
            rows = cur.fetchall()
        out = []
        for r in rows:
            d = dict(r); d.pop("id", None)
            out.append(Verdict(**d))
        return out

    def verify_chain(self, org_id: str, session_id: Optional[str] = None) -> bool:
        prev = "GENESIS"
        for e in self.events(org_id, session_id):
            if _event_digest(prev, e) != e.hash:
                return False
            prev = e.hash
        return True
```

Note: psycopg returns `args`/`evidence_seqs` JSONB as already-parsed Python objects, so no
`json.loads` is needed on read (unlike the old SQLite store).

- [ ] **Step 5: Run tests to verify they pass**

Run: `DATABASE_URL="${TEST_DATABASE_URL}" pytest tests/test_store.py -v`
Expected: PASS (all, including the tenant-isolation gate test)

- [ ] **Step 6: Commit**

```bash
git add blackbox/store.py tests/conftest.py tests/test_store.py
git commit -m "feat: tenant-scoped Postgres store with org_id guard and per-tenant hash chain"
```

---

### Task 5: Update ingest + recorder for the org-scoped store (DEFAULT_ORG shim)

**Files:**
- Modify: `blackbox/ingest.py`
- Rewrite: `tests/test_api.py`

This keeps the HTTP API working end-to-end on Postgres. The single-tenant `DEFAULT_ORG`
constant is a deliberate, clearly-labeled shim that Plan 2 replaces with the authenticated org.

- [ ] **Step 1: Write the failing API test**

Rewrite `tests/test_api.py`:
```python
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `DATABASE_URL="${TEST_DATABASE_URL}" pytest tests/test_api.py -v`
Expected: FAIL (ingest still calls `store.append(e)` without org_id and builds `Store(DB_PATH)`)

- [ ] **Step 3: Update ingest to the org-scoped store + shim**

In `blackbox/ingest.py`, replace the store construction and the `/verify` + read/write calls.
Change the top section to:
```python
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .schema import Event, Verdict
from .store import Store

DEFAULT_ORG = "default"   # TEMP single-tenant shim — Plan 2 replaces with the authenticated org
store = Store()
app = FastAPI(title="BLACKBOX")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

@app.post("/events")
def ingest(e: Event) -> Event:
    return store.append(DEFAULT_ORG, e)

@app.get("/events")
def list_events(session_id: str | None = None) -> list[Event]:
    return store.events(DEFAULT_ORG, session_id)

@app.get("/verdicts")
def list_verdicts(session_id: str | None = None) -> list[Verdict]:
    return store.verdicts(DEFAULT_ORG, session_id)

@app.get("/verify")
def verify(session_id: str | None = None) -> dict:
    return {"chain_intact": store.verify_chain(DEFAULT_ORG, session_id)}
```
And in the audit/evidence section further down, update the calls to pass `DEFAULT_ORG`:
```python
@app.post("/audit/{session_id}")
def audit_session(session_id: str) -> list[Verdict]:
    existing = [v for v in store.verdicts(DEFAULT_ORG, session_id) if v.violation]
    if existing:
        return existing
    events = store.events(DEFAULT_ORG, session_id)
    verdicts = run_audit(events, session_id, _pack)
    for v in verdicts:
        store.add_verdict(DEFAULT_ORG, v)
    return verdicts

@app.get("/evidence/{session_id}", response_class=HTMLResponse)
def evidence(session_id: str) -> str:
    events = store.events(DEFAULT_ORG, session_id)
    verdicts = store.verdicts(DEFAULT_ORG, session_id)
    pack = build_evidence_pack(session_id, events, verdicts,
                               framework=_pack.framework, chain_intact=store.verify_chain(DEFAULT_ORG, session_id))
    return pack["html"]
```

- [ ] **Step 4: Run test to verify it passes**

Run: `DATABASE_URL="${TEST_DATABASE_URL}" pytest tests/test_api.py -v`
Expected: PASS

- [ ] **Step 5: Run the full suite**

Run: `DATABASE_URL="${TEST_DATABASE_URL}" pytest -v`
Expected: PASS for store/db/migrate/schema/api tests. (Note: `tests/test_recorder.py` constructs
`Store(...)` with a path — if it fails, update it to `Store()` + `store.append("orgT", ev)` in the
same commit; the recorder's HTTP path is unchanged.)

- [ ] **Step 6: Commit**

```bash
git add blackbox/ingest.py tests/test_api.py
git commit -m "feat: wire ingest API to org-scoped store via DEFAULT_ORG shim (replaced in Plan 2)"
```

---

## Plan 1 self-review

- **Spec coverage:** §5 data model (events/verdicts + org_id, indexes) ✓ Task 2/3; §9.1.1
  single scoped helper + no un-scoped path ✓ Task 4 (`_assert_scoped` + behavioral tests);
  §9.1.3 bounded pool + transaction pooler ✓ Task 1; tenancy-isolation gate test ✓ Task 4.
- **Deferred to later plans (intentional):** real `org_id` from auth (Plan 2 replaces
  `DEFAULT_ORG`); advisory `/audit` lock and redaction filter (Plan 3); RLS policies (Plan 2).
- **Type consistency:** `Store(pool=None)`, `append(org_id, e)`, `events(org_id, session_id)`,
  `verdicts(org_id, session_id)`, `verify_chain(org_id, session_id)`, `add_verdict(org_id, v)`,
  `_assert_scoped(org_id, sql)` used identically across store, conftest, tests, and ingest.
- **No placeholders:** every step has runnable code/commands and expected output.
