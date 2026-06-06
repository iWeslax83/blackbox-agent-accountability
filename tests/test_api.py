# tests/test_api.py
"""Integration tests for the FastAPI ingest app.
No LLM calls — the /audit endpoint is intentionally NOT tested here.
"""
import os
import sys
import pathlib
import pytest
from fastapi.testclient import TestClient

# Absolute path to the policy file so the import works regardless of CWD.
_POLICY_PATH = str(pathlib.Path(__file__).parent.parent / "policies" / "eu_ai_act.yaml")


def _purge_blackbox():
    """Remove all cached blackbox modules so a fresh import re-runs module-level code."""
    for key in list(sys.modules.keys()):
        if key.startswith("blackbox"):
            del sys.modules[key]


@pytest.fixture()
def client(tmp_path, monkeypatch):
    monkeypatch.setenv("BLACKBOX_DB", str(tmp_path / "api.db"))
    monkeypatch.setenv("BLACKBOX_POLICY", _POLICY_PATH)
    _purge_blackbox()
    import blackbox.ingest as ingest
    yield TestClient(ingest.app)
    # Clean up after each test so next fixture call gets a fresh import
    _purge_blackbox()


def _event(tool="send_email", to="a@b.com"):
    return {
        "agent_id": "t",
        "session_id": "s1",
        "kind": "tool_call",
        "tool": tool,
        "args": {"to": to},
        "intent": "notify",
    }


def test_post_and_list_events(client):
    r = client.post("/events", json=_event())
    assert r.status_code == 200
    body = r.json()
    assert body["seq"] == 1
    assert body["hash"]

    r2 = client.get("/events", params={"session_id": "s1"})
    assert r2.status_code == 200
    assert len(r2.json()) == 1


def test_verify_chain_via_api(client):
    client.post("/events", json=_event())
    client.post("/events", json=_event(to="c@d.com"))
    r = client.get("/verify")
    assert r.status_code == 200
    assert r.json() == {"chain_intact": True}


def test_evidence_endpoint_renders(client):
    client.post("/events", json=_event(to="evil@x.com"))

    # Seed a verdict directly into the store the app uses (same module import).
    import blackbox.ingest as ingest
    from blackbox.schema import Verdict

    ingest.store.add_verdict(
        Verdict(
            session_id="s1",
            rule_id="data_exfiltration",
            severity="critical",
            violation=True,
            confidence=0.9,
            evidence_seqs=[1],
            rationale="ext email",
            framework_ref="Art.12",
        )
    )

    r = client.get("/evidence/s1")
    assert r.status_code == 200
    assert "Compliance Evidence Pack" in r.text
    assert "data_exfiltration" in r.text


def test_verdicts_endpoint(client):
    import blackbox.ingest as ingest
    from blackbox.schema import Verdict

    ingest.store.add_verdict(
        Verdict(
            session_id="s1",
            rule_id="pii_mishandling",
            severity="high",
            violation=True,
            confidence=0.8,
            evidence_seqs=[1],
            rationale="raw PII",
            framework_ref="Art.10",
        )
    )

    r = client.get("/verdicts", params={"session_id": "s1"})
    assert r.status_code == 200
    data = r.json()
    assert any(v["rule_id"] == "pii_mishandling" for v in data)
