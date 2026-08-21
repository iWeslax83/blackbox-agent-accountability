-- 0009: one outbound webhook per org, fired when the tribunal confirms a violation
CREATE TABLE IF NOT EXISTS org_webhooks (
    org_id     TEXT PRIMARY KEY REFERENCES orgs(id) ON DELETE CASCADE,
    url        TEXT NOT NULL,
    secret     TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE org_webhooks ENABLE ROW LEVEL SECURITY;
