# blackbox/blackbox/store.py
import hashlib, json, sqlite3
from typing import Optional
from .schema import Event, Verdict

def _event_digest(prev_hash: str, e: Event) -> str:
    payload = json.dumps({
        "prev": prev_hash, "agent_id": e.agent_id, "session_id": e.session_id,
        "kind": e.kind, "intent": e.intent, "tool": e.tool, "args": e.args,
        "output": e.output, "approved_by": e.approved_by, "ts": e.ts,
    }, sort_keys=True, ensure_ascii=False)
    return hashlib.sha256(payload.encode("utf-8")).hexdigest()

class Store:
    def __init__(self, path: str = "blackbox.db"):
        self.path = path
        self._init()

    def _con(self):
        c = sqlite3.connect(self.path)
        c.row_factory = sqlite3.Row
        return c

    def _init(self):
        with self._con() as c:
            c.execute("""CREATE TABLE IF NOT EXISTS events(
                seq INTEGER PRIMARY KEY AUTOINCREMENT, agent_id TEXT, session_id TEXT,
                kind TEXT, intent TEXT, tool TEXT, args TEXT, output TEXT,
                approved_by TEXT, ts TEXT, prev_hash TEXT, hash TEXT)""")
            c.execute("""CREATE TABLE IF NOT EXISTS verdicts(
                id INTEGER PRIMARY KEY AUTOINCREMENT, session_id TEXT, rule_id TEXT,
                severity TEXT, violation INTEGER, confidence REAL, evidence_seqs TEXT,
                rationale TEXT, framework_ref TEXT, ts TEXT)""")

    def append(self, e: Event) -> Event:
        with self._con() as c:
            row = c.execute("SELECT hash FROM events ORDER BY seq DESC LIMIT 1").fetchone()
            e.prev_hash = row["hash"] if row else "GENESIS"
            e.hash = _event_digest(e.prev_hash, e)
            cur = c.execute(
                """INSERT INTO events(agent_id,session_id,kind,intent,tool,args,output,
                   approved_by,ts,prev_hash,hash) VALUES(?,?,?,?,?,?,?,?,?,?,?)""",
                (e.agent_id, e.session_id, e.kind, e.intent, e.tool,
                 json.dumps(e.args, ensure_ascii=False), e.output, e.approved_by,
                 e.ts, e.prev_hash, e.hash))
            e.seq = cur.lastrowid
        return e

    def events(self, session_id: Optional[str] = None) -> list[Event]:
        q = "SELECT * FROM events"
        params = ()
        if session_id:
            q += " WHERE session_id=?"; params = (session_id,)
        q += " ORDER BY seq ASC"
        with self._con() as c:
            rows = c.execute(q, params).fetchall()
        out = []
        for r in rows:
            d = dict(r); d["args"] = json.loads(d["args"] or "{}")
            out.append(Event(**d))
        return out

    def add_verdict(self, v: Verdict):
        with self._con() as c:
            c.execute("""INSERT INTO verdicts(session_id,rule_id,severity,violation,
                confidence,evidence_seqs,rationale,framework_ref,ts)
                VALUES(?,?,?,?,?,?,?,?,?)""",
                (v.session_id, v.rule_id, v.severity, int(v.violation), v.confidence,
                 json.dumps(v.evidence_seqs), v.rationale, v.framework_ref, v.ts))

    def verdicts(self, session_id: Optional[str] = None) -> list[Verdict]:
        q = "SELECT * FROM verdicts"; params = ()
        if session_id:
            q += " WHERE session_id=?"; params = (session_id,)
        with self._con() as c:
            rows = c.execute(q, params).fetchall()
        out = []
        for r in rows:
            d = dict(r); d.pop("id", None)
            d["violation"] = bool(d["violation"])
            d["evidence_seqs"] = json.loads(d["evidence_seqs"] or "[]")
            out.append(Verdict(**d))
        return out

    def verify_chain(self) -> bool:
        prev = "GENESIS"
        for e in self.events():
            recomputed = _event_digest(prev, e)
            if recomputed != e.hash:
                return False
            prev = e.hash
        return True
