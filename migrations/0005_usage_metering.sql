-- 0005: monthly usage counter for hosted-key (non-BYOK) LLM tribunal audits
CREATE TABLE IF NOT EXISTS hosted_audit_usage (
    org_id TEXT NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
    period TEXT NOT NULL,   -- 'YYYY-MM', UTC
    count  INT NOT NULL DEFAULT 0,
    PRIMARY KEY (org_id, period)
);
ALTER TABLE hosted_audit_usage ENABLE ROW LEVEL SECURITY;
