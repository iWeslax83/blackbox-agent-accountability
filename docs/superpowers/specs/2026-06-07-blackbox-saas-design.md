# BLACKBOX — Self-Serve SaaS: Design Spec

**Date:** 2026-06-07
**Status:** Approved decisions locked; pending user review
**Author:** Emir Sakarya (solo)

## 1. Goal

Take the existing single-tenant BLACKBOX MVP (a working AI-agent flight recorder +
compliance tribunal) and make it a **fully operational, self-serve multi-tenant SaaS**
that external developers can sign up for, generate API keys, pipe their own agents into,
and audit against EU AI Act policies — deployed live on real infrastructure that survives
restarts. No billing yet (free tier only). Monetization remains "portfolio + waitlist first";
this upgrade turns the portfolio piece into a real product.

## 2. Locked decisions

| Decision | Choice |
|---|---|
| Product scope | Self-serve SaaS, no billing (free tier only) |
| Auth + database | Supabase (managed Postgres + Auth) |
| Tribunal LLM cost | BYOK — customers supply their own `ANTHROPIC_API_KEY`, encrypted at rest |
| Frontend | Next.js (React) |
| Deploy | Build deploy-ready configs; wire fully live in-session if credentials are supplied |
| Testing | Strict TDD, especially for tenancy/auth/key/encryption boundaries |
| Hosting | Frontend → Vercel · API → Render (Docker) · Postgres+Auth → Supabase |

## 3. What stays vs. what changes

**Reused unchanged (proven, already tested):**
- Hash-chain digest logic (`store.py` `_event_digest`) — chain now computed per `(org_id, session_id)`.
- LangGraph tribunal (`tribunal.py`): lens fan-out → consolidate consensus.
- Evidence pack builder (`evidence.py`), policy packs (`policy.py`, `policies/eu_ai_act.yaml`).
- Recorder SDK (`recorder.py`) — gains an API-key header.
- Warm-paper brand aesthetic.

**New layers:**
- Tenancy + identity (orgs, members, Supabase JWT).
- Postgres-backed store (replaces SQLite).
- API-key issuance/verification.
- Encrypted BYOK secret storage.
- Next.js account dashboard.
- Production hardening + reproducible deploy.

## 4. Architecture

Three hosted surfaces, all on free tiers, none ephemeral:

```
Frontend (Vercel, Next.js)  ──JWT──▶  Supabase Auth + Postgres
   landing · auth · dashboard                   ▲
          │ JWT                                  │ service-role
          ▼                                      │
API (Render, FastAPI/Docker)  ───────────────────┘
   /events (API-key)  /audit (BYOK)  /evidence  /verify  /health
          ▲ bb_live_… key
Customer agent + recorder SDK
```

- **API** holds the Supabase service-role key and is the single gatekeeper: it validates
  identity (JWT for humans, API key for agents), derives `org_id`, and scopes **every**
  query by `org_id`.
- **Supabase RLS** policies act as defense-in-depth even though the app layer is the primary
  enforcement point.

## 5. Data model (Postgres)

Identity source of truth is Supabase `auth.users`. Application tables:

- `orgs` — `id`, `name`, `owner_user_id`, `created_at`
- `org_members` — `org_id`, `user_id`, `role` (`owner` | `member`)
- `api_keys` — `id`, `org_id`, `name`, `key_hash` (SHA-256), `prefix`, `last_used_at`,
  `revoked_at`. Raw key shown to the user exactly once at creation.
- `byok_secrets` — `org_id`, `provider` (`anthropic`), `ciphertext`, `created_at`. The
  Anthropic key is encrypted with AES-GCM/Fernet using a server master key from env
  (`BLACKBOX_SECRET_KEY`); plaintext never persisted or logged.
- `events` — existing fields **plus** `org_id`. Hash chain is per `(org_id, session_id)`.
- `verdicts` — existing fields **plus** `org_id`.

Indexes on `(org_id, session_id, seq)` for events and `(org_id, session_id)` for verdicts.
Migrations are SQL files checked into the repo (`migrations/`), applied to Supabase.

## 6. Auth & key flows

- **Humans:** Supabase Auth (email/password + magic link) in the Next.js app. Protected API
  endpoints require `Authorization: Bearer <supabase-jwt>`; the API verifies the JWT
  signature against Supabase's JWKS and resolves the caller's `org_id` via `org_members`.
- **Agents (machine):** `Authorization: Bearer bb_live_<random>` on `POST /events`. The API
  SHA-256-hashes the presented key, looks it up in `api_keys` (not revoked), resolves
  `org_id`, updates `last_used_at`, and scopes the write. Unknown/revoked key → 401.
- **BYOK:** In Settings the user pastes their Anthropic key → encrypted → stored in
  `byok_secrets`. At audit time the API decrypts it in-memory to instantiate the tribunal's
  Claude client. No BYOK key → the audit falls back to the deterministic offline/rule path
  (existing behavior); the live Claude tribunal is gated on BYOK presence.

## 7. API surface (all tenant-scoped)

- `POST /events` — API-key auth; append event to the caller's org chain.
- `GET /events?session_id=` — JWT auth; list the org's events.
- `POST /audit/{session_id}` — JWT auth; run tribunal (BYOK if present, else offline).
  Idempotent **and** concurrency-safe: serialized by a DB-backed execution lock (see §9) so two
  simultaneous clicks can never both run the tribunal and double-spend the customer's BYOK key.
- `GET /verdicts?session_id=` — JWT auth.
- `GET /verify?session_id=` — JWT auth; chain integrity for the org's session.
- `GET /evidence/{session_id}` — JWT auth; HTML/JSON evidence pack.
- `GET /health`, `GET /ready` — liveness/readiness (no auth).
- Org/key/BYOK management endpoints (JWT): create org, list/create/revoke API keys, set/clear BYOK.

## 8. Frontend (Next.js)

Pages: marketing `/` (port existing landing), `/login` + `/signup` (Supabase Auth UI),
`/app` (sessions list + incident detail + evidence export + tamper/verify demo),
`/app/keys` (API-key management), `/app/settings` (BYOK). Calls the API with the Supabase
JWT; uses `@supabase/supabase-js` for auth. Deployed to Vercel. Warm-paper theme carried over.

## 9. Hardening (the "fully operational" part)

- `/health` + `/ready`; structured JSON logging; optional Sentry via env.
- CORS locked to the Vercel origin (no `*` in production).
- Rate-limiting on `/events` and `/audit`.
- All secrets via env (`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_JWT_SECRET`,
  `BLACKBOX_SECRET_KEY`, optional `SENTRY_DSN`); none committed.
- CI: spin up a Postgres service container, run the full pytest suite (extended with
  tenancy/auth/key/encryption tests) on every push before deploy.
- Reproducible deploy: `render.yaml`, `vercel.json`, updated `DEPLOY.md`, `.env.example`.

### 9.1 Security & reliability gaps to close explicitly

These four are mandatory, not optional polish:

1. **Service-role must not silently defeat RLS.** The API authenticates with the Supabase
   service-role key, which **bypasses RLS entirely** — so RLS is *not* a backstop for the
   API's own queries. App-layer `org_id` scoping is therefore the **sole** primary enforcement
   and every data-access function MUST take `org_id` as a required argument (no "fetch by id"
   without org). The store layer exposes **no** un-scoped query path; a single audited
   `_scoped()` helper is the only way rows are read/written, so a missing filter is impossible
   by construction (and unit-tested). RLS policies are still defined and enabled to protect the
   anon/public PostgREST surface (which we do not expose), and CI asserts no store method issues
   a query lacking an `org_id` predicate.
2. **DB-backed execution lock on `/audit`.** The current read-then-write idempotency check is
   racy: two concurrent calls both see "no verdicts yet", both run the tribunal, both spend the
   customer's Anthropic credits. Replace with a Postgres advisory lock
   (`pg_try_advisory_xact_lock(hashtext(org_id||session_id))`) **or** an `audit_runs` row with a
   `UNIQUE(org_id, session_id)` constraint claimed via `INSERT … ON CONFLICT DO NOTHING` and a
   status state machine (`pending`/`done`/`failed`). The loser of the race returns the existing
   result (or waits) instead of launching a second tribunal. Covered by a concurrency test.
3. **Bounded DB connection pool sized for the free tier.** Supabase free-tier Postgres has a low
   direct-connection ceiling; the LangGraph tribunal fans out one lens node per rule concurrently.
   Connect through the **Supabase transaction pooler (pgBouncer, port 6543)** and cap the
   SQLAlchemy/asyncpg pool (`pool_size=5`, `max_overflow=2`, `pool_timeout`, `pool_pre_ping=True`)
   so a fan-out can never open more DB connections than the tier allows. Crucially, the tribunal's
   concurrent lens agents do **LLM** work, not DB work — DB reads happen once up front and verdict
   writes happen once after consolidation, so fan-out width is decoupled from pool size. Pool
   limits are config constants with documented rationale, not magic numbers.
4. **Decrypted secrets can never reach logs.** A custom `logging.Filter` (installed on the root
   logger and any Sentry/error handler) redacts anything matching the Anthropic key shape
   (`sk-ant-…`) and the `bb_live_…` API-key shape from every log record and exception payload.
   The decrypted BYOK key lives only in a local variable for the duration of one audit, is never
   placed on a model/dataclass that gets serialized, and is never passed to `logger.*`. A test
   forces a tribunal runtime failure with a known key in scope and asserts the key string appears
   in **no** emitted log line.

## 10. Testing strategy (strict TDD)

Test-first for every security-critical boundary:
- **Tenancy isolation:** an event/verdict/session created under org A is never readable or
  auditable by org B (the highest-priority test — a scoping bug is a cross-customer data leak).
- **API-key lifecycle:** create → hash stored not plaintext → verify resolves org → revoke → 401.
- **BYOK crypto:** round-trip encrypt/decrypt; ciphertext ≠ plaintext; wrong master key fails;
  plaintext never appears in DB or logs.
- **JWT auth:** valid token → access; tampered/expired/absent → 401; correct `org_id` derivation.
- **Chain per tenant:** hash chain remains valid and tamper-evident within an org's session.
- **No un-scoped queries (§9.1.1):** every store method requires `org_id`; a static/CI check
  fails if any query path omits the `org_id` predicate.
- **Audit concurrency (§9.1.2):** two simultaneous `/audit` calls for the same session run the
  tribunal exactly once; the second returns the first's result, BYOK key spent once.
- **Connection pool bound (§9.1.3):** a tribunal fan-out under the configured pool never exceeds
  the connection cap (asserted against a pool with a tight limit).
- **Secret never logged (§9.1.4):** a forced tribunal failure with a live key in scope emits no
  log line containing the key; the redaction filter masks `sk-ant-…` and `bb_live_…`.
- Existing unit/integration tests continue to pass against Postgres.

## 11. Build order (becomes the implementation plan)

1. Postgres store + SQL migrations (swap SQLite, preserve hash-chain) — TDD. Includes the
   single audited `org_id`-scoped query helper and the no-un-scoped-query guard (§9.1.1),
   plus pooler config + bounded pool (§9.1.3).
2. Org/tenancy model + membership + RLS policies (defense-in-depth for the unexposed PostgREST surface).
3. Supabase JWT verification middleware on the API.
4. API-key issue/verify/revoke.
5. BYOK encryption + wire into tribunal, with the secret-redaction log filter (§9.1.4) and the
   DB-backed `/audit` execution lock (§9.1.2).
6. Next.js dashboard (auth, sessions, keys, settings) + port landing.
7. Hardening: health/ready, CORS lockdown, rate-limit, structured logging + redaction filter wired globally.
8. CI with Postgres service + `render.yaml`/`vercel.json` + deploy docs.
9. End-to-end live verification (in-session if creds supplied).

## 12. Out of scope (YAGNI)

Billing/Stripe, usage metering/quotas, multi-region, SSO/SAML, team invitations beyond a
single org owner+members, paid tiers, on-prem. These are explicitly deferred.

## 13. Risks

- **Cross-tenant leakage** — service-role bypasses RLS, so app-layer `org_id` scoping via the
  single audited query helper is the real boundary (§9.1.1); RLS is defense-in-depth for the
  unexposed PostgREST surface; the tenancy isolation test gates merges.
- **BYOK key exposure** — AES-GCM encryption at rest, in-memory-only decryption, and the
  `sk-ant-…`/`bb_live_…` redaction log filter (§9.1.4) so secrets never reach logs even on failure.
- **Double-spend of BYOK credits** — DB-backed execution lock serializes concurrent `/audit`
  calls (§9.1.2).
- **Free-tier DB connection exhaustion** — transaction pooler + bounded pool decoupled from
  tribunal fan-out width (§9.1.3).
- **Free-tier cold starts (Render)** — acceptable for a portfolio/waitlist product; documented.
- **Supabase/Render/Vercel account + secret provisioning** requires the user's own accounts;
  the API cannot create these. Live wire-up is contingent on supplied credentials.
