# blackbox/blackbox/ingest.py
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .schema import Event, Verdict
from .store import Store

DB_PATH = os.environ.get("BLACKBOX_DB", "blackbox.db")
store = Store(DB_PATH)
app = FastAPI(title="BLACKBOX")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

@app.post("/events")
def ingest(e: Event) -> Event:
    return store.append(e)

@app.get("/events")
def list_events(session_id: str | None = None) -> list[Event]:
    return store.events(session_id)

@app.get("/verdicts")
def list_verdicts(session_id: str | None = None) -> list[Verdict]:
    return store.verdicts(session_id)

@app.get("/verify")
def verify() -> dict:
    return {"chain_intact": store.verify_chain()}
