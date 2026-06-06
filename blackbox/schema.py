# blackbox/blackbox/schema.py
from __future__ import annotations
from datetime import datetime, timezone
from typing import Any, Literal, Optional
from pydantic import BaseModel, Field

def utcnow_iso() -> str:
    return datetime.now(timezone.utc).isoformat()

EventKind = Literal["llm_call", "tool_call", "tool_result", "approval", "error"]

class Event(BaseModel):
    """One recorded agent step. `seq` and `hash` are assigned by the store."""
    agent_id: str
    session_id: str
    kind: EventKind
    intent: str = ""                 # model's stated reason for the step
    tool: Optional[str] = None
    args: dict[str, Any] = Field(default_factory=dict)
    output: str = ""
    approved_by: Optional[str] = None  # "human:<id>" | "auto" | None
    ts: str = Field(default_factory=utcnow_iso)
    # assigned on persist:
    seq: Optional[int] = None
    prev_hash: Optional[str] = None
    hash: Optional[str] = None

class Verdict(BaseModel):
    session_id: str
    rule_id: str
    severity: Literal["low", "medium", "high", "critical"]
    violation: bool
    confidence: float                 # 0..1
    evidence_seqs: list[int] = Field(default_factory=list)
    rationale: str = ""
    framework_ref: str = ""
    ts: str = Field(default_factory=utcnow_iso)
