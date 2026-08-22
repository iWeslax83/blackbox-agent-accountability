-- 0011: optional model/token/cost metadata on llm_call events, for cost tracking.
-- Not part of the hash-chain digest (see store._event_digest) so this stays additive:
-- existing chains verify unchanged whether or not these columns are populated.
ALTER TABLE events ADD COLUMN IF NOT EXISTS model TEXT;
ALTER TABLE events ADD COLUMN IF NOT EXISTS input_tokens INTEGER;
ALTER TABLE events ADD COLUMN IF NOT EXISTS output_tokens INTEGER;
ALTER TABLE events ADD COLUMN IF NOT EXISTS cost_usd DOUBLE PRECISION;
