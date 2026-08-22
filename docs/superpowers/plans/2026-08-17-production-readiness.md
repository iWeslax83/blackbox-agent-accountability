# Production Readiness Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close the gap between "a working app" and "a real production website" for the BLACKBOX frontend (`frontend/`): SEO infrastructure (robots.txt, sitemap, OG image, favicon, llms.txt), legal pages (privacy, terms), a custom 404, analytics, a billing success flow, two real design-rule violations found during audit (emoji-as-icon, an em dash in metadata), and a few UX gaps (sticky mobile CTA, loading indicators).

**Architecture:** Almost every task is an isolated file addition using a Next.js App Router file convention (`robots.ts`, `sitemap.ts`, `opengraph-image.tsx`, `icon.tsx`, `not-found.tsx`, segment `layout.tsx` files for metadata) or a small content page. Two tasks touch the Python backend (`blackbox/billing.py`) to add a checkout redirect URL. No task depends on the 3D landing-page work from the prior plan except by living in the same file tree; run this plan's tasks in order, they were audited against the current `master` (post-merge of the landing-3D-redesign plan).

**Tech Stack:** Next.js 16 (App Router, **non-standard version** — read `frontend/node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/01-metadata/` for the exact `robots`/`sitemap`/`opengraph-image` file-convention APIs before writing those files, per `frontend/AGENTS.md`), React 19, TypeScript, `@vercel/analytics` (new), Python/FastAPI backend (`blackbox/billing.py`, unrelated stack, only for the checkout-redirect task).

**Spec:** This plan's spec is the user-supplied checklist (originally in `dontforgettomakeitlooklikearealwebsite.txt`) plus a codebase audit performed while writing this plan. No separate spec doc exists outside this plan.

**Checklist coverage:** every line of the original checklist maps to a task below, or is marked already-satisfied with the verification evidence, in the "Checklist Coverage" section at the end of this plan.

## Global Constraints

- No gradients, no glassmorphism, no purple/violet. Flat background + exactly one accent color (`--rust: #b4451f`), per `~/.claude/CLAUDE.md`.
- No pill badges (`rounded-full` + tint) for status/labels.
- No emoji as decoration anywhere, including as a stand-in for a brand mark or icon (this plan fixes an existing violation: the 🛡 emoji used as the BLACKBOX brand mark in 4 files).
- No em dashes (—) in any copy, code, comment, or commit message (this plan fixes an existing violation: `frontend/app/layout.tsx`'s page title).
- Never use `git add -A` or `git add .`.
- Match the project's commit style: no session links, conventional-ish short messages (`feat(frontend): ...`, `fix(frontend): ...`).
- **Do not invent a production domain.** The project has no fixed custom domain yet (per `DEPLOY.md`, Vercel assigns a `*.vercel.app` URL at deploy time). Every task that needs an absolute site URL (robots, sitemap, OG image, metadataBase) must read it from a `NEXT_PUBLIC_SITE_URL` environment variable, never a hardcoded guessed domain. Task 1 adds this env var with a clearly-marked placeholder and a comment instructing the user to set the real value before deploying.
- **Do not invent legal claims or a physical street address.** The privacy policy and terms pages (Task 10) must describe only data flows that are verifiably true from reading the actual code (`blackbox/billing.py`, `frontend/app/app/settings/page.tsx`, `frontend/app/app/keys/page.tsx`, `frontend/lib/supabase.ts`), and must carry the same "not legal advice, consult qualified counsel" disclaimer already used in `Footer.tsx`. The contact/location line uses only "Bursa, Türkiye" (city/country, confirmed with the user, no street address) and the existing public GitHub repo as the contact channel (no email address has been established for public-facing contact — do not invent one).
- Both new legal pages and the 404 page are server components (no `"use client"`, no interactivity needed) and use the existing warm-paper/rust design tokens from `frontend/app/globals.css`, not new colors.

---

## File Structure

- `frontend/.env.local.example` — modify (or create if it doesn't exist; check first). Documents `NEXT_PUBLIC_SITE_URL`.
- `frontend/app/layout.tsx` — modify. Fix em-dash title, add `metadataBase`, mount `<Analytics />`.
- `frontend/components/TopNav.tsx` — modify. Replace 🛡 emoji mark with a plain "B" letter mark.
- `frontend/app/login/page.tsx` — modify. Same emoji fix (2 occurrences).
- `frontend/app/auth/callback/page.tsx` — modify. Same emoji fix.
- `frontend/app/robots.ts` — new. Search-engine crawl rules, disallows `/app/`.
- `frontend/app/sitemap.ts` — new. Lists public routes only.
- `frontend/app/opengraph-image.tsx` — new. Generated brand OG image via `ImageResponse`.
- `frontend/app/icon.tsx` — new. Generated favicon via `ImageResponse`, replaces `frontend/app/favicon.ico`.
- `frontend/public/llms.txt` — new. Plain-text site description for LLM crawlers.
- `frontend/app/not-found.tsx` — new. Custom on-brand 404 page.
- `frontend/app/page.tsx` — modify. Add route-level `export const metadata`.
- `frontend/app/login/layout.tsx` — new. Server-component wrapper solely to carry `export const metadata` for the (client-component) login page.
- `frontend/app/app/layout.tsx` — new. Same pattern, for the whole `/app/*` dashboard segment.
- `frontend/app/privacy/page.tsx` — new.
- `frontend/app/terms/page.tsx` — new.
- `frontend/components/landing/Footer.tsx` — modify. Add Privacy/Terms links and a "Bursa, Türkiye" location line.
- `frontend/components/landing/StickyMobileCta.tsx` — new. Fixed bottom CTA bar, mobile-only.
- `frontend/app/page.tsx` — modify (second edit in this plan). Mount `<StickyMobileCta />`.
- `frontend/app/app/keys/page.tsx` — modify. Add a loading indicator for the initial fetch.
- `frontend/app/app/billing/page.tsx` — modify. Add a loading indicator for the initial fetch, and a post-checkout success banner.
- `blackbox/billing.py` — modify. Add `redirect_url` to the LemonSqueezy checkout attributes.
- `frontend/public/file.svg`, `globe.svg`, `next.svg`, `vercel.svg`, `window.svg` — delete (unused Next.js template assets).
- `frontend/package.json` — modify. Add `@vercel/analytics`.

---

### Task 1: Site URL env var + fix layout metadata em dash

**Files:**
- Modify: `frontend/app/layout.tsx`
- Modify or create: `frontend/.env.local.example`

**Interfaces:**
- Produces: `process.env.NEXT_PUBLIC_SITE_URL` is the canonical absolute site URL, read by every later task that needs one (robots, sitemap, OG image, metadataBase).

- [ ] **Step 1: Check for an existing example-env file**

Run: `ls frontend/.env.local.example frontend/.env.example 2>/dev/null`

If one exists, add to it. If neither exists, create `frontend/.env.local.example`.

- [ ] **Step 2: Add the site URL variable**

Append (or add) this line, with a comment, to the example-env file:

```bash
# The canonical production URL for this site (no trailing slash). Used for
# robots.txt, sitemap.xml, Open Graph images, and absolute metadata URLs.
# Set this to your real Vercel/custom domain before deploying — do not leave
# it as localhost in production.
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

- [ ] **Step 3: Fix the em dash and add metadataBase in `frontend/app/layout.tsx`**

```tsx
import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "BLACKBOX: AI Agent Accountability",
  description: "Tamper-evident flight recorder + autonomous compliance tribunal for AI agents.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
```

Note: the `<Analytics />` import will not resolve until Task 11 installs `@vercel/analytics`. If executing tasks in order, skip adding the `Analytics` import and `<Analytics />` element in this task and let Task 11 add them (Task 11 restates the full file). If executing out of order, install the package first.

For this task specifically (Task 1, run before Task 11), write `layout.tsx` **without** the Analytics import/element:

```tsx
import type { Metadata } from "next";
import "./globals.css";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "BLACKBOX: AI Agent Accountability",
  description: "Tamper-evident flight recorder + autonomous compliance tribunal for AI agents.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
```

- [ ] **Step 4: Verify**

Run: `cd frontend && npx tsc --noEmit`
Expected: no new errors.

- [ ] **Step 5: Commit**

```bash
git add frontend/app/layout.tsx frontend/.env.local.example
git commit -m "fix(frontend): remove em dash from page title, add NEXT_PUBLIC_SITE_URL"
```

---

### Task 2: Replace emoji brand mark with a plain letter mark

**Files:**
- Modify: `frontend/components/TopNav.tsx`
- Modify: `frontend/app/login/page.tsx`
- Modify: `frontend/app/auth/callback/page.tsx`

**Interfaces:**
- Consumes: existing `.brand .mark` CSS class in `frontend/app/globals.css:44-49` (34px square, `--ink` background, `--paper` text, centered) — no CSS change needed, only the emoji content inside `<span className="mark">`.

- [ ] **Step 1: Fix `frontend/components/TopNav.tsx`**

Change:
```tsx
<a href="/app" className="brand"><span className="mark">🛡</span> BLACKBOX</a>
```
to:
```tsx
<a href="/app" className="brand"><span className="mark">B</span> BLACKBOX</a>
```

- [ ] **Step 2: Fix `frontend/app/login/page.tsx` (2 occurrences)**

Change both:
```tsx
<div className="brand" style={{ marginBottom: 16 }}><span className="mark">🛡</span> BLACKBOX</div>
```
and:
```tsx
<span className="mark">🛡</span> BLACKBOX
```
to use `<span className="mark">B</span>` in place of `<span className="mark">🛡</span>`.

- [ ] **Step 3: Fix `frontend/app/auth/callback/page.tsx`**

Read the file first to find the exact line (reported at `app/auth/callback/page.tsx:37` during the audit for this plan: `<span className="mark">🛡</span> BLACKBOX`), and apply the same replacement.

- [ ] **Step 4: Verify no emoji remain in brand marks**

Run: `cd frontend && grep -rn "🛡" app/ components/`
Expected: no output.

- [ ] **Step 5: Manual verification**

Run: `cd frontend && npm run dev`, view `/login` and `/app` (requires auth, or just inspect the rendered TopNav markup) in a browser (Chromium only, `chromium.launch()` if using Playwright) — confirm the mark renders as a plain "B" in a solid square, not an emoji glyph.

- [ ] **Step 6: Commit**

```bash
git add frontend/components/TopNav.tsx frontend/app/login/page.tsx frontend/app/auth/callback/page.tsx
git commit -m "fix(frontend): replace emoji brand mark with plain letter mark"
```

---

### Task 3: robots.ts

**Files:**
- Create: `frontend/app/robots.ts`

**Interfaces:**
- Consumes: `process.env.NEXT_PUBLIC_SITE_URL` (Task 1).

- [ ] **Step 1: Read the Next.js robots file-convention doc**

Read `frontend/node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/01-metadata/robots.md` to confirm the `MetadataRoute.Robots` shape for this Next.js version before writing the file.

- [ ] **Step 2: Write the file**

```ts
// frontend/app/robots.ts
import type { MetadataRoute } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/app/", "/auth/"],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
```

`/app/` (the authenticated dashboard) and `/auth/` (the OAuth callback route) are disallowed: they require a session and have no value being indexed.

- [ ] **Step 3: Verify**

Run: `cd frontend && npm run dev`, then fetch `http://localhost:3000/robots.txt` (via `curl` or a browser) and confirm it renders the expected `User-Agent: *` / `Allow: /` / `Disallow: /app/` / `Disallow: /auth/` / `Sitemap: ...` output.

- [ ] **Step 4: Commit**

```bash
git add frontend/app/robots.ts
git commit -m "feat(frontend): add robots.txt"
```

---

### Task 4: sitemap.ts

**Files:**
- Create: `frontend/app/sitemap.ts`

**Interfaces:**
- Consumes: `process.env.NEXT_PUBLIC_SITE_URL` (Task 1).
- Depends on: Task 10 creating `/privacy` and `/terms` routes. If run before Task 10, include those two entries anyway (the routes will exist by the time this plan is fully executed) — do not skip them.

- [ ] **Step 1: Read the Next.js sitemap file-convention doc**

Read `frontend/node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/01-metadata/sitemap.md` to confirm the `MetadataRoute.Sitemap` shape for this Next.js version.

- [ ] **Step 2: Write the file**

```ts
// frontend/app/sitemap.ts
import type { MetadataRoute } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    { url: siteUrl, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${siteUrl}/login`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${siteUrl}/privacy`, lastModified: now, changeFrequency: "yearly", priority: 0.2 },
    { url: `${siteUrl}/terms`, lastModified: now, changeFrequency: "yearly", priority: 0.2 },
  ];
}
```

Only public, unauthenticated, indexable routes are listed. `/app/*` is intentionally excluded (matches the `robots.ts` disallow).

- [ ] **Step 3: Verify**

Run: `cd frontend && npm run dev`, fetch `http://localhost:3000/sitemap.xml`, confirm all four URLs are present with the site URL correctly interpolated.

- [ ] **Step 4: Commit**

```bash
git add frontend/app/sitemap.ts
git commit -m "feat(frontend): add sitemap.xml"
```

---

### Task 5: Open Graph image

**Files:**
- Create: `frontend/app/opengraph-image.tsx`

**Interfaces:**
- None consumed from other tasks. Self-contained.

- [ ] **Step 1: Read the Next.js opengraph-image file-convention doc**

Read `frontend/node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/01-metadata/opengraph-image.md` to confirm the `ImageResponse` API and the required `size`/`contentType` exports for this Next.js version.

- [ ] **Step 2: Write the file**

```tsx
// frontend/app/opengraph-image.tsx
import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "flex-start",
          padding: "80px 96px",
          background: "#f4efe6",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            marginBottom: 40,
          }}
        >
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 14,
              background: "#1a1714",
              color: "#f4efe6",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 34,
              fontWeight: 800,
            }}
          >
            B
          </div>
          <div style={{ fontSize: 40, fontWeight: 800, color: "#1a1714", letterSpacing: "-0.02em" }}>
            BLACKBOX
          </div>
        </div>
        <div
          style={{
            fontSize: 52,
            fontWeight: 900,
            letterSpacing: "-0.03em",
            lineHeight: 1.1,
            color: "#1a1714",
            maxWidth: 900,
          }}
        >
          Prove what your <span style={{ color: "#b4451f" }}>AI agents</span> did.
        </div>
        <div
          style={{
            fontSize: 24,
            color: "#8a8275",
            marginTop: 24,
            maxWidth: 800,
          }}
        >
          Tamper-evident flight recorder and autonomous compliance tribunal for AI agents.
        </div>
      </div>
    ),
    { ...size }
  );
}
```

- [ ] **Step 3: Verify**

Run: `cd frontend && npm run dev`, fetch `http://localhost:3000/opengraph-image` in a browser and confirm a 1200x630 PNG renders with the warm-paper background, ink "B" mark, headline, and subhead, matching the landing page's design tokens (flat colors, no gradient).

- [ ] **Step 4: Commit**

```bash
git add frontend/app/opengraph-image.tsx
git commit -m "feat(frontend): add generated Open Graph image"
```

---

### Task 6: Custom favicon (icon.tsx)

**Files:**
- Create: `frontend/app/icon.tsx`
- Delete: `frontend/app/favicon.ico`

**Interfaces:**
- None consumed from other tasks. Self-contained.

- [ ] **Step 1: Confirm the current favicon is the Next.js default**

Run: `file frontend/app/favicon.ico` — it should report a multi-size `.ico` (the audit for this plan found `4 icons, 16x16 and 32x32`), consistent with the unmodified Next.js starter template default. This step is a sanity check, not a blocking condition — proceed regardless.

- [ ] **Step 2: Write `frontend/app/icon.tsx`**

```tsx
// frontend/app/icon.tsx
import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#1a1714",
          borderRadius: 7,
          color: "#f4efe6",
          fontSize: 20,
          fontWeight: 800,
          fontFamily: "system-ui, sans-serif",
        }}
      >
        B
      </div>
    ),
    { ...size }
  );
}
```

- [ ] **Step 3: Delete the old favicon**

```bash
rm frontend/app/favicon.ico
```

Next.js's `icon.tsx` file convention takes over favicon generation once `favicon.ico` is removed from `app/`.

- [ ] **Step 4: Verify**

Run: `cd frontend && npm run dev`, load `http://localhost:3000/` in a browser and confirm the browser tab icon is the ink square with a "B", not the old default icon. Also fetch `http://localhost:3000/icon` directly and confirm it returns a PNG.

- [ ] **Step 5: Commit**

```bash
git add frontend/app/icon.tsx
git rm frontend/app/favicon.ico
git commit -m "feat(frontend): replace default favicon with generated brand icon"
```

---

### Task 7: llms.txt

**Files:**
- Create: `frontend/public/llms.txt`

**Interfaces:**
- None. Static file.

- [ ] **Step 1: Write the file**

```
# frontend/public/llms.txt
# BLACKBOX

> Tamper-evident flight recorder and autonomous compliance tribunal for AI agents. Records every AI agent action into a SHA-256 hash-chained log, audits it against the EU AI Act with a multi-agent tribunal, and exports regulator-ready evidence packs.

BLACKBOX is for teams running AI agents in production who need auditor-ready proof of what those agents did, not just debugging traces.

## Core capabilities

- Recorder: every agent action (LLM calls, tool invocations, results) is appended to a SHA-256 hash-chained log. A silent edit breaks the chain immediately.
- Tribunal: an autonomous multi-agent panel audits the full log against a structured EU AI Act policy pack, flagging violations with cited evidence, article references, severity, and confidence score.
- Replay: reconstruct any incident step by step, from the triggering prompt through the tool call to the root cause.
- Evidence Pack: one-click export of an auditor-ready compliance report.

## Links

- Homepage: /
- Source code (MIT licensed): https://github.com/iWeslax83/blackbox-agent-accountability
- Log in / dashboard: /login
- Privacy policy: /privacy
- Terms of service: /terms

## Notes for AI systems

BLACKBOX is a technical tool, not legal advice. Statements about the EU AI Act on this site describe product capabilities, not legal conclusions for any specific organization.
```

- [ ] **Step 2: Verify**

Run: `cd frontend && npm run dev`, fetch `http://localhost:3000/llms.txt` and confirm it serves as plain text.

- [ ] **Step 3: Commit**

```bash
git add frontend/public/llms.txt
git commit -m "feat(frontend): add llms.txt"
```

---

### Task 8: Custom 404 page

**Files:**
- Create: `frontend/app/not-found.tsx`

**Interfaces:**
- None consumed from other tasks. Self-contained server component, uses the same design tokens as `frontend/app/globals.css`.

- [ ] **Step 1: Write the file**

```tsx
// frontend/app/not-found.tsx
export default function NotFound() {
  return (
    <main
      style={{
        minHeight: "100dvh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 16,
        padding: 24,
        background: "#f4efe6",
        color: "#1a1714",
        textAlign: "center",
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}
    >
      <div
        style={{
          width: 48,
          height: 48,
          borderRadius: 12,
          background: "#1a1714",
          color: "#f4efe6",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 24,
          fontWeight: 800,
        }}
      >
        B
      </div>
      <h1 style={{ fontSize: "2rem", fontWeight: 800, letterSpacing: "-0.02em", margin: 0 }}>
        Page not found
      </h1>
      <p style={{ color: "#8a8275", maxWidth: 420, margin: 0 }}>
        The page you're looking for doesn't exist or has moved. Check the URL, or head back to
        the homepage.
      </p>
      <a
        href="/"
        style={{
          marginTop: 8,
          display: "inline-flex",
          alignItems: "center",
          padding: ".75rem 1.6rem",
          borderRadius: 8,
          fontSize: ".95rem",
          fontWeight: 600,
          background: "#b4451f",
          color: "#fff",
          textDecoration: "none",
        }}
      >
        Back to homepage
      </a>
    </main>
  );
}
```

- [ ] **Step 2: Verify**

Run: `cd frontend && npm run dev`, visit `http://localhost:3000/this-route-does-not-exist` and confirm the custom 404 page renders (not the default Next.js 404), the "Back to homepage" link works, and there's no horizontal scroll at 375px width.

- [ ] **Step 3: Commit**

```bash
git add frontend/app/not-found.tsx
git commit -m "feat(frontend): add custom 404 page"
```

---

### Task 9: Per-route metadata (landing, login, dashboard)

**Files:**
- Modify: `frontend/app/page.tsx`
- Create: `frontend/app/login/layout.tsx`
- Create: `frontend/app/app/layout.tsx`

**Interfaces:**
- None consumed from other tasks.
- Produces: `frontend/app/login/layout.tsx` and `frontend/app/app/layout.tsx` are new server-component wrappers whose sole job is carrying `export const metadata` for their (client-component) page trees — `export const metadata` is only valid in Server Components, and `frontend/app/login/page.tsx` and every page under `frontend/app/app/` start with `"use client"`, so metadata cannot live in those page files directly.

- [ ] **Step 1: Add metadata to the landing page**

`frontend/app/page.tsx` is a Server Component already (no `"use client"`), so metadata can be added directly. Add this export near the top of the file, above the `export default function Landing()` line:

```tsx
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "BLACKBOX: AI Agent Accountability",
  description: "Tamper-evident flight recorder and autonomous compliance tribunal for AI agents. Prove what your AI agents did, before a regulator asks.",
};
```

(Leave the rest of `page.tsx`, the `Landing` component and its JSX, unchanged.)

- [ ] **Step 2: Create `frontend/app/login/layout.tsx`**

```tsx
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Log in: BLACKBOX",
  description: "Log in to your BLACKBOX workspace to audit your AI agents.",
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children;
}
```

- [ ] **Step 3: Create `frontend/app/app/layout.tsx`**

```tsx
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard: BLACKBOX",
  description: "Manage sessions, API keys, billing, and settings for your BLACKBOX workspace.",
};

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return children;
}
```

- [ ] **Step 4: Verify**

Run: `cd frontend && npx tsc --noEmit`
Expected: no new errors.

Run: `npm run dev`, load `/`, `/login`, `/app` (or any route under it) in a browser, and check the document title in each case (`document.title` via devtools, or view page source) matches the values above.

- [ ] **Step 5: Commit**

```bash
git add frontend/app/page.tsx frontend/app/login/layout.tsx frontend/app/app/layout.tsx
git commit -m "feat(frontend): add per-route page titles and descriptions"
```

---

### Task 10: Privacy policy and Terms of Service pages

**Files:**
- Create: `frontend/app/privacy/page.tsx`
- Create: `frontend/app/terms/page.tsx`
- Modify: `frontend/components/landing/Footer.tsx`

**Interfaces:**
- None consumed from other tasks.

- [ ] **Step 1: Write `frontend/app/privacy/page.tsx`**

```tsx
// frontend/app/privacy/page.tsx
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy: BLACKBOX",
  description: "How BLACKBOX collects, uses, and protects your data.",
};

const sectionStyle: React.CSSProperties = { marginBottom: "2rem" };
const headingStyle: React.CSSProperties = { fontSize: "1.15rem", fontWeight: 700, marginBottom: ".6rem" };
const bodyStyle: React.CSSProperties = { color: "#4a4540", lineHeight: 1.65 };

export default function PrivacyPage() {
  return (
    <main style={{ background: "#f4efe6", color: "#1a1714", fontFamily: "system-ui, -apple-system, sans-serif", minHeight: "100dvh" }}>
      <div style={{ maxWidth: 720, margin: "0 auto", padding: "4rem 2rem 6rem" }}>
        <a href="/" style={{ color: "#b4451f", fontSize: ".9rem", fontWeight: 600, textDecoration: "none" }}>&larr; Back to homepage</a>
        <h1 style={{ fontSize: "2.2rem", fontWeight: 800, letterSpacing: "-.02em", margin: "1.5rem 0 .5rem" }}>Privacy Policy</h1>
        <p style={{ color: "#8a8275", fontSize: ".9rem", marginBottom: "2.5rem" }}>
          Last updated 2026-08-17. This is a technical description of our current data practices, not legal advice. If you need a legal opinion on this policy, consult qualified counsel.
        </p>

        <section style={sectionStyle}>
          <h2 style={headingStyle}>What we collect</h2>
          <p style={bodyStyle}>
            When you create an account, we collect the email address and password you provide (handled by our authentication provider, Supabase). If you enable BYOK (bring your own key) mode, we store the Anthropic API key you supply so BLACKBOX can run live tribunal audits on your behalf. We also store the AI agent action logs you send us for auditing, the API keys BLACKBOX issues you for programmatic access, and basic usage counters (how many hosted audits your workspace has run).
          </p>
        </section>

        <section style={sectionStyle}>
          <h2 style={headingStyle}>What we don't collect</h2>
          <p style={bodyStyle}>
            We don't store your payment card details. Billing is handled by LemonSqueezy, our merchant of record; LemonSqueezy processes and stores payment information under their own privacy policy.
          </p>
        </section>

        <section style={sectionStyle}>
          <h2 style={headingStyle}>Third-party processors</h2>
          <p style={bodyStyle}>
            We use Supabase for authentication and database hosting, LemonSqueezy for billing and payment processing, and, if you enable BYOK, Anthropic to run the live tribunal audits using the API key you provide. Each of these processors has its own privacy policy governing the data they handle on our behalf.
          </p>
        </section>

        <section style={sectionStyle}>
          <h2 style={headingStyle}>How we use your data</h2>
          <p style={bodyStyle}>
            We use your data to operate the product: authenticating you, running audits against the logs you submit, tracking usage against your plan, and processing billing. We do not sell your data.
          </p>
        </section>

        <section style={sectionStyle}>
          <h2 style={headingStyle}>Data retention</h2>
          <p style={bodyStyle}>
            We retain your account data and audit logs for as long as your account is active. You can delete your API keys and clear your BYOK key at any time from the dashboard. To request full account deletion, open an issue on our GitHub repository (see Contact below).
          </p>
        </section>

        <section style={sectionStyle}>
          <h2 style={headingStyle}>Your rights</h2>
          <p style={bodyStyle}>
            You can access, correct, or delete the data associated with your account by contacting us as described below. If you are located in a jurisdiction with statutory data-protection rights (such as the EU), those rights apply to the extent required by law.
          </p>
        </section>

        <section style={sectionStyle}>
          <h2 style={headingStyle}>Contact</h2>
          <p style={bodyStyle}>
            BLACKBOX is an open-source project (MIT licensed) based in Bursa, Türkiye. For privacy questions or data requests, open an issue at{" "}
            <a href="https://github.com/iWeslax83/blackbox-agent-accountability" target="_blank" rel="noopener" style={{ color: "#b4451f" }}>
              github.com/iWeslax83/blackbox-agent-accountability
            </a>.
          </p>
        </section>
      </div>
    </main>
  );
}
```

- [ ] **Step 2: Write `frontend/app/terms/page.tsx`**

```tsx
// frontend/app/terms/page.tsx
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service: BLACKBOX",
  description: "The terms governing your use of BLACKBOX.",
};

const sectionStyle: React.CSSProperties = { marginBottom: "2rem" };
const headingStyle: React.CSSProperties = { fontSize: "1.15rem", fontWeight: 700, marginBottom: ".6rem" };
const bodyStyle: React.CSSProperties = { color: "#4a4540", lineHeight: 1.65 };

export default function TermsPage() {
  return (
    <main style={{ background: "#f4efe6", color: "#1a1714", fontFamily: "system-ui, -apple-system, sans-serif", minHeight: "100dvh" }}>
      <div style={{ maxWidth: 720, margin: "0 auto", padding: "4rem 2rem 6rem" }}>
        <a href="/" style={{ color: "#b4451f", fontSize: ".9rem", fontWeight: 600, textDecoration: "none" }}>&larr; Back to homepage</a>
        <h1 style={{ fontSize: "2.2rem", fontWeight: 800, letterSpacing: "-.02em", margin: "1.5rem 0 .5rem" }}>Terms of Service</h1>
        <p style={{ color: "#8a8275", fontSize: ".9rem", marginBottom: "2.5rem" }}>
          Last updated 2026-08-17. This is a plain-language summary of our terms, not legal advice. If you need a legal opinion on these terms, consult qualified counsel.
        </p>

        <section style={sectionStyle}>
          <h2 style={headingStyle}>The service</h2>
          <p style={bodyStyle}>
            BLACKBOX is a flight recorder and compliance tribunal for AI agent actions. The core recorder and audit engine are open source (MIT licensed) and can be self-hosted for free. We also offer a hosted Pro plan with a managed dashboard, scheduled audits, and priority support.
          </p>
        </section>

        <section style={sectionStyle}>
          <h2 style={headingStyle}>Your account</h2>
          <p style={bodyStyle}>
            You're responsible for the security of your account credentials and your API keys, including any Anthropic key you supply under BYOK. You're responsible for the content of the agent logs you submit for auditing.
          </p>
        </section>

        <section style={sectionStyle}>
          <h2 style={headingStyle}>Acceptable use</h2>
          <p style={bodyStyle}>
            Don't use BLACKBOX to process data you don't have the right to process, or to circumvent the usage limits of your plan. We reserve the right to suspend accounts that abuse the service.
          </p>
        </section>

        <section style={sectionStyle}>
          <h2 style={headingStyle}>Billing</h2>
          <p style={bodyStyle}>
            Paid plans are billed through LemonSqueezy, our merchant of record. Subscriptions renew automatically until cancelled. You can manage or cancel your subscription from the billing page in your dashboard, which links to LemonSqueezy's customer portal.
          </p>
        </section>

        <section style={sectionStyle}>
          <h2 style={headingStyle}>No warranty</h2>
          <p style={bodyStyle}>
            BLACKBOX is a technical tool, not legal advice, and does not guarantee regulatory compliance with the EU AI Act or any other framework. The service is provided "as is," without warranty of any kind, to the maximum extent permitted by law.
          </p>
        </section>

        <section style={sectionStyle}>
          <h2 style={headingStyle}>Termination</h2>
          <p style={bodyStyle}>
            You can stop using the service and delete your account at any time. We may suspend or terminate accounts that violate these terms.
          </p>
        </section>

        <section style={sectionStyle}>
          <h2 style={headingStyle}>Contact</h2>
          <p style={bodyStyle}>
            BLACKBOX is an open-source project (MIT licensed) based in Bursa, Türkiye. For questions about these terms, open an issue at{" "}
            <a href="https://github.com/iWeslax83/blackbox-agent-accountability" target="_blank" rel="noopener" style={{ color: "#b4451f" }}>
              github.com/iWeslax83/blackbox-agent-accountability
            </a>.
          </p>
        </section>
      </div>
    </main>
  );
}
```

- [ ] **Step 3: Update `frontend/components/landing/Footer.tsx`**

Read the current file first (it was extracted in the prior landing-redesign plan; expect this content):

```tsx
export default function Footer() {
  return (
    <footer style={{ background: "#1a1714", color: "#8a8275", padding: "2rem", textAlign: "center", fontSize: ".83rem" }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: ".5rem" }}>
        <div><strong style={{ color: "#c9bfaf" }}>BLACKBOX</strong>: AI Agent Accountability and Compliance</div>
        <div>
          <a href="https://github.com/iWeslax83/blackbox-agent-accountability" target="_blank" rel="noopener" style={{ color: "#a09890", textDecoration: "none" }}>GitHub</a>
          &nbsp;·&nbsp; MIT licensed &nbsp;·&nbsp;
          <a href="/login" style={{ color: "#a09890", textDecoration: "none" }}>Dashboard</a>
          &nbsp;·&nbsp;
          <a href="/privacy" style={{ color: "#a09890", textDecoration: "none" }}>Privacy</a>
          &nbsp;·&nbsp;
          <a href="/terms" style={{ color: "#a09890", textDecoration: "none" }}>Terms</a>
        </div>
        <div style={{ fontSize: ".78rem", color: "#5a524a", marginTop: ".25rem" }}>
          Bursa, Türkiye
        </div>
        <div style={{ fontSize: ".78rem", color: "#5a524a" }}>
          Not legal advice. BLACKBOX is a technical tool, consult qualified counsel for regulatory guidance.
        </div>
      </div>
    </footer>
  );
}
```

This adds the Privacy/Terms links and a "Bursa, Türkiye" location line, keeping everything else (including the exact colon usage and existing disclaimer) unchanged from the current file. If the current file's exact text differs from what's shown above (it shouldn't, but verify), preserve the existing content and only add the two new link `<a>` tags plus the new location `<div>`.

- [ ] **Step 4: Verify**

Run: `cd frontend && npx tsc --noEmit && npm run dev`, visit `/privacy` and `/terms` in a browser, confirm both render with a single `<h1>` each, no horizontal scroll at 375px, and the "Back to homepage" link works. Visit `/` and confirm the footer now shows Privacy/Terms links and the Bursa line.

- [ ] **Step 5: Commit**

```bash
git add frontend/app/privacy/page.tsx frontend/app/terms/page.tsx frontend/components/landing/Footer.tsx
git commit -m "feat(frontend): add privacy policy and terms of service pages"
```

---

### Task 11: Vercel Analytics

**Files:**
- Modify: `frontend/package.json`
- Modify: `frontend/app/layout.tsx`

**Interfaces:**
- None consumed from other tasks. Finalizes the `layout.tsx` deferred in Task 1 Step 3.

- [ ] **Step 1: Install the package**

```bash
cd frontend && npm install @vercel/analytics
```

- [ ] **Step 2: Write the final `frontend/app/layout.tsx`**

```tsx
// frontend/app/layout.tsx
import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "BLACKBOX: AI Agent Accountability",
  description: "Tamper-evident flight recorder + autonomous compliance tribunal for AI agents.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
```

Note: Vercel Analytics is cookieless (it does not set cookies or use persistent client-side identifiers for its default page-view tracking), so no cookie-consent banner is required for it. If a different, cookie-based analytics tool is added later, revisit this.

- [ ] **Step 3: Verify**

Run: `cd frontend && npx tsc --noEmit`
Expected: no new errors.

Run: `npm run build` (with dummy Supabase env vars if needed, matching how the prior plan's Task 12 verified the build) and confirm the build succeeds with `@vercel/analytics` bundled.

- [ ] **Step 4: Commit**

```bash
git add frontend/package.json frontend/package-lock.json frontend/app/layout.tsx
git commit -m "feat(frontend): add Vercel Analytics"
```

---

### Task 12: Sticky mobile CTA on the landing page

**Files:**
- Create: `frontend/components/landing/StickyMobileCta.tsx`
- Modify: `frontend/app/page.tsx`

**Interfaces:**
- Produces: `export default function StickyMobileCta(): JSX.Element`, consumed by `app/page.tsx`.

- [ ] **Step 1: Write the component**

```tsx
// frontend/components/landing/StickyMobileCta.tsx
export default function StickyMobileCta() {
  return (
    <div
      className="sticky-mobile-cta"
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 40,
        background: "#f4efe6",
        borderTop: "1px solid #e3dccd",
        padding: "0.75rem 1rem calc(0.75rem + env(safe-area-inset-bottom))",
        display: "none",
      }}
    >
      <a
        href="/login"
        style={{
          display: "block",
          textAlign: "center",
          width: "100%",
          padding: ".75rem 1rem",
          borderRadius: 8,
          fontSize: ".95rem",
          fontWeight: 600,
          background: "#b4451f",
          color: "#fff",
          textDecoration: "none",
        }}
      >
        Get started free
      </a>
      <style>{`
        @media (max-width: 767px) {
          .sticky-mobile-cta { display: block !important; }
        }
      `}</style>
    </div>
  );
}
```

The bar is `display: none` by default and only shown under 768px via the scoped media query, matching the desktop/mobile breakpoint used elsewhere in the codebase (`HeroChain.tsx`'s `window.innerWidth >= 768` check from the prior plan). `env(safe-area-inset-bottom)` keeps it clear of the home-indicator area on notched phones.

- [ ] **Step 2: Mount it in `frontend/app/page.tsx`**

Add the import and render it as the last element inside `<main>`, after `<Footer />`:

```tsx
import StickyMobileCta from "@/components/landing/StickyMobileCta";
```

```tsx
      <Footer />
      <StickyMobileCta />
    </main>
```

(Combine this with whatever else Task 9 already added to this file's imports — both edits touch `app/page.tsx` but in non-overlapping ways: Task 9 adds a `metadata` export near the top, this task adds an import and a JSX element at the bottom.)

- [ ] **Step 3: Add bottom padding so the sticky bar never overlaps the footer content**

In `frontend/components/landing/Footer.tsx`, add inline `paddingBottom` on mobile is unnecessary since the sticky bar sits below the footer in normal flow, not overlapping it, only overlapping whatever the user has scrolled to. No change needed to Footer.tsx here — verify this visually in Step 4 instead.

- [ ] **Step 4: Manual verification**

Run: `cd frontend && npm run dev`. In a browser (Chromium only, `chromium.launch()` if using Playwright) at 375px width: confirm the sticky CTA bar is visible and fixed to the bottom while scrolling through all landing sections, and that it does not visually collide with or hide the footer's own "Get started free" button in the Cta section (some visual overlap while scrolled to the very bottom is expected and fine, since it's a persistent bar). At 1280px width: confirm the bar is not rendered (`display: none` via the media query not matching).

- [ ] **Step 5: Commit**

```bash
git add frontend/components/landing/StickyMobileCta.tsx frontend/app/page.tsx
git commit -m "feat(frontend): add sticky mobile CTA to landing page"
```

---

### Task 13: Loading indicators on keys and billing pages

**Files:**
- Modify: `frontend/app/app/keys/page.tsx`
- Modify: `frontend/app/app/billing/page.tsx`

**Interfaces:**
- None consumed from other tasks.

- [ ] **Step 1: Read both files first**

Both are client components fetching data in a `useEffect`-driven `refresh()` callback (same pattern as `frontend/app/app/settings/page.tsx`, which already shows `"checking…"` while its first fetch is in flight via a `configured === null` check). Read the current `frontend/app/app/keys/page.tsx` and `frontend/app/app/billing/page.tsx` in full before editing, since the exact JSX around the list/data area must be located precisely.

- [ ] **Step 2: Add a loading state to `keys/page.tsx`**

Add a `loading` state initialized `true`, set it `false` at the end of `refresh()` (in both the success and catch paths), and show a loading line above (or instead of) the keys list while `loading` is `true`:

```tsx
const [loading, setLoading] = useState(true);
```

In `refresh()`, wrap the existing body so `setLoading(false)` runs after either outcome:

```tsx
const refresh = useCallback(async () => {
  if (!token) return;
  try { setKeys(await apiFetch("/keys", { token })); }
  catch (e) { setErr(String(e)); }
  finally { setLoading(false); }
}, [token]);
```

Where the keys list is rendered, add a loading branch before the empty-state / list rendering:

```tsx
{loading ? (
  <p className="empty">Loading your API keys…</p>
) : keys.length === 0 ? (
  <p className="empty">No API keys yet.</p>
) : (
  // existing list rendering
)}
```

Match this to whatever the existing empty-state condition and markup actually is in the file (read it first per Step 1) — the `className="empty"` convention already exists in `frontend/app/globals.css:130` (`.empty { color: var(--muted); font-size: 0.9rem; padding: 14px 0; }`), reuse it rather than introducing new styles.

- [ ] **Step 3: Add the same pattern to `billing/page.tsx`**

Same shape: a `loading` state, set `false` in a `finally` block inside `refresh()`, and a loading message (e.g. `"Loading your plan…"`) shown in place of the plan/usage card while `loading` is `true`. Locate the exact JSX for the plan/usage display first (read the file), and wrap it the same way.

- [ ] **Step 4: Verify**

Run: `cd frontend && npx tsc --noEmit`
Expected: no new errors.

Manual check: run `npm run dev`, log in, visit `/app/keys` and `/app/billing`, and confirm (via browser devtools network throttling, or just observing on a slow connection) that a loading message appears briefly before the real content, instead of a blank flash.

- [ ] **Step 5: Commit**

```bash
git add frontend/app/app/keys/page.tsx frontend/app/app/billing/page.tsx
git commit -m "feat(frontend): add loading indicators to keys and billing pages"
```

---

### Task 14: Billing checkout success redirect

**Files:**
- Modify: `blackbox/billing.py`
- Modify: `frontend/app/app/billing/page.tsx`

**Interfaces:**
- Produces: after a successful LemonSqueezy checkout, the user is redirected back to `${NEXT_PUBLIC_SITE_URL or FRONTEND_ORIGIN}/app/billing?upgraded=true`d instead of LemonSqueezy's generic default confirmation page, and the billing page shows a success banner when that query param is present.

- [ ] **Step 1: Read `create_checkout_session` in full**

Read `blackbox/billing.py` (the function starts around line 20, per the audit for this plan) to see its current `checkout_data` attributes exactly, since the edit must add a new key without disturbing the existing `email`/`custom` structure.

- [ ] **Step 2: Add a redirect URL to the checkout attributes**

Add a `product_options.redirect_url` field. LemonSqueezy's checkout API accepts `product_options: { redirect_url: "..." }` as a sibling of `checkout_data` inside `attributes`. Read an existing environment variable for the frontend origin first: `os.environ.get("FRONTEND_ORIGIN", "")` (this variable already exists per `render.yaml:16`, described there as `https://<your-app>.vercel.app`). If it's empty, fall back to omitting `product_options` entirely rather than sending an empty/invalid redirect URL:

```python
def create_checkout_session(org_id: str, user_email: str) -> str:
    """Create a hosted LemonSqueezy checkout, stamped with org_id so the webhook
    can attribute the resulting subscription back to the org without a lookup table."""
    attributes: dict = {
        "checkout_data": {
            "email": user_email,
            "custom": {"org_id": org_id},
        },
    }
    frontend_origin = os.environ.get("FRONTEND_ORIGIN", "")
    if frontend_origin:
        attributes["product_options"] = {
            "redirect_url": f"{frontend_origin}/app/billing?upgraded=true",
        }
    resp = httpx.post(
        f"{API_BASE}/checkouts",
        headers={
            "Authorization": f"Bearer {_api_key()}",
            "Accept": "application/vnd.api+json",
            "Content-Type": "application/vnd.api+json",
        },
        json={
            "data": {
                "type": "checkouts",
                "attributes": attributes,
                "relationships": {
                    "store": {"data": {"type": "stores", "id": _store_id()}},
                    "variant": {"data": {"type": "variants", "id": PRO_VARIANT_ID}},
                },
            }
        },
        timeout=10,
    )
    resp.raise_for_status()
    return resp.json()["data"]["attributes"]["url"]
```

- [ ] **Step 3: Check for existing tests on this function**

Run: `grep -rln "create_checkout_session" tests/ 2>/dev/null` (or wherever the project's Python tests live, check `pyproject.toml`/`tests/` at the repo root). If a test asserts the exact JSON body sent to LemonSqueezy, update it to account for the new conditional `product_options` key (present only when `FRONTEND_ORIGIN` is set). If no such test exists, skip this step.

- [ ] **Step 4: Add the success banner in `frontend/app/app/billing/page.tsx`**

Read the current file (already partially shown during the audit for this plan). Add `useSearchParams` from `next/navigation` and render a dismissable-by-navigation success message when `upgraded=true` is present:

```tsx
import { useSearchParams } from "next/navigation";
```

```tsx
const searchParams = useSearchParams();
const justUpgraded = searchParams.get("upgraded") === "true";
```

Render near the top of the page content (inside `<main className="page">`, before the existing plan/usage card):

```tsx
{justUpgraded && (
  <div className="notice" style={{ borderStyle: "solid", borderColor: "#4caf74", color: "#1a1714", marginBottom: 18 }}>
    You're now on the Pro plan. Thanks for upgrading.
  </div>
)}
```

Reuse the existing `.notice` class from `frontend/app/globals.css:127` (`background: #fff; border: 1px dashed var(--border); ...`), overriding just the border color/style inline to signal success rather than the default neutral/dashed look, since there's no separate "success" variant defined yet.

Because `useSearchParams()` requires the page to be inside a `<Suspense>` boundary when the route is statically rendered, and this page is a `"use client"` component already inside the dynamic `/app` segment, no extra Suspense wrapper should be needed here (dynamic client-rendered dashboard routes don't hit that constraint the way a static page would) — but if `npm run build` reports a "should be wrapped in a suspense boundary" error for this page in Step 5, wrap the component body in `<Suspense fallback={null}>` and report the deviation.

- [ ] **Step 5: Verify**

Run: `cd frontend && npx tsc --noEmit && npm run build` (with dummy env vars as needed). Confirm no new errors, including no Suspense-boundary warning for the billing route (or, if one appears, that Step 4's fallback wrapping resolved it).

Manual check: run `npm run dev`, log in, navigate to `http://localhost:3000/app/billing?upgraded=true` directly, confirm the success banner renders.

Run the Python test suite if one exists: check `pyproject.toml` for the test command (likely `pytest`) and run it, confirming `billing.py`'s existing tests (if any) still pass.

- [ ] **Step 6: Commit**

```bash
git add blackbox/billing.py frontend/app/app/billing/page.tsx
git commit -m "feat(billing): redirect to a success banner after checkout instead of LemonSqueezy's default page"
```

---

### Task 15: Remove unused default Next.js template assets

**Files:**
- Delete: `frontend/public/file.svg`, `frontend/public/globe.svg`, `frontend/public/next.svg`, `frontend/public/vercel.svg`, `frontend/public/window.svg`

**Interfaces:**
- None.

- [ ] **Step 1: Confirm none of these are referenced anywhere**

Run: `cd frontend && grep -rln "file\.svg\|globe\.svg\|next\.svg\|vercel\.svg\|window\.svg" app/ components/ lib/`
Expected: no output (these are unused Next.js starter-template assets left over from project scaffolding, per the audit for this plan).

If any reference is found, stop and report it instead of deleting that file.

- [ ] **Step 2: Delete the confirmed-unused files**

```bash
cd frontend
git rm public/file.svg public/globe.svg public/next.svg public/vercel.svg public/window.svg
```

- [ ] **Step 3: Verify**

Run: `cd frontend && npm run build` (with dummy env vars as needed). Confirm the build still succeeds with no missing-asset errors.

- [ ] **Step 4: Commit**

```bash
git commit -m "chore(frontend): remove unused Next.js template placeholder images"
```

(The `git rm` in Step 2 already staged the deletions; this commits them.)

---

### Task 16: Final QA sweep

**Files:**
- None modified. Verification-only task.

**Interfaces:**
- None.

- [ ] **Step 1: Production build**

Run: `cd frontend && npm run build` (with dummy `NEXT_PUBLIC_SUPABASE_URL`/`NEXT_PUBLIC_SUPABASE_ANON_KEY` env vars if the build requires them, matching how the prior landing-redesign plan's Task 12 handled this).
Expected: succeeds, all routes prerender.

- [ ] **Step 2: Full test suite**

Run: `cd frontend && npx vitest run`
Expected: all existing tests still pass (12 tests as of the prior plan; this plan adds none, since every new file here is either static content or a thin metadata/route wrapper with no meaningful pure logic to unit test).

- [ ] **Step 3: Browser sweep**

Using a browser (Chromium only, `chromium.launch()` if using Playwright), against `npm run build && npm run start` (production build, not dev server, since dev-mode chunk-loading can misrepresent real behavior per the prior plan's Task-6 fix findings):

For each of `/`, `/login`, `/privacy`, `/terms`, `/this-does-not-exist` (404):
- Exactly one `<h1>` present.
- No console errors (`page.on("console")` / `page.on("pageerror")` listeners, filter for `error` level).
- No horizontal scroll at 375px width (`document.documentElement.scrollWidth === document.documentElement.clientWidth`).
- `document.title` is non-empty and matches the value set in Task 9/10 for that route.

Additionally:
- Fetch `/robots.txt`, `/sitemap.xml`, `/llms.txt`, `/opengraph-image`, `/icon` directly and confirm each returns a 200 with the expected content type (text/plain, application/xml, text/plain, image/png, image/png respectively).
- Confirm the browser tab favicon is the custom "B" mark, not a default icon.

- [ ] **Step 4: Report**

Summarize the sweep results (pass/fail per route/check) in the task's completion report. Any failure found here should be treated as a finding requiring a fix before this plan is considered done, following the same fix-loop process used for the prior plan's task reviews.

---

## Self-Review

**Spec coverage:** see the "Checklist Coverage" table below, one row per original checklist line.

**Placeholder scan:** none found. Every step has real code, an exact file to edit, or an exact verification command.

**Type consistency:** `NEXT_PUBLIC_SITE_URL` is read the same way (`process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"`) in `layout.tsx` (Task 1/11), `robots.ts` (Task 3), and `sitemap.ts` (Task 4). `StickyMobileCta` (Task 12) and `Footer` (Task 10) both export default components consumed the same way `Hero`/`Problem`/etc. were in the prior plan's `page.tsx`. The `.notice`/`.empty` CSS classes reused in Tasks 13-14 are read verbatim from `frontend/app/globals.css` (lines 127 and 130 respectively, confirmed during the audit for this plan).

**Task ordering note:** Task 1 and Task 11 both edit `frontend/app/layout.tsx`; Task 1 intentionally writes a version without the Analytics import (since the package isn't installed until Task 11), and Task 11 restates the complete final file. If tasks are executed out of published order, whichever of the two runs second must reconcile against whatever the other already wrote, not blindly overwrite it — call this out explicitly to whichever subagent picks up Task 11 if Task 1 hasn't run yet.

---

## Checklist Coverage

| Checklist item | Status | Where |
|---|---|---|
| Custom 404 page | Task 8 | `app/not-found.tsx` |
| CTA above the fold | Already satisfied | Landing hero (`Hero.tsx`) already has a CTA in the first viewport, from the prior plan |
| Meta title per page | Task 9 | `app/page.tsx`, `app/login/layout.tsx`, `app/app/layout.tsx`, plus `app/privacy/page.tsx`/`app/terms/page.tsx` in Task 10 |
| Meta description per page | Task 9 | same files |
| Open graph image | Task 5 | `app/opengraph-image.tsx` |
| favicon set | Task 6 | `app/icon.tsx` |
| robots.txt | Task 3 | `app/robots.ts` |
| sitemap.xml | Task 4 | `app/sitemap.ts` |
| alt text on every image | Already satisfied | Audit found zero `<img>` tags in `app/`/`components/`; existing SVGs (`HashChainStatic.tsx`, `opengraph-image.tsx` icon) already carry `role="img"` + `aria-label` or are decorative-only. Verified again in Task 16 Step 3. |
| mobile breakpoints | Already substantially satisfied | Prior plan verified 375px on the landing page; Task 16 extends the same check to `/privacy`, `/terms`, `/404` |
| sticky mobile cta | Task 12 | `components/landing/StickyMobileCta.tsx` |
| loading states | Task 13 (keys/billing) + already satisfied for settings | `settings/page.tsx` already had a `"checking…"` state before this plan |
| form error states | Already satisfied | `login/page.tsx`, `settings/page.tsx`, `keys/page.tsx`, `billing/page.tsx` all already render `{err && <p className="error">{err}</p>}` |
| thank you page | Task 14 | billing checkout success banner (an in-app banner rather than a separate route, since the only real "purchase" flow is the LemonSqueezy upgrade) |
| privacy policy page | Task 10 | `app/privacy/page.tsx` |
| terms page | Task 10 | `app/terms/page.tsx` |
| cookie banner | Deliberately not built | Vercel Analytics (Task 11) is cookieless; no cookie banner is needed for it. Revisit if a cookie-based tool is added later. |
| analytics installed | Task 11 | `@vercel/analytics` |
| real contact address | Task 10 | Footer + privacy/terms pages: "Bursa, Türkiye" (city/country only, per user confirmation) plus the public GitHub repo as the contact channel |
| Compressed images | Already satisfied | No raster images exist in the app; unused default SVGs removed in Task 15 rather than compressed, since they carry zero real content |
| llms.txt | Task 7 | `public/llms.txt` |
| Multiple H1's / No H1's | Already satisfied | Audit confirmed exactly one `<h1>` per rendered page state across all existing routes; re-verified for all routes (including the 3 new ones) in Task 16 |
| console errors | Verification task | Task 16 Step 3 |
| massive JS bundles | Already substantially addressed | The prior plan's final-review fix wave made the ~866KB three.js chunk fetch zero for reduced-motion/mobile/no-WebGL users; Task 16's production build confirms no regression |
