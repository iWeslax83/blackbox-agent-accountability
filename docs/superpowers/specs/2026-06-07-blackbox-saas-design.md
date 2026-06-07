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
- `POST /audit/{session_id}` — JWT auth; run tribunal (BYOK if present, else offline); idempotent.
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

## 10. Testing strategy (strict TDD)

Test-first for every security-critical boundary:
- **Tenancy isolation:** an event/verdict/session created under org A is never readable or
  auditable by org B (the highest-priority test — a scoping bug is a cross-customer data leak).
- **API-key lifecycle:** create → hash stored not plaintext → verify resolves org → revoke → 401.
- **BYOK crypto:** round-trip encrypt/decrypt; ciphertext ≠ plaintext; wrong master key fails;
  plaintext never appears in DB or logs.
- **JWT auth:** valid token → access; tampered/expired/absent → 401; correct `org_id` derivation.
- **Chain per tenant:** hash chain remains valid and tamper-evident within an org's session.
- Existing unit/integration tests continue to pass against Postgres.

## 11. Build order (becomes the implementation plan)

1. Postgres store + SQL migrations (swap SQLite, preserve hash-chain) — TDD.
2. Org/tenancy model + membership.
3. Supabase JWT verification middleware on the API.
4. API-key issue/verify/revoke.
5. BYOK encryption + wire into tribunal.
6. Next.js dashboard (auth, sessions, keys, settings) + port landing.
7. Hardening: health/ready, CORS lockdown, rate-limit, structured logging.
8. CI with Postgres service + `render.yaml`/`vercel.json` + deploy docs.
9. End-to-end live verification (in-session if creds supplied).

## 12. Out of scope (YAGNI)

Billing/Stripe, usage metering/quotas, multi-region, SSO/SAML, team invitations beyond a
single org owner+members, paid tiers, on-prem. These are explicitly deferred.

## 13. Risks

- **Cross-tenant leakage** — mitigated by app-layer `org_id` scoping on every query + RLS +
  the tenancy isolation test as a gate.
- **BYOK key exposure** — mitigated by AES-GCM encryption at rest, in-memory-only decryption,
  no logging of secrets.
- **Free-tier cold starts (Render)** — acceptable for a portfolio/waitlist product; documented.
- **Supabase/Render/Vercel account + secret provisioning** requires the user's own accounts;
  the API cannot create these. Live wire-up is contingent on supplied credentials.
