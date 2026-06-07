# blackbox/blackbox/ingest.py
import os
from fastapi import FastAPI, Depends, Body, Header, HTTPException, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse
from .schema import Event, Verdict
from .store import Store
from .auth import current_org, verify_jwt
from .apikeys import org_from_api_key, create_api_key, list_api_keys, revoke_api_key
from .orgs import create_org, org_for_user
from .policy import load_policy_pack
from .byok import set_byok, get_byok, clear_byok, has_byok
from .auditlock import audited_run
from .logging_config import configure_logging
from .evidence import build_evidence_pack

store = Store()
app = FastAPI(title="BLACKBOX")
_origins = [o for o in os.environ.get("FRONTEND_ORIGIN", "").split(",") if o] or ["*"]
app.add_middleware(CORSMiddleware, allow_origins=_origins,
                   allow_methods=["*"], allow_headers=["*"], allow_credentials=True)
configure_logging()

POLICY_PATH = os.environ.get("BLACKBOX_POLICY", "policies/eu_ai_act.yaml")
_pack = load_policy_pack(POLICY_PATH)

# ---- health / readiness (no auth) ----------------------------------------------------------
@app.get("/health")
def health() -> dict:
    return {"status": "ok"}

@app.get("/ready")
def ready():
    try:
        with store.pool.connection() as conn, conn.cursor() as cur:
            cur.execute("SELECT 1")
            cur.fetchone()
        return {"db": True}
    except Exception:
        return Response(content='{"db": false}', media_type="application/json", status_code=503)

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
    api_key = get_byok(org_id, "anthropic")   # None -> offline deterministic audit
    return audited_run(store, org_id, session_id, _pack, api_key)

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

@app.get("/evidence/{session_id}", response_class=HTMLResponse)
def evidence(session_id: str, org_id: str = Depends(current_org)) -> str:
    events = store.events(org_id, session_id)
    verdicts = store.verdicts(org_id, session_id)
    pack = build_evidence_pack(session_id, events, verdicts,
                               framework=_pack.framework, chain_intact=store.verify_chain(org_id, session_id))
    return pack["html"]

# ---- org + key management (human auth: JWT) ------------------------------------------------
@app.post("/orgs")
def make_org(name: str = Body(embed=True), authorization: str = Header(default=None)) -> dict:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="missing bearer token")
    user_id = verify_jwt(authorization[len("Bearer "):])
    existing = org_for_user(user_id)
    if existing:
        return {"org_id": existing}
    return {"org_id": create_org(name, user_id)}

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
