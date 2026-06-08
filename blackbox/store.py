# blackbox/blackbox/store.py
import hashlib, json
from typing import Optional
from psycopg.rows import dict_row
from .schema import Event, Verdict
from .db import get_pool

def _event_digest(prev_hash: str, e: Event) -> str:
    # org_id is part of the digest so an event is cryptographically bound to its tenant.
    payload = json.dumps({
        "prev": prev_hash, "org_id": e.org_id, "agent_id": e.agent_id,
        "session_id": e.session_id, "kind": e.kind, "intent": e.intent,
        "tool": e.tool, "args": e.args, "output": e.output,
        "approved_by": e.approved_by, "ts": e.ts,
    }, sort_keys=True, ensure_ascii=False)
    return hashlib.sha256(payload.encode("utf-8")).hexdigest()

class Store:
    """Tenant-scoped Postgres store. EVERY public method takes org_id as its first argument;
    the _assert_scoped guard makes an un-scoped query impossible by construction."""

    def __init__(self, pool=None):
        self.pool = pool or get_pool()

    # ---- the single audited scoping guard (spec §9.1.1) -------------------------------------
    @staticmethod
    def _assert_scoped(org_id: str, sql: str) -> None:
        if not org_id:
            raise ValueError("org_id is required for every query")
        if "org_id" not in sql.lower():
            raise ValueError(f"refusing un-scoped query (no org_id predicate): {sql!r}")

    # ---- writes -----------------------------------------------------------------------------
    def append(self, org_id: str, e: Event) -> Event:
        sql_last = "SELECT hash FROM events WHERE org_id=%s AND session_id=%s ORDER BY seq DESC LIMIT 1"
        sql_ins = ("INSERT INTO events"
                   "(org_id,agent_id,session_id,kind,intent,tool,args,output,approved_by,ts,prev_hash,hash)"
                   " VALUES(%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s) RETURNING seq")
        self._assert_scoped(org_id, sql_last)
        self._assert_scoped(org_id, sql_ins)
        e.org_id = org_id
        with self.pool.connection() as conn:
            with conn.cursor(row_factory=dict_row) as cur:
                cur.execute(sql_last, (org_id, e.session_id))
                row = cur.fetchone()
                e.prev_hash = row["hash"] if row else "GENESIS"
                e.hash = _event_digest(e.prev_hash, e)
                cur.execute(sql_ins, (
                    org_id, e.agent_id, e.session_id, e.kind, e.intent, e.tool,
                    json.dumps(e.args, ensure_ascii=False), e.output, e.approved_by,
                    e.ts, e.prev_hash, e.hash))
                e.seq = cur.fetchone()["seq"]
            conn.commit()
        return e

    def add_verdict(self, org_id: str, v: Verdict) -> None:
        sql = ("INSERT INTO verdicts"
               "(org_id,session_id,rule_id,severity,violation,confidence,evidence_seqs,rationale,framework_ref,ts)"
               " VALUES(%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)")
        self._assert_scoped(org_id, sql)
        v.org_id = org_id
        with self.pool.connection() as conn:
            with conn.cursor() as cur:
                cur.execute(sql, (
                    org_id, v.session_id, v.rule_id, v.severity, v.violation, v.confidence,
                    json.dumps(v.evidence_seqs), v.rationale, v.framework_ref, v.ts))
            conn.commit()

    # ---- reads ------------------------------------------------------------------------------
    def events(self, org_id: str, session_id: Optional[str] = None) -> list[Event]:
        sql = "SELECT * FROM events WHERE org_id=%s"
        params: tuple = (org_id,)
        if session_id:
            sql += " AND session_id=%s"; params += (session_id,)
        sql += " ORDER BY seq ASC"
        self._assert_scoped(org_id, sql)
        with self.pool.connection() as conn, conn.cursor(row_factory=dict_row) as cur:
            cur.execute(sql, params)
            rows = cur.fetchall()
        return [Event(**r) for r in rows]

    def verdicts(self, org_id: str, session_id: Optional[str] = None) -> list[Verdict]:
        sql = "SELECT * FROM verdicts WHERE org_id=%s"
        params: tuple = (org_id,)
        if session_id:
            sql += " AND session_id=%s"; params += (session_id,)
        self._assert_scoped(org_id, sql)
        with self.pool.connection() as conn, conn.cursor(row_factory=dict_row) as cur:
            cur.execute(sql, params)
            rows = cur.fetchall()
        out = []
        for r in rows:
            d = dict(r); d.pop("id", None)
            out.append(Verdict(**d))
        return out

    def verify_chain(self, org_id: str, session_id: Optional[str] = None) -> bool:
        prev = "GENESIS"
        for e in self.events(org_id, session_id):
            if _event_digest(prev, e) != e.hash:
                return False
            prev = e.hash
        return True

    def sessions(self, org_id: str) -> list[dict]:
        """One row per session in the org: id, event count, latest timestamp. Newest first."""
        sql = ("SELECT session_id, count(*) AS events, max(ts) AS last_ts "
               "FROM events WHERE org_id=%s GROUP BY session_id ORDER BY max(seq) DESC")
        self._assert_scoped(org_id, sql)
        with self.pool.connection() as conn, conn.cursor(row_factory=dict_row) as cur:
            cur.execute(sql, (org_id,))
            rows = cur.fetchall()
        return [{"session_id": r["session_id"], "events": r["events"], "last_ts": r["last_ts"]} for r in rows]
