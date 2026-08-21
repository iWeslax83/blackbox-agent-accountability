-- 0010: which built-in policy pack an org's tribunal runs against
ALTER TABLE orgs ADD COLUMN IF NOT EXISTS policy_framework TEXT NOT NULL DEFAULT 'eu_ai_act';
