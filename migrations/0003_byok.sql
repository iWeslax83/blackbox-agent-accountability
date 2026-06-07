-- 0003: encrypted bring-your-own-key secrets
CREATE TABLE IF NOT EXISTS byok_secrets (
    org_id     TEXT NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
    provider   TEXT NOT NULL DEFAULT 'anthropic',
    ciphertext TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (org_id, provider)
);
ALTER TABLE byok_secrets ENABLE ROW LEVEL SECURITY;
