# blackbox/blackbox/ingest.py
import os
from fastapi import FastAPI, Depends, Body, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse
from .schema import Event, Verdict
from .store import Store
from .auth import current_org, verify_jwt
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
