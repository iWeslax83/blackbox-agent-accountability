# BLACKBOX SaaS — Implementation Roadmap

> **For agentic workers:** This is an **index**, not an executable plan. Each plan file below is a
> standalone, fully-detailed, TDD implementation plan. Execute them **in order** with
> superpowers:subagent-driven-development or superpowers:executing-plans. Each plan ends with a
> green test suite and a working, committed increment.

**Spec:** `docs/superpowers/specs/2026-06-07-blackbox-saas-design.md`

**Goal:** Turn single-tenant BLACKBOX into a live, self-serve multi-tenant SaaS (Supabase +
BYOK + Next.js), deployed on Vercel/Render/Supabase.

**Why sequenced this way:** each plan depends only on the ones before it, and each leaves the
repo in a working, tested state. You can stop after any plan and still have shippable software.

---

## Plan 1 — Postgres-backed multi-tenant store
**File:** `2026-06-07-plan-1-postgres-multitenant-store.md`
Swap SQLite → Postgres (psycopg3 + bounded pool via the Supabase transaction pooler). Add
`org_id` to events/verdicts; hash chain per `(org_id, session_id)`. Single audited
`org_id`-scoped query helper — no un-scoped query path exists (§9.1.1). Bounded connection pool
(§9.1.3). SQL migrations + tiny runner. **Gate test: cross-tenant isolation.**
**Produces:** a tenant-safe persistence layer with all existing store tests passing on Postgres.

## Plan 2 — Identity & access (Supabase JWT + API keys)
**File:** `2026-06-07-plan-2-identity-and-access.md`
Orgs + membership tables + RLS policies. Supabase JWT verification middleware (JWKS / shared
secret) → derives `org_id`. `bb_live_…` API-key issue/verify/revoke (SHA-256 at rest, shown
once). Wire `/events` to API-key auth and all dashboard endpoints to JWT. Recorder SDK gains an
API-key header.
**Produces:** an authenticated multi-tenant API; anonymous and cross-tenant calls rejected.

## Plan 3 — BYOK + audit hardening
**File:** `2026-06-07-plan-3-byok-and-audit-hardening.md`
AES-GCM/Fernet encryption of the customer Anthropic key (`BLACKBOX_SECRET_KEY`); set/clear/use
flows. Wire decrypted key into the tribunal at audit time; no key → offline fallback. Global
secret-redaction log filter for `sk-ant-…` / `bb_live_…` (§9.1.4). DB-backed `/audit` execution
lock to prevent concurrent double-spend (§9.1.2).
**Produces:** safe, concurrency-correct live auditing on each customer's own credits.

## Plan 4 — Next.js account dashboard
**File:** `2026-06-07-plan-4-nextjs-dashboard.md`
Next.js app (`frontend/`): Supabase Auth (login/signup), `/app` sessions + incident detail +
evidence export + tamper/verify demo, `/app/keys`, `/app/settings` (BYOK). Port the warm-paper
landing. Calls the API with the Supabase JWT.
**Produces:** a usable product UI a recruiter or customer can sign into and operate.

## Plan 5 — Hardening, CI & live deploy
**File:** `2026-06-07-plan-5-hardening-ci-deploy.md`
`/health` + `/ready`, CORS locked to the Vercel origin, rate-limiting, structured logging.
CI with a Postgres service container running the full suite. `render.yaml`, `vercel.json`,
`.env.example`, refreshed `DEPLOY.md`. End-to-end live verification (in-session if creds supplied).
**Produces:** the fully operational, deployed product.

---

## Cross-cutting conventions (all plans)

- **TDD always:** failing test → run (see it fail) → minimal code → run (see it pass) → commit.
- **Every store/data function takes `org_id` as a required first argument.** No exceptions.
- **Secrets only via env**, never committed, never logged.
- **Commits are small and frequent**, conventional-commit style (`feat:`, `test:`, `fix:`, `chore:`).
- **Local test DB:** Postgres at `TEST_DATABASE_URL` (default `postgresql://localhost:5432/blackbox_test`).
  CI provides it as a service container (Plan 5 wires CI; Plans 1–4 assume it locally).
- **Recreate the venv after the recent move:** `cd /home/weslax83/blackbox && rm -rf .venv &&
  python -m venv .venv && source .venv/bin/activate && pip install -e ".[dev]"`.
