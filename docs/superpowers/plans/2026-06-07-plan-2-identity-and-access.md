# Plan 2 — Identity & Access (Supabase JWT + API keys)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or
> superpowers:executing-plans. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Add real tenancy: orgs + membership, Supabase-JWT auth for humans, and `bb_live_…`
API keys for agents. Replace Plan 1's `DEFAULT_ORG` shim so every request resolves a real
`org_id`; reject anonymous and cross-tenant calls.

**Architecture:** The FastAPI service is the single gatekeeper. Dashboard endpoints require a
Supabase JWT (HS256, verified with `SUPABASE_JWT_SECRET`) → `sub` → `org_members` → `org_id`.
The ingest endpoint requires `Authorization: Bearer bb_live_…`; the key is SHA-256-hashed and
looked up to resolve `org_id`. RLS policies are added as defense-in-depth for the unexposed
PostgREST surface (the service-role API bypasses them by design — app-layer scoping from Plan 1
is the real boundary).

**Tech Stack:** PyJWT, psycopg3, FastAPI, Postgres, pytest.

**Depends on:** Plan 1 (org-scoped Store, migrations runner, db pool).

**Test env:** `tests/conftest.py` already sets `DATABASE_URL`. This plan adds
`SUPABASE_JWT_SECRET=test-secret` in conftest so tests can mint tokens.

---

### Task 1: Dependency + identity schema migration + RLS

**Files:**
- Modify: `pyproject.toml`, `requirements.txt`
- Create: `migrations/0002_identity.sql`
- Test: `tests/test_identity_schema.py`

- [ ] **Step 1: Add PyJWT**

`pyproject.toml` dependencies, add:
```toml
    "pyjwt>=2.8",
```
`requirements.txt`, add:
```
pyjwt>=2.8
```
Install: `pip install -e ".[dev]"`

- [ ] **Step 2: Write the migration**

Create `migrations/0002_identity.sql`:
```sql
-- 0002: orgs, membership, API keys, and RLS (defense-in-depth)
CREATE TABLE IF NOT EXISTS orgs (
    id            TEXT PRIMARY KEY,
    name          TEXT NOT NULL,
    owner_user_id TEXT NOT NULL,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS org_members (
    org_id  TEXT NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL,
    role    TEXT NOT NULL DEFAULT 'member',
    PRIMARY KEY (org_id, user_id)
);
CREATE TABLE IF NOT EXISTS api_keys (
    id           BIGSERIAL PRIMARY KEY,
    org_id       TEXT NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
    name         TEXT NOT NULL,
    key_hash     TEXT NOT NULL UNIQUE,
    prefix       TEXT NOT NULL,
    last_used_at TIMESTAMPTZ,
    revoked_at   TIMESTAMPTZ,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_api_keys_org ON api_keys (org_id);

-- RLS: protects the anon/public PostgREST surface we do NOT expose. Our API uses the
-- service-role key and bypasses RLS, so app-layer org_id scoping (Plan 1) is the real boundary.
ALTER TABLE events      ENABLE ROW LEVEL SECURITY;
ALTER TABLE verdicts    ENABLE ROW LEVEL SECURITY;
ALTER TABLE orgs        ENABLE ROW LEVEL SECURITY;
ALTER TABLE org_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys    ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS org_members_self ON org_members;
CREATE POLICY org_members_self ON org_members
    FOR SELECT USING (user_id = auth.uid()::text);
DROP POLICY IF EXISTS events_by_member ON events;
CREATE POLICY events_by_member ON events
    FOR SELECT USING (org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid()::text));
DROP POLICY IF EXISTS verdicts_by_member ON verdicts;
CREATE POLICY verdicts_by_member ON verdicts
    FOR SELECT USING (org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid()::text));
```
Note: `auth.uid()` exists in Supabase. For the **local** test Postgres it does not, but RLS is
never exercised by our tests (we connect as the table owner/superuser, which bypasses RLS), so
the policies create fine and stay dormant. The migration must still apply cleanly — if your local
Postgres rejects `auth.uid()`, wrap the policy bodies are still valid SQL (they reference a
function that is only *called* at row-access time, not at policy-creation time), so creation
succeeds.

- [ ] **Step 3: Write the failing test**

Create `tests/test_identity_schema.py`:
```python
from blackbox.db import get_pool
from blackbox.migrate import apply_migrations

def test_identity_tables_exist():
    apply_migrations()
    with get_pool().connection() as conn, conn.cursor() as cur:
        cur.execute("SELECT to_regclass('public.orgs'), to_regclass('public.org_members'), "
                    "to_regclass('public.api_keys')")
        orgs, members, keys = cur.fetchone()
    assert orgs == "orgs" and members == "org_members" and keys == "api_keys"
```

- [ ] **Step 4: Run to verify fail, then apply**

Run: `DATABASE_URL="${TEST_DATABASE_URL}" pytest tests/test_identity_schema.py -v`
Expected: FAIL (tables missing) → the test itself calls `apply_migrations()`, so it will PASS
once `0002_identity.sql` exists. If `0002` had a syntax error it FAILs at apply. Confirm PASS.

- [ ] **Step 5: Commit**

```bash
git add pyproject.toml requirements.txt migrations/0002_identity.sql tests/test_identity_schema.py
git commit -m "feat: identity schema (orgs, members, api_keys) + RLS policies"
```

---

### Task 2: Org creation + membership module

**Files:**
- Create: `blackbox/orgs.py`
- Test: `tests/test_orgs.py`

- [ ] **Step 1: Write the failing test**

Create `tests/test_orgs.py`:
```python
from blackbox.orgs import create_org, org_for_user

def test_create_org_makes_owner_member(store):   # `store` fixture truncates events/verdicts
    org_id = create_org("Acme", "user-123")
    assert org_id.startswith("org_")
    assert org_for_user("user-123") == org_id

def test_org_for_user_unknown_returns_none():
    assert org_for_user("nobody-xyz") is None
```

- [ ] **Step 2: Run to verify fail**

Run: `DATABASE_URL="${TEST_DATABASE_URL}" pytest tests/test_orgs.py -v`
Expected: FAIL with `ModuleNotFoundError: No module named 'blackbox.orgs'`

- [ ] **Step 3: Implement**

Create `blackbox/orgs.py`:
```python
# blackbox/blackbox/orgs.py
import uuid
from typing import Optional
from .db import get_pool

def create_org(name: str, owner_user_id: str) -> str:
    org_id = "org_" + uuid.uuid4().hex[:12]
    with get_pool().connection() as conn, conn.cursor() as cur:
        cur.execute("INSERT INTO orgs(id,name,owner_user_id) VALUES(%s,%s,%s)",
                    (org_id, name, owner_user_id))
        cur.execute("INSERT INTO org_members(org_id,user_id,role) VALUES(%s,%s,'owner')",
                    (org_id, owner_user_id))
        conn.commit()
    return org_id

def org_for_user(user_id: str) -> Optional[str]:
    with get_pool().connection() as conn, conn.cursor() as cur:
        cur.execute("SELECT org_id FROM org_members WHERE user_id=%s ORDER BY role DESC LIMIT 1",
                    (user_id,))
        row = cur.fetchone()
    return row[0] if row else None
```

- [ ] **Step 4: Run to verify pass**

Run: `DATABASE_URL="${TEST_DATABASE_URL}" pytest tests/test_orgs.py -v`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add blackbox/orgs.py tests/test_orgs.py
git commit -m "feat: org creation and user->org resolution"
```

---

### Task 3: Supabase JWT verification

**Files:**
- Create: `blackbox/auth.py`
- Modify: `tests/conftest.py` (add `SUPABASE_JWT_SECRET` + a token-minting helper)
- Test: `tests/test_auth.py`

- [ ] **Step 1: Add the test env + token helper to conftest**

In `tests/conftest.py`, at the top env block add:
```python
os.environ.setdefault("SUPABASE_JWT_SECRET", "test-secret")
```
And at the bottom of the file add a helper fixture:
```python
import time, jwt

@pytest.fixture
def make_jwt():
    def _make(user_id: str, *, expired: bool = False, secret: str = None):
        now = int(time.time())
        payload = {"sub": user_id, "aud": "authenticated",
                   "iat": now, "exp": now - 10 if expired else now + 3600}
        return jwt.encode(payload, secret or os.environ["SUPABASE_JWT_SECRET"], algorithm="HS256")
    return _make
```

- [ ] **Step 2: Write the failing test**

Create `tests/test_auth.py`:
```python
import pytest
from fastapi import HTTPException
from blackbox.auth import verify_jwt, current_org
from blackbox.orgs import create_org

def test_verify_jwt_returns_sub(make_jwt):
    assert verify_jwt(make_jwt("user-1")) == "user-1"

def test_verify_jwt_rejects_bad_signature(make_jwt):
    with pytest.raises(HTTPException):
        verify_jwt(make_jwt("user-1", secret="wrong-secret"))

def test_verify_jwt_rejects_expired(make_jwt):
    with pytest.raises(HTTPException):
        verify_jwt(make_jwt("user-1", expired=True))

def test_current_org_resolves_org(store, make_jwt):
    org_id = create_org("Acme", "user-7")
    assert current_org(authorization=f"Bearer {make_jwt('user-7')}") == org_id

def test_current_org_rejects_missing_header():
    with pytest.raises(HTTPException):
        current_org(authorization=None)

def test_current_org_rejects_user_without_org(make_jwt):
    with pytest.raises(HTTPException):
        current_org(authorization=f"Bearer {make_jwt('orphan-user')}")
```

- [ ] **Step 3: Run to verify fail**

Run: `DATABASE_URL="${TEST_DATABASE_URL}" pytest tests/test_auth.py -v`
Expected: FAIL with `ModuleNotFoundError: No module named 'blackbox.auth'`

- [ ] **Step 4: Implement**

Create `blackbox/auth.py`:
```python
# blackbox/blackbox/auth.py
import os
import jwt
from fastapi import Header, HTTPException
from .orgs import org_for_user

JWT_ALG = "HS256"

def verify_jwt(token: str) -> str:
    secret = os.environ["SUPABASE_JWT_SECRET"]
    try:
        payload = jwt.decode(token, secret, algorithms=[JWT_ALG], audience="authenticated")
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="invalid or expired token")
    sub = payload.get("sub")
    if not sub:
        raise HTTPException(status_code=401, detail="token has no subject")
    return sub

def current_org(authorization: str = Header(default=None)) -> str:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="missing bearer token")
    user_id = verify_jwt(authorization[len("Bearer "):])
    org_id = org_for_user(user_id)
    if not org_id:
        raise HTTPException(status_code=403, detail="user has no org")
    return org_id
```

- [ ] **Step 5: Run to verify pass**

Run: `DATABASE_URL="${TEST_DATABASE_URL}" pytest tests/test_auth.py -v`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add blackbox/auth.py tests/conftest.py tests/test_auth.py
git commit -m "feat: Supabase JWT verification + current_org dependency"
```

---

### Task 4: API-key issuance / verification / revocation

**Files:**
- Create: `blackbox/apikeys.py`
- Test: `tests/test_apikeys.py`

- [ ] **Step 1: Write the failing test**

Create `tests/test_apikeys.py`:
```python
import pytest
from fastapi import HTTPException
from blackbox.apikeys import create_api_key, resolve_api_key, list_api_keys, revoke_api_key
from blackbox.orgs import create_org
from blackbox.db import get_pool

def test_create_returns_raw_key_and_stores_only_hash(store):
    org = create_org("Acme", "u1")
    raw = create_api_key(org, "ci")
    assert raw.startswith("bb_live_")
    with get_pool().connection() as conn, conn.cursor() as cur:
        cur.execute("SELECT key_hash FROM api_keys WHERE org_id=%s", (org,))
        stored = cur.fetchone()[0]
    assert stored != raw and len(stored) == 64   # sha256 hex, not the raw key

def test_resolve_returns_org(store):
    org = create_org("Acme", "u1")
    raw = create_api_key(org, "ci")
    assert resolve_api_key(raw) == org

def test_resolve_unknown_key_rejected(store):
    with pytest.raises(HTTPException):
        resolve_api_key("bb_live_nope")

def test_revoked_key_rejected(store):
    org = create_org("Acme", "u1")
    raw = create_api_key(org, "ci")
    key_id = list_api_keys(org)[0]["id"]
    revoke_api_key(org, key_id)
    with pytest.raises(HTTPException):
        resolve_api_key(raw)

def test_revoke_is_tenant_scoped(store):
    org_a = create_org("A", "ua"); org_b = create_org("B", "ub")
    raw = create_api_key(org_a, "ci")
    key_id = list_api_keys(org_a)[0]["id"]
    revoke_api_key(org_b, key_id)          # org B must NOT be able to revoke org A's key
    assert resolve_api_key(raw) == org_a   # still valid
```

- [ ] **Step 2: Run to verify fail**

Run: `DATABASE_URL="${TEST_DATABASE_URL}" pytest tests/test_apikeys.py -v`
Expected: FAIL with `ModuleNotFoundError: No module named 'blackbox.apikeys'`

- [ ] **Step 3: Implement**

Create `blackbox/apikeys.py`:
```python
# blackbox/blackbox/apikeys.py
import hashlib, secrets
from fastapi import Header, HTTPException
from .db import get_pool

KEY_PREFIX = "bb_live_"

def _hash(raw: str) -> str:
    return hashlib.sha256(raw.encode("utf-8")).hexdigest()

def create_api_key(org_id: str, name: str) -> str:
    raw = KEY_PREFIX + secrets.token_urlsafe(32)
    with get_pool().connection() as conn, conn.cursor() as cur:
        cur.execute("INSERT INTO api_keys(org_id,name,key_hash,prefix) VALUES(%s,%s,%s,%s)",
                    (org_id, name, _hash(raw), raw[:12]))
        conn.commit()
    return raw   # returned exactly once; never recoverable afterwards

def resolve_api_key(raw: str) -> str:
    h = _hash(raw)
    with get_pool().connection() as conn, conn.cursor() as cur:
        cur.execute("SELECT org_id FROM api_keys WHERE key_hash=%s AND revoked_at IS NULL", (h,))
        row = cur.fetchone()
        if not row:
            raise HTTPException(status_code=401, detail="invalid API key")
        cur.execute("UPDATE api_keys SET last_used_at=now() WHERE key_hash=%s", (h,))
        conn.commit()
    return row[0]

def list_api_keys(org_id: str) -> list[dict]:
    with get_pool().connection() as conn, conn.cursor() as cur:
        cur.execute("SELECT id,name,prefix,last_used_at,revoked_at,created_at "
                    "FROM api_keys WHERE org_id=%s ORDER BY created_at DESC", (org_id,))
        cols = [c.name for c in cur.description]
        return [dict(zip(cols, r)) for r in cur.fetchall()]

def revoke_api_key(org_id: str, key_id: int) -> None:
    with get_pool().connection() as conn, conn.cursor() as cur:
        cur.execute("UPDATE api_keys SET revoked_at=now() WHERE id=%s AND org_id=%s",
                    (key_id, org_id))
        conn.commit()

def org_from_api_key(authorization: str = Header(default=None)) -> str:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="missing API key")
    return resolve_api_key(authorization[len("Bearer "):])
```

- [ ] **Step 4: Run to verify pass**

Run: `DATABASE_URL="${TEST_DATABASE_URL}" pytest tests/test_apikeys.py -v`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add blackbox/apikeys.py tests/test_apikeys.py
git commit -m "feat: bb_live API keys — issue (hash-at-rest), resolve, list, tenant-scoped revoke"
```

---

### Task 5: Wire the API to real auth (remove DEFAULT_ORG) + management endpoints

**Files:**
- Rewrite: `blackbox/ingest.py`
- Rewrite: `tests/test_api.py`

- [ ] **Step 1: Write the failing API tests**

Rewrite `tests/test_api.py`:
```python
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
```

- [ ] **Step 2: Run to verify fail**

Run: `DATABASE_URL="${TEST_DATABASE_URL}" pytest tests/test_api.py -v`
Expected: FAIL (ingest still uses `DEFAULT_ORG`; `/keys` does not exist)

- [ ] **Step 3: Rewrite ingest**

Rewrite `blackbox/ingest.py`:
```python
# blackbox/blackbox/ingest.py
import os
from fastapi import FastAPI, Depends, Body
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse
from .schema import Event, Verdict
from .store import Store
from .auth import current_org
from .apikeys import org_from_api_key, create_api_key, list_api_keys, revoke_api_key
from .orgs import create_org, org_for_user
from .policy import load_policy_pack
from .tribunal import audit as run_audit
from .evidence import build_evidence_pack

store = Store()
app = FastAPI(title="BLACKBOX")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

POLICY_PATH = os.environ.get("BLACKBOX_POLICY", "policies/eu_ai_act.yaml")
_pack = load_policy_pack(POLICY_PATH)

# ---- ingest (machine auth: API key) --------------------------------------------------------
@app.post("/events")
def ingest(e: Event, org_id: str = Depends(org_from_api_key)) -> Event:
    return store.append(org_id, e)

# ---- reads (human auth: JWT) ---------------------------------------------------------------
@app.get("/events")
def list_events(session_id: str | None = None, org_id: str = Depends(current_org)) -> list[Event]:
    return store.events(org_id, session_id)

@app.get("/verdicts")
def list_verdicts(session_id: str | None = None, org_id: str = Depends(current_org)) -> list[Verdict]:
    return store.verdicts(org_id, session_id)

@app.get("/verify")
def verify(session_id: str | None = None, org_id: str = Depends(current_org)) -> dict:
    return {"chain_intact": store.verify_chain(org_id, session_id)}

@app.post("/audit/{session_id}")
def audit_session(session_id: str, org_id: str = Depends(current_org)) -> list[Verdict]:
    existing = [v for v in store.verdicts(org_id, session_id) if v.violation]
    if existing:
        return existing
    events = store.events(org_id, session_id)
    verdicts = run_audit(events, session_id, _pack)
    for v in verdicts:
        store.add_verdict(org_id, v)
    return verdicts

@app.get("/evidence/{session_id}", response_class=HTMLResponse)
def evidence(session_id: str, org_id: str = Depends(current_org)) -> str:
    events = store.events(org_id, session_id)
    verdicts = store.verdicts(org_id, session_id)
    pack = build_evidence_pack(session_id, events, verdicts,
                               framework=_pack.framework, chain_intact=store.verify_chain(org_id, session_id))
    return pack["html"]

# ---- org + key management (human auth: JWT) ------------------------------------------------
@app.post("/orgs")
def make_org(name: str = Body(embed=True), user_id: str = Depends(lambda: None)):
    raise NotImplementedError  # replaced below

@app.post("/keys")
def new_key(name: str = Body(embed=True), org_id: str = Depends(current_org)) -> dict:
    return {"key": create_api_key(org_id, name)}   # shown once

@app.get("/keys")
def keys(org_id: str = Depends(current_org)) -> list[dict]:
    return list_api_keys(org_id)

@app.delete("/keys/{key_id}")
def delete_key(key_id: int, org_id: str = Depends(current_org)) -> dict:
    revoke_api_key(org_id, key_id)
    return {"revoked": key_id}
```
Then **delete the placeholder `make_org`** stub and replace it with a real bootstrap endpoint
that creates an org for the authenticated user if they have none:
```python
from .auth import verify_jwt
from fastapi import Header, HTTPException

@app.post("/orgs")
def make_org(name: str = Body(embed=True), authorization: str = Header(default=None)) -> dict:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="missing bearer token")
    user_id = verify_jwt(authorization[len("Bearer "):])
    existing = org_for_user(user_id)
    if existing:
        return {"org_id": existing}
    return {"org_id": create_org(name, user_id)}
```
(Remove the earlier `@app.post("/orgs")` stub so only this real one remains.)

- [ ] **Step 4: Run to verify pass**

Run: `DATABASE_URL="${TEST_DATABASE_URL}" pytest tests/test_api.py -v`
Expected: PASS

- [ ] **Step 5: Run the full suite**

Run: `DATABASE_URL="${TEST_DATABASE_URL}" pytest -v`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add blackbox/ingest.py tests/test_api.py
git commit -m "feat: real tenancy on the API (JWT reads, API-key ingest, org+key endpoints); drop DEFAULT_ORG"
```

---

### Task 6: Recorder SDK sends the API key

**Files:**
- Modify: `blackbox/recorder.py`
- Test: `tests/test_recorder.py`

- [ ] **Step 1: Write the failing test**

Add to `tests/test_recorder.py` (keep existing in-process tests; add one for the header):
```python
import respx, httpx
from blackbox.recorder import BlackBoxRecorder

@respx.mock
def test_http_recorder_sends_api_key_header():
    route = respx.post("http://api.test/events").mock(return_value=httpx.Response(200, json={}))
    rec = BlackBoxRecorder(agent_id="a", session_id="s",
                           base_url="http://api.test", api_key="bb_live_xyz")
    rec.record_llm_call(intent="hi")
    assert route.called
    assert route.calls[0].request.headers["authorization"] == "Bearer bb_live_xyz"
```
Add `respx` to dev deps in `pyproject.toml`: `"respx>=0.21"` and `requirements.txt`, then
`pip install -e ".[dev]"`.

- [ ] **Step 2: Run to verify fail**

Run: `pytest tests/test_recorder.py::test_http_recorder_sends_api_key_header -v`
Expected: FAIL (`__init__` has no `api_key`)

- [ ] **Step 3: Implement**

In `blackbox/recorder.py`, update `__init__` and `_emit`:
```python
    def __init__(self, agent_id: str, session_id: str,
                 store: Optional[Store] = None, base_url: Optional[str] = None,
                 api_key: Optional[str] = None):
        self.agent_id = agent_id
        self.session_id = session_id
        self.store = store
        self.base_url = base_url.rstrip("/") if base_url else None
        self.api_key = api_key
```
And in `_emit`, change the HTTP branch:
```python
        elif self.base_url:
            headers = {"Authorization": f"Bearer {self.api_key}"} if self.api_key else {}
            httpx.post(f"{self.base_url}/events", json=e.model_dump(), headers=headers, timeout=10)
```

- [ ] **Step 4: Run to verify pass**

Run: `pytest tests/test_recorder.py -v`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add blackbox/recorder.py tests/test_recorder.py pyproject.toml requirements.txt
git commit -m "feat: recorder SDK sends bb_live API key as bearer header"
```

---

## Plan 2 self-review

- **Spec coverage:** §5 (orgs, org_members, api_keys) ✓ T1; §4 human JWT flow ✓ T3; agent
  API-key flow ✓ T4/T6; §6 BYOK deferred to Plan 3; §9.1.1 RLS as defense-in-depth ✓ T1;
  cross-tenant rejection at the API ✓ T5 (`test_cross_tenant_read_is_empty`).
- **Type consistency:** `create_org(name, owner_user_id)->org_id`, `org_for_user(user_id)`,
  `verify_jwt(token)->sub`, `current_org(authorization)->org_id`, `create_api_key(org_id,name)
  ->raw`, `resolve_api_key(raw)->org_id`, `list_api_keys(org_id)`, `revoke_api_key(org_id,
  key_id)`, `org_from_api_key(authorization)->org_id` — consistent across modules, ingest, tests.
- **No placeholders:** the one `make_org` stub is explicitly replaced within the same step with
  runnable code; every step has commands + expected output.
- **Deferred (intentional):** `/byok` endpoints + audit lock + redaction → Plan 3.
