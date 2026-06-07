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

from fastapi.responses import HTMLResponse
from .policy import load_policy_pack
from .tribunal import audit as run_audit
from .evidence import build_evidence_pack

POLICY_PATH = os.environ.get("BLACKBOX_POLICY", "policies/eu_ai_act.yaml")
_pack = load_policy_pack(POLICY_PATH)

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
