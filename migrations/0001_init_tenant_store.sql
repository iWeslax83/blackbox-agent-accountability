-- 0001: tenant-scoped event + verdict store
CREATE TABLE IF NOT EXISTS events (
    seq         BIGSERIAL PRIMARY KEY,
    org_id      TEXT NOT NULL,
    agent_id    TEXT NOT NULL,
    session_id  TEXT NOT NULL,
    kind        TEXT NOT NULL,
    intent      TEXT NOT NULL DEFAULT '',
    tool        TEXT,
    args        JSONB NOT NULL DEFAULT '{}',
    output      TEXT NOT NULL DEFAULT '',
    approved_by TEXT,
    ts          TEXT NOT NULL,
    prev_hash   TEXT NOT NULL,
    hash        TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_events_org_session_seq ON events (org_id, session_id, seq);

CREATE TABLE IF NOT EXISTS verdicts (
    id            BIGSERIAL PRIMARY KEY,
    org_id        TEXT NOT NULL,
    session_id    TEXT NOT NULL,
    rule_id       TEXT NOT NULL,
    severity      TEXT NOT NULL,
    violation     BOOLEAN NOT NULL,
    confidence    DOUBLE PRECISION NOT NULL,
    evidence_seqs JSONB NOT NULL DEFAULT '[]',
    rationale     TEXT NOT NULL DEFAULT '',
    framework_ref TEXT NOT NULL DEFAULT '',
    ts            TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_verdicts_org_session ON verdicts (org_id, session_id);
