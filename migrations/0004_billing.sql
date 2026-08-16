-- 0004: subscription billing (LemonSqueezy)
ALTER TABLE orgs ADD COLUMN IF NOT EXISTS plan TEXT NOT NULL DEFAULT 'free';
ALTER TABLE orgs ADD COLUMN IF NOT EXISTS plan_status TEXT NOT NULL DEFAULT 'active';
ALTER TABLE orgs ADD COLUMN IF NOT EXISTS billing_customer_id TEXT;
ALTER TABLE orgs ADD COLUMN IF NOT EXISTS billing_subscription_id TEXT;
ALTER TABLE orgs ADD COLUMN IF NOT EXISTS plan_renews_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_orgs_billing_subscription ON orgs (billing_subscription_id);

-- Raw webhook audit trail: every inbound event, verified or not, kept for replay/debugging.
CREATE TABLE IF NOT EXISTS billing_events (
    id           BIGSERIAL PRIMARY KEY,
    provider     TEXT NOT NULL DEFAULT 'lemonsqueezy',
    event_type   TEXT NOT NULL,
    org_id       TEXT,
    payload      JSONB NOT NULL,
    signature_ok BOOLEAN NOT NULL,
    received_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_billing_events_org ON billing_events (org_id);

ALTER TABLE billing_events ENABLE ROW LEVEL SECURITY;
