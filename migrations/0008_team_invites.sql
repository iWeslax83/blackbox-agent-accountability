-- 0008: team invites, for adding more than one user to an org

-- Stub auth.users so the local/test Postgres (which only has the auth.uid() stub from 0002, not
-- Supabase's real auth schema) can satisfy list_members()'s join to it. On real Supabase this is
-- a no-op since auth.users already exists there with real data.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables WHERE schemaname = 'auth' AND tablename = 'users'
  ) THEN
    CREATE TABLE auth.users (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), email text);
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS org_invites (
    id          BIGSERIAL PRIMARY KEY,
    org_id      TEXT NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
    email       TEXT NOT NULL,
    role        TEXT NOT NULL DEFAULT 'member',
    token       TEXT NOT NULL UNIQUE,
    invited_by  TEXT NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    accepted_at TIMESTAMPTZ,
    UNIQUE (org_id, email)
);
CREATE INDEX IF NOT EXISTS idx_org_invites_email ON org_invites (email) WHERE accepted_at IS NULL;
ALTER TABLE org_invites ENABLE ROW LEVEL SECURITY;
