-- 0002: orgs, membership, API keys, and RLS (defense-in-depth)

-- Stub auth schema + uid() so RLS policy bodies parse on local Postgres.
-- On Supabase the real auth.uid() function exists; on local test DB this stub is used instead.
-- The policies are never exercised by tests (we connect as superuser which bypasses RLS).
CREATE SCHEMA IF NOT EXISTS auth;
CREATE OR REPLACE FUNCTION auth.uid() RETURNS text AS $$ SELECT NULL::text $$ LANGUAGE sql STABLE;

CREATE TABLE IF NOT EXISTS orgs (
    id            TEXT PRIMARY KEY,
    name          TEXT NOT NULL,
    owner_user_id TEXT NOT NULL,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS org_members (
    org_id  TEXT NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL,
    role    TEXT NOT NULL DEFAULT 'member',
    PRIMARY KEY (org_id, user_id)
);
CREATE TABLE IF NOT EXISTS api_keys (
    id           BIGSERIAL PRIMARY KEY,
    org_id       TEXT NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
    name         TEXT NOT NULL,
    key_hash     TEXT NOT NULL UNIQUE,
    prefix       TEXT NOT NULL,
    last_used_at TIMESTAMPTZ,
    revoked_at   TIMESTAMPTZ,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_api_keys_org ON api_keys (org_id);

-- RLS: protects the anon/public PostgREST surface we do NOT expose. Our API uses the
-- service-role key and bypasses RLS, so app-layer org_id scoping (Plan 1) is the real boundary.
ALTER TABLE events      ENABLE ROW LEVEL SECURITY;
ALTER TABLE verdicts    ENABLE ROW LEVEL SECURITY;
ALTER TABLE orgs        ENABLE ROW LEVEL SECURITY;
ALTER TABLE org_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys    ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS org_members_self ON org_members;
CREATE POLICY org_members_self ON org_members
    FOR SELECT USING (user_id = auth.uid()::text);
DROP POLICY IF EXISTS events_by_member ON events;
CREATE POLICY events_by_member ON events
    FOR SELECT USING (org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid()::text));
DROP POLICY IF EXISTS verdicts_by_member ON verdicts;
CREATE POLICY verdicts_by_member ON verdicts
    FOR SELECT USING (org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid()::text));
