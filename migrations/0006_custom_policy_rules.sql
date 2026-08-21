-- 0006: per-org custom policy rules, merged into the base pack at audit time (Pro plan)
CREATE TABLE IF NOT EXISTS org_policy_rules (
    org_id         TEXT NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
    rule_id        TEXT NOT NULL,
    description    TEXT NOT NULL,
    severity       TEXT NOT NULL,
    framework_ref  TEXT NOT NULL DEFAULT 'Custom',
    detector_hint  TEXT NOT NULL DEFAULT '',
    keywords       TEXT[] NOT NULL DEFAULT '{}',
    created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (org_id, rule_id)
);
ALTER TABLE org_policy_rules ENABLE ROW LEVEL SECURITY;
