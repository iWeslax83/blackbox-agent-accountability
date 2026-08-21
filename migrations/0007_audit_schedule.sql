-- 0007: per-org automated tribunal schedule (Pro plan)
CREATE TABLE IF NOT EXISTS org_audit_schedule (
    org_id           TEXT PRIMARY KEY REFERENCES orgs(id) ON DELETE CASCADE,
    enabled          BOOLEAN NOT NULL DEFAULT false,
    interval_minutes INT NOT NULL DEFAULT 60,
    last_run_at      TIMESTAMPTZ
);
ALTER TABLE org_audit_schedule ENABLE ROW LEVEL SECURITY;
