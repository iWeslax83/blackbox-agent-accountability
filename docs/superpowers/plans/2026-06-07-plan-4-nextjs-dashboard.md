# Plan 4 — Next.js Account Dashboard

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or
> superpowers:executing-plans. Steps use checkbox (`- [ ]`) syntax. **Also load the `supabase`
> skill** before writing any Supabase client/auth code.

**Goal:** A Next.js app where a user signs up, logs in (Supabase Auth), bootstraps an org,
manages API keys + BYOK, and views their sessions / incidents / evidence — all talking to the
Plan 1–3 API with the Supabase JWT.

**Architecture:** Next.js App Router (TypeScript) in `frontend/`. `@supabase/supabase-js`
manages auth and gives the JWT; a thin typed API client attaches `Authorization: Bearer <jwt>`
to every backend call. Pure client components (no server secrets in the browser). Warm-paper
theme carried over from the existing landing. Deployed to Vercel (Plan 5).

**Tech Stack:** Next.js 14 (App Router), TypeScript, @supabase/supabase-js, Vitest (unit),
the API from Plans 1–3.

**Depends on:** Plans 1–3 (the API surface: `/orgs`, `/keys`, `/byok`, `/events`, `/verdicts`,
`/audit`, `/verify`, `/evidence`).

**Env (`frontend/.env.local`, never committed):**
```
NEXT_PUBLIC_SUPABASE_URL=https://<project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
NEXT_PUBLIC_API_URL=http://localhost:8900
```

---

### Task 1: Scaffold the Next.js app + typed API client (TDD via Vitest)

**Files:**
- Create: `frontend/` (Next.js app), `frontend/.env.local.example`, `frontend/.gitignore`
- Create: `frontend/lib/api.ts`
- Create: `frontend/lib/api.test.ts`
- Create: `frontend/vitest.config.ts`

- [ ] **Step 1: Scaffold**

Run (from repo root):
```bash
cd /home/weslax83/blackbox
npx create-next-app@latest frontend --typescript --app --eslint --no-tailwind --no-src-dir --import-alias "@/*" --use-npm
cd frontend
npm install @supabase/supabase-js
npm install -D vitest @vitest/ui jsdom
```
Create `frontend/.env.local.example`:
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_API_URL=http://localhost:8900
```
Ensure `frontend/.gitignore` includes `.env.local` (create-next-app adds it; confirm).

- [ ] **Step 2: Vitest config**

Create `frontend/vitest.config.ts`:
```ts
import { defineConfig } from "vitest/config";
export default defineConfig({
  test: { environment: "jsdom", globals: true },
});
```
Add to `frontend/package.json` scripts:
```json
    "test": "vitest run"
```

- [ ] **Step 3: Write the failing test**

Create `frontend/lib/api.test.ts`:
```ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { apiFetch } from "./api";

beforeEach(() => {
  process.env.NEXT_PUBLIC_API_URL = "http://api.test";
  vi.stubGlobal("fetch", vi.fn(async () =>
    new Response(JSON.stringify({ ok: true }), { status: 200,
      headers: { "content-type": "application/json" } })));
});

describe("apiFetch", () => {
  it("attaches the bearer token", async () => {
    await apiFetch("/keys", { token: "jwt-123" });
    const [, init] = (fetch as any).mock.calls[0];
    expect(init.headers["Authorization"]).toBe("Bearer jwt-123");
  });
  it("prefixes the API base url", async () => {
    await apiFetch("/verify", { token: "t" });
    const [url] = (fetch as any).mock.calls[0];
    expect(url).toBe("http://api.test/verify");
  });
  it("throws on non-2xx", async () => {
    (fetch as any).mockResolvedValueOnce(new Response("nope", { status: 401 }));
    await expect(apiFetch("/keys", { token: "t" })).rejects.toThrow();
  });
});
```

- [ ] **Step 4: Run to verify fail**

Run: `cd frontend && npm test`
Expected: FAIL (`./api` has no `apiFetch`)

- [ ] **Step 5: Implement the client**

Create `frontend/lib/api.ts`:
```ts
type Options = { token: string; method?: string; body?: unknown };

export async function apiFetch<T = unknown>(path: string, opts: Options): Promise<T> {
  const base = process.env.NEXT_PUBLIC_API_URL ?? "";
  const headers: Record<string, string> = {
    "Authorization": `Bearer ${opts.token}`,
    "Content-Type": "application/json",
  };
  const res = await fetch(`${base}${path}`, {
    method: opts.method ?? "GET",
    headers,
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });
  if (!res.ok) throw new Error(`API ${res.status}: ${await res.text()}`);
  const ct = res.headers.get("content-type") ?? "";
  return (ct.includes("application/json") ? await res.json() : (await res.text())) as T;
}
```

- [ ] **Step 6: Run to verify pass + commit**

Run: `cd frontend && npm test`
Expected: PASS
```bash
cd /home/weslax83/blackbox
git add frontend
git commit -m "feat(frontend): scaffold Next.js app + typed API client with bearer auth (Vitest)"
```

---

### Task 2: Supabase auth client + session hook

**Files:**
- Create: `frontend/lib/supabase.ts`
- Create: `frontend/lib/useSession.ts`
- Create: `frontend/lib/supabase.test.ts`

**Load the `supabase` skill first** for current `@supabase/supabase-js` patterns.

- [ ] **Step 1: Write the failing test**

Create `frontend/lib/supabase.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { getSupabase } from "./supabase";

describe("getSupabase", () => {
  it("returns a singleton client", () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://x.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon-key";
    expect(getSupabase()).toBe(getSupabase());
  });
});
```

- [ ] **Step 2: Run to verify fail**

Run: `cd frontend && npm test -- supabase`
Expected: FAIL (`./supabase` missing)

- [ ] **Step 3: Implement**

Create `frontend/lib/supabase.ts`:
```ts
import { createClient, SupabaseClient } from "@supabase/supabase-js";

let _client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (!_client) {
    _client = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { auth: { persistSession: true, autoRefreshToken: true } },
    );
  }
  return _client;
}
```
Create `frontend/lib/useSession.ts`:
```ts
"use client";
import { useEffect, useState } from "react";
import { getSupabase } from "./supabase";

export function useSession() {
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const sb = getSupabase();
    sb.auth.getSession().then(({ data }) => {
      setToken(data.session?.access_token ?? null);
      setLoading(false);
    });
    const { data: sub } = sb.auth.onAuthStateChange((_e, session) => {
      setToken(session?.access_token ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);
  return { token, loading };
}
```

- [ ] **Step 4: Run to verify pass + commit**

Run: `cd frontend && npm test`
Expected: PASS
```bash
cd /home/weslax83/blackbox && git add frontend && git commit -m "feat(frontend): supabase client singleton + useSession hook"
```

---

### Task 3: Login / signup page

**Files:**
- Create: `frontend/app/login/page.tsx`

- [ ] **Step 1: Implement the page**

Create `frontend/app/login/page.tsx`:
```tsx
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabase } from "@/lib/supabase";

export default function LoginPage() {
  const sb = getSupabase();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [err, setErr] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    const fn = mode === "login" ? sb.auth.signInWithPassword : sb.auth.signUp;
    const { error } = await fn({ email, password });
    if (error) return setErr(error.message);
    router.push("/app");
  }

  return (
    <main style={{ maxWidth: 360, margin: "10vh auto", fontFamily: "ui-serif, Georgia" }}>
      <h1>BLACKBOX</h1>
      <form onSubmit={submit}>
        <input placeholder="email" value={email} onChange={e => setEmail(e.target.value)} />
        <input type="password" placeholder="password" value={password}
               onChange={e => setPassword(e.target.value)} />
        <button type="submit">{mode === "login" ? "Log in" : "Sign up"}</button>
      </form>
      {err && <p style={{ color: "#b4451f" }}>{err}</p>}
      <button onClick={() => setMode(mode === "login" ? "signup" : "login")}>
        {mode === "login" ? "Need an account? Sign up" : "Have an account? Log in"}
      </button>
    </main>
  );
}
```

- [ ] **Step 2: Manual verification**

Run: `cd frontend && npm run dev` then open `http://localhost:3000/login`.
Expected: form renders; with real Supabase env, signup creates a user and redirects to `/app`.
(Defer live-auth verification to Plan 5 if Supabase isn't provisioned yet — the page must at
least render without runtime errors. Confirm `npm run build` succeeds.)

- [ ] **Step 3: Commit**

```bash
cd /home/weslax83/blackbox && git add frontend/app/login && git commit -m "feat(frontend): login/signup page via Supabase Auth"
```

---

### Task 4: Dashboard — sessions, incidents, evidence, verify/tamper

**Files:**
- Create: `frontend/app/app/page.tsx`
- Create: `frontend/components/SessionView.tsx`

- [ ] **Step 1: Implement the dashboard**

Create `frontend/app/app/page.tsx`:
```tsx
"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/useSession";
import { apiFetch } from "@/lib/api";

type Event = { seq: number; session_id: string; kind: string; tool?: string; intent: string };

export default function AppPage() {
  const { token, loading } = useSession();
  const router = useRouter();
  const [sessionId, setSessionId] = useState("");
  const [events, setEvents] = useState<Event[]>([]);
  const [verdicts, setVerdicts] = useState<any[]>([]);
  const [chain, setChain] = useState<boolean | null>(null);

  useEffect(() => { if (!loading && !token) router.push("/login"); }, [loading, token]);

  async function load() {
    if (!token || !sessionId) return;
    setEvents(await apiFetch(`/events?session_id=${sessionId}`, { token }));
    const v = await apiFetch(`/verify?session_id=${sessionId}`, { token }) as { chain_intact: boolean };
    setChain(v.chain_intact);
  }
  async function audit() {
    if (!token || !sessionId) return;
    setVerdicts(await apiFetch(`/audit/${sessionId}`, { token, method: "POST" }));
  }

  if (loading) return <p>…</p>;
  return (
    <main style={{ maxWidth: 880, margin: "4vh auto", fontFamily: "ui-serif, Georgia" }}>
      <nav><a href="/app/keys">API keys</a> · <a href="/app/settings">Settings</a></nav>
      <h1>Sessions</h1>
      <input placeholder="session id" value={sessionId} onChange={e => setSessionId(e.target.value)} />
      <button onClick={load}>Load</button>
      <button onClick={audit}>Run tribunal audit</button>
      {chain !== null && <p>Chain integrity: {chain ? "✓ intact" : "✗ TAMPERED"}</p>}
      <h2>Events ({events.length})</h2>
      <ul>{events.map(e => <li key={e.seq}>#{e.seq} [{e.kind}] {e.tool} — {e.intent}</li>)}</ul>
      <h2>Verdicts ({verdicts.length})</h2>
      <ul>{verdicts.map((v, i) => <li key={i}>{v.rule_id} — {v.severity} — {v.rationale}</li>)}</ul>
      {sessionId && token &&
        <a href={`${process.env.NEXT_PUBLIC_API_URL}/evidence/${sessionId}`} target="_blank">
          Open evidence pack</a>}
    </main>
  );
}
```
(Note: the evidence link opens the HTML pack; because that endpoint needs the JWT, in Plan 5 add
a small "download" button that fetches it with `apiFetch` and opens a Blob — for now the link is a
placeholder for local dev where you can paste the token. Keep this comment in the code.)

- [ ] **Step 2: Manual verification**

Run: `cd frontend && npm run build`
Expected: build succeeds. With the API + Supabase live, loading a session shows events and the
audit button populates verdicts.

- [ ] **Step 3: Commit**

```bash
cd /home/weslax83/blackbox && git add frontend/app/app && git commit -m "feat(frontend): dashboard — sessions, events, verdicts, verify, evidence"
```

---

### Task 5: API keys page + BYOK settings page

**Files:**
- Create: `frontend/app/app/keys/page.tsx`
- Create: `frontend/app/app/settings/page.tsx`

- [ ] **Step 1: Keys page**

Create `frontend/app/app/keys/page.tsx`:
```tsx
"use client";
import { useEffect, useState } from "react";
import { useSession } from "@/lib/useSession";
import { apiFetch } from "@/lib/api";

export default function KeysPage() {
  const { token } = useSession();
  const [keys, setKeys] = useState<any[]>([]);
  const [created, setCreated] = useState<string | null>(null);
  const [name, setName] = useState("");

  async function refresh() { if (token) setKeys(await apiFetch("/keys", { token })); }
  useEffect(() => { refresh(); }, [token]);

  async function create() {
    if (!token) return;
    const r = await apiFetch("/keys", { token, method: "POST", body: { name } }) as { key: string };
    setCreated(r.key);   // shown once
    refresh();
  }
  async function revoke(id: number) {
    if (!token) return;
    await apiFetch(`/keys/${id}`, { token, method: "DELETE" });
    refresh();
  }

  return (
    <main style={{ maxWidth: 700, margin: "4vh auto", fontFamily: "ui-serif, Georgia" }}>
      <h1>API keys</h1>
      <input placeholder="name" value={name} onChange={e => setName(e.target.value)} />
      <button onClick={create}>Create key</button>
      {created && <p>Copy now — shown once: <code>{created}</code></p>}
      <ul>{keys.map(k =>
        <li key={k.id}>{k.prefix}… {k.name} {k.revoked_at ? "(revoked)" :
          <button onClick={() => revoke(k.id)}>revoke</button>}</li>)}</ul>
    </main>
  );
}
```

- [ ] **Step 2: Settings (BYOK) page**

Create `frontend/app/app/settings/page.tsx`:
```tsx
"use client";
import { useEffect, useState } from "react";
import { useSession } from "@/lib/useSession";
import { apiFetch } from "@/lib/api";

export default function SettingsPage() {
  const { token } = useSession();
  const [configured, setConfigured] = useState<boolean | null>(null);
  const [key, setKey] = useState("");

  async function refresh() {
    if (token) setConfigured((await apiFetch("/byok", { token }) as any).configured);
  }
  useEffect(() => { refresh(); }, [token]);

  async function save() {
    if (!token) return;
    await apiFetch("/byok", { token, method: "PUT", body: { key } });
    setKey(""); refresh();
  }
  async function clear() {
    if (!token) return;
    await apiFetch("/byok", { token, method: "DELETE" }); refresh();
  }

  return (
    <main style={{ maxWidth: 700, margin: "4vh auto", fontFamily: "ui-serif, Georgia" }}>
      <h1>Settings — Anthropic key (BYOK)</h1>
      <p>Status: {configured === null ? "…" : configured ? "✓ configured" : "not set"}</p>
      <input type="password" placeholder="sk-ant-…" value={key} onChange={e => setKey(e.target.value)} />
      <button onClick={save}>Save</button>
      <button onClick={clear}>Clear</button>
      <p style={{ color: "#8a8275" }}>Your key is encrypted at rest and used only to run your audits.</p>
    </main>
  );
}
```

- [ ] **Step 3: Verify build + commit**

Run: `cd frontend && npm run build`
Expected: build succeeds.
```bash
cd /home/weslax83/blackbox && git add frontend/app/app/keys frontend/app/app/settings
git commit -m "feat(frontend): API key management + BYOK settings pages"
```

---

### Task 6: Port the marketing landing into Next.js

**Files:**
- Rewrite: `frontend/app/page.tsx`
- Reference: existing `docs/index.html`

- [ ] **Step 1: Port the landing**

Replace `frontend/app/page.tsx` with the warm-paper landing content from `docs/index.html`,
converted to JSX: hero, problem, 4-pillar how-it-works, pricing, and a CTA linking to `/login`.
Keep the palette (cream `#f4efe6`, ink `#1a1714`, rust `#b4451f`, muted `#8a8275`, border
`#e3dccd`). Replace the static Formspree waitlist with a "Get started" button → `/login`.

(Concrete starter — keep your existing copy, just wire the structure:)
```tsx
export default function Landing() {
  return (
    <main style={{ background: "#f4efe6", color: "#1a1714", fontFamily: "ui-serif, Georgia" }}>
      <section style={{ padding: "12vh 8vw" }}>
        <h1 style={{ fontSize: "3rem" }}>The flight recorder for AI agents.</h1>
        <p style={{ maxWidth: 560, color: "#8a8275" }}>
          Tamper-evident logging + an autonomous compliance tribunal that audits every agent
          action against the EU AI Act, with auditor-ready evidence packs.</p>
        <a href="/login" style={{ background: "#b4451f", color: "#fff", padding: "12px 20px",
          borderRadius: 6, textDecoration: "none" }}>Get started free</a>
      </section>
      {/* port the problem / 4-pillar / pricing sections from docs/index.html here */}
    </main>
  );
}
```

- [ ] **Step 2: Verify build + commit**

Run: `cd frontend && npm run build`
Expected: build succeeds, `/` renders the landing, `/login` and `/app` reachable.
```bash
cd /home/weslax83/blackbox && git add frontend/app/page.tsx
git commit -m "feat(frontend): port warm-paper landing into Next.js with /login CTA"
```

---

## Plan 4 self-review

- **Spec coverage:** §8 pages — landing ✓ T6, login/signup ✓ T3, `/app` sessions+incident+
  evidence+verify ✓ T4, `/app/keys` ✓ T5, `/app/settings` BYOK ✓ T5; JWT-authenticated API
  calls ✓ T1 client + `useSession` T2.
- **Type consistency:** `apiFetch(path, {token, method?, body?})` used by every page;
  `getSupabase()` singleton; `useSession() -> {token, loading}` consistent across pages.
- **Known follow-ups flagged in-code (Plan 5):** the evidence link needs a JWT-fetch-to-Blob
  button (commented in T4); live Supabase auth verification happens in Plan 5 once the project is
  provisioned. Until then every page must `npm run build` clean and render without runtime errors.
- **No silent gaps:** frontend tests cover the auth-critical client (`apiFetch` bearer + base +
  error) and the Supabase singleton; UI pages are verified via `npm run build` + manual dev-server
  checks, which is the appropriate altitude for these thin client components.
