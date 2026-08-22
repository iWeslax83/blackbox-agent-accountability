# Landing Page 3D Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild `frontend/app/page.tsx` (BLACKBOX landing page) into a component-based, higher-trust design that keeps the existing warm-paper/rust design system, adds a real 3D hash-chain visualization in the hero (not decorative — it visualizes the product's actual tamper-evident hash-chain mechanism), and passes the project's own design rules (no gradients/glassmorphism/purple, no pill badges, no generic three-card rows, plain copy).

**Architecture:** Extract the current monolithic `page.tsx` into `components/landing/*.tsx` section components (Hero, Problem, HowItWorks, Pricing, Cta, Footer already exist as inline JSX — split by responsibility). Add an isolated client-only 3D leaf component (`HashChainScene`) built with React Three Fiber, gated behind a static SVG fallback for reduced-motion, small viewports, and WebGL-unsupported browsers. Server components render everything except the 3D leaf and its viewport/motion-detection wrapper.

**Tech Stack:** Next.js 16 (App Router, **non-standard version** — read `frontend/node_modules/next/dist/docs/01-app` before writing any Next-specific code, per `frontend/AGENTS.md`), React 19, TypeScript, Vitest + jsdom (existing), `three` + `@react-three/fiber` + `@react-three/drei` (new).

**Spec:** This plan's spec is the design synthesis agreed in-conversation: keep the existing warm-paper (`#f4efe6`) / rust (`#b4451f`) flat design system; corporate-trust tone as the dominant register, developer-first texture (monospace, terminal, hash/log visuals) as secondary, one real 3D element tied to actual product mechanics (hash-chain), no generic bento/blob/dashboard-mockup filler. No separate spec doc exists outside this plan — the plan is self-contained.

## Global Constraints

- No gradients, no glassmorphism, no purple/violet. Flat background + exactly one accent color (`--rust: #b4451f`), per `~/.claude/CLAUDE.md`.
- No pill badges (`rounded-full` + tint) for status/labels — use plain text + dot, underline, or bordered rectangle. The existing `EU AI Act · Art. 10/12/14/15` hero badge (`page.tsx:33-41`) is a rounded pill — must be converted to a bordered rectangle in this plan.
- No "three icon feature cards in a row" pattern. The existing "How it works" 4-card grid (`page.tsx:140-153`) is a 4-card grid, not 3 — acceptable, but must not read as generic filler; keep the numbered (01-04) treatment already present.
- No emoji as decoration anywhere.
- No em dashes (—) in any copy, code, or commit message. Use comma/period/colon/parentheses.
- Never use `h-screen` / `100vh` for full-height sections — use `min-h-[100dvh]` equivalent if any section needs full viewport height (this plan's hero does not need full-height, keep it content-sized as it is today).
- Animate only `transform` and `opacity` for CSS-driven motion. The R3F scene may animate mesh `rotation`/`position` inside its own render loop (WebGL, not CSS, so this constraint doesn't restrict it) but must respect `prefers-reduced-motion` by freezing rotation.
- All new interactive/animated code must live in a `"use client"` leaf component; the pages themselves (`page.tsx`, `components/landing/*.tsx` except the 3D leaf and its wrapper) stay server components.
- No new Unsplash/external image dependencies. The 3D scene is procedurally generated (no downloaded assets), and the static fallback is inline SVG.
- Match the project's commit style: no session links, conventional-ish short messages (see `git log`, e.g. `feat(billing): ...`, `style(flat): ...`).

---

## File Structure

- `frontend/components/landing/Hero.tsx` — new. Server component. Renders headline, subhead, CTAs, "built with" line, and the `<HeroChain />` client leaf. Replaces `page.tsx:31-102`.
- `frontend/components/landing/HeroChain.tsx` — new. `"use client"`. Detects `prefers-reduced-motion`, viewport width, and WebGL support; renders `<HashChainScene />` or `<HashChainStatic />` accordingly, wrapped in `Suspense` with a skeleton fallback.
- `frontend/components/landing/HashChainScene.tsx` — new. `"use client"`. React Three Fiber canvas: N linked box meshes representing hash-chain blocks, gentle auto-rotation via `useFrame`, frozen when reduced motion.
- `frontend/components/landing/HashChainStatic.tsx` — new. Server-renderable (no client hooks needed) inline SVG version of the same chain-of-blocks visual, used as fallback and as the reduced-motion/no-WebGL/mobile-narrow render path.
- `frontend/lib/chainData.ts` — new. Pure function `buildChainBlocks(count: number): ChainBlock[]` generating deterministic block data (id, short hash, x/y/z offset) shared by both the 3D and static renderers. Pure logic, fully unit-testable.
- `frontend/lib/chainData.test.ts` — new. Vitest tests for `buildChainBlocks`.
- `frontend/lib/useReducedMotion.ts` — new. `"use client"` hook wrapping `matchMedia("(prefers-reduced-motion: reduce)")`.
- `frontend/lib/useReducedMotion.test.ts` — new. Vitest test with a mocked `matchMedia`.
- `frontend/components/landing/Problem.tsx` — new. Server component, extracted from `page.tsx:104-132`, hero pill badge pattern not present here (untouched otherwise, tokens only).
- `frontend/components/landing/HowItWorks.tsx` — new. Server component, extracted from `page.tsx:134-155`.
- `frontend/components/landing/Pricing.tsx` — new. Server component, extracted from `page.tsx:157-213`.
- `frontend/components/landing/Cta.tsx` — new. Server component, extracted from `page.tsx:215-238`.
- `frontend/components/landing/Footer.tsx` — new. Server component, extracted from `page.tsx:240-253`.
- `frontend/app/page.tsx` — modify. Reduced to composing the six section components plus the existing `<nav>` (nav stays inline, it's small).
- `frontend/package.json` — modify. Add `three`, `@react-three/fiber`, `@react-three/drei`.

---

### Task 1: Install 3D dependencies

**Files:**
- Modify: `frontend/package.json`

**Interfaces:**
- Produces: `three`, `@react-three/fiber`, `@react-three/drei` importable from any client component in later tasks.

- [ ] **Step 1: Install packages**

Run:
```bash
cd frontend && npm install three @react-three/fiber @react-three/drei
npm install -D @types/three
```

- [ ] **Step 2: Verify React 19 peer compatibility**

Run: `npm ls @react-three/fiber three react`
Expected: no `ERESOLVE` / peer-dependency warnings printed (if warnings appear, note the exact resolved versions in the commit message body).

- [ ] **Step 3: Commit**

```bash
git add frontend/package.json frontend/package-lock.json
git commit -m "feat(frontend): add three.js and react-three-fiber for landing hero"
```

---

### Task 2: Chain block data module (pure logic, TDD)

**Files:**
- Create: `frontend/lib/chainData.ts`
- Test: `frontend/lib/chainData.test.ts`

**Interfaces:**
- Produces:
  ```ts
  export interface ChainBlock {
    id: number;
    shortHash: string;
    x: number; // 3D position, arbitrary units
    y: number;
    z: number;
  }
  export function buildChainBlocks(count: number): ChainBlock[];
  ```
- Consumed by: `HashChainScene.tsx` (Task 4) and `HashChainStatic.tsx` (Task 5).

- [ ] **Step 1: Write the failing test**

```ts
// frontend/lib/chainData.test.ts
import { describe, it, expect } from "vitest";
import { buildChainBlocks } from "./chainData";

describe("buildChainBlocks", () => {
  it("returns the requested number of blocks", () => {
    expect(buildChainBlocks(6)).toHaveLength(6);
  });

  it("gives each block a unique sequential id starting at 0", () => {
    const blocks = buildChainBlocks(4);
    expect(blocks.map((b) => b.id)).toEqual([0, 1, 2, 3]);
  });

  it("produces deterministic output for the same count", () => {
    expect(buildChainBlocks(5)).toEqual(buildChainBlocks(5));
  });

  it("gives each block an 8-character hex shortHash", () => {
    const blocks = buildChainBlocks(3);
    for (const block of blocks) {
      expect(block.shortHash).toMatch(/^[0-9a-f]{8}$/);
    }
  });

  it("spaces blocks apart along x so the chain reads left to right", () => {
    const blocks = buildChainBlocks(4);
    for (let i = 1; i < blocks.length; i++) {
      expect(blocks[i].x).toBeGreaterThan(blocks[i - 1].x);
    }
  });

  it("returns an empty array for count 0", () => {
    expect(buildChainBlocks(0)).toEqual([]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd frontend && npx vitest run lib/chainData.test.ts`
Expected: FAIL, `Cannot find module './chainData'` or similar.

- [ ] **Step 3: Write minimal implementation**

```ts
// frontend/lib/chainData.ts
export interface ChainBlock {
  id: number;
  shortHash: string;
  x: number;
  y: number;
  z: number;
}

// Deterministic pseudo-hash: not cryptographic, purely visual filler
// text for the 3D/SVG chain blocks (mirrors the product's real
// SHA-256 hash-chain concept without pretending to compute one).
function pseudoHash(seed: number): string {
  const hex = Math.abs(Math.sin(seed * 999.77) * 0xffffffff)
    .toString(16)
    .padEnd(8, "0");
  return hex.slice(0, 8);
}

export function buildChainBlocks(count: number): ChainBlock[] {
  const blocks: ChainBlock[] = [];
  const spacing = 1.6;
  for (let i = 0; i < count; i++) {
    blocks.push({
      id: i,
      shortHash: pseudoHash(i + 1),
      x: i * spacing,
      y: i % 2 === 0 ? 0 : 0.35,
      z: 0,
    });
  }
  return blocks;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd frontend && npx vitest run lib/chainData.test.ts`
Expected: PASS, 6 tests.

- [ ] **Step 5: Commit**

```bash
git add frontend/lib/chainData.ts frontend/lib/chainData.test.ts
git commit -m "feat(frontend): add deterministic hash-chain block data generator"
```

---

### Task 3: Reduced-motion hook (TDD)

**Files:**
- Create: `frontend/lib/useReducedMotion.ts`
- Test: `frontend/lib/useReducedMotion.test.ts`

**Interfaces:**
- Produces: `export function useReducedMotion(): boolean;`
- Consumed by: `HeroChain.tsx` (Task 6) and `HashChainScene.tsx` (Task 4).

- [ ] **Step 1: Write the failing test**

```ts
// frontend/lib/useReducedMotion.test.ts
import { describe, it, expect, vi, afterEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useReducedMotion } from "./useReducedMotion";

function mockMatchMedia(matches: boolean) {
  vi.stubGlobal("matchMedia", vi.fn().mockImplementation((query: string) => ({
    matches,
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  })));
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("useReducedMotion", () => {
  it("returns false when the user has no motion preference", () => {
    mockMatchMedia(false);
    const { result } = renderHook(() => useReducedMotion());
    expect(result.current).toBe(false);
  });

  it("returns true when prefers-reduced-motion: reduce matches", () => {
    mockMatchMedia(true);
    const { result } = renderHook(() => useReducedMotion());
    expect(result.current).toBe(true);
  });
});
```

- [ ] **Step 2: Install the missing test dependency and verify the test fails**

Run:
```bash
cd frontend && npm install -D @testing-library/react
npx vitest run lib/useReducedMotion.test.ts
```
Expected: FAIL, `Cannot find module './useReducedMotion'`.

- [ ] **Step 3: Write minimal implementation**

```ts
// frontend/lib/useReducedMotion.ts
"use client";
import { useEffect, useState } from "react";

export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(query.matches);
    const handler = (e: MediaQueryListEvent) => setReduced(e.matches);
    query.addEventListener("change", handler);
    return () => query.removeEventListener("change", handler);
  }, []);

  return reduced;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd frontend && npx vitest run lib/useReducedMotion.test.ts`
Expected: PASS, 2 tests.

- [ ] **Step 5: Commit**

```bash
git add frontend/lib/useReducedMotion.ts frontend/lib/useReducedMotion.test.ts frontend/package.json frontend/package-lock.json
git commit -m "feat(frontend): add prefers-reduced-motion hook"
```

---

### Task 4: 3D hash-chain scene (client leaf)

**Files:**
- Create: `frontend/components/landing/HashChainScene.tsx`

**Interfaces:**
- Consumes: `buildChainBlocks` from `frontend/lib/chainData.ts` (Task 2), `useReducedMotion` from `frontend/lib/useReducedMotion.ts` (Task 3).
- Produces: `export default function HashChainScene(): JSX.Element` — a full `<Canvas>` R3F scene, meant to fill its parent container (parent controls width/height via CSS).

- [ ] **Step 1: Write the component**

```tsx
// frontend/components/landing/HashChainScene.tsx
"use client";

import { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import type { Group } from "three";
import { buildChainBlocks } from "@/lib/chainData";
import { useReducedMotion } from "@/lib/useReducedMotion";

const RUST = "#b4451f";
const INK = "#1a1714";

function ChainGroup() {
  const groupRef = useRef<Group>(null);
  const reducedMotion = useReducedMotion();
  const blocks = buildChainBlocks(6);
  const centerX = ((blocks.length - 1) * 1.6) / 2;

  useFrame((_, delta) => {
    if (reducedMotion || !groupRef.current) return;
    groupRef.current.rotation.y += delta * 0.12;
  });

  return (
    <group ref={groupRef}>
      {blocks.map((block, i) => (
        <group key={block.id} position={[block.x - centerX, block.y, block.z]}>
          <mesh>
            <boxGeometry args={[0.9, 0.9, 0.9]} />
            <meshStandardMaterial
              color={i === blocks.length - 1 ? RUST : INK}
              roughness={0.45}
              metalness={0.1}
            />
          </mesh>
          {i < blocks.length - 1 && (
            <mesh position={[0.8, 0, 0]}>
              <cylinderGeometry args={[0.04, 0.04, 0.7, 8]} />
              <meshStandardMaterial color="#8a8275" />
              <group rotation={[0, 0, Math.PI / 2]} />
            </mesh>
          )}
        </group>
      ))}
    </group>
  );
}

export default function HashChainScene() {
  return (
    <Canvas
      camera={{ position: [0, 1.4, 6], fov: 42 }}
      dpr={[1, 1.5]}
      gl={{ antialias: true, alpha: true }}
    >
      <ambientLight intensity={0.7} />
      <directionalLight position={[3, 4, 5]} intensity={0.9} />
      <ChainGroup />
    </Canvas>
  );
}
```

Note on the connector cylinder: `cylinderGeometry` defaults to a vertical (Y-axis) cylinder, so the nested `rotation` group as written does not actually reorient the mesh (a group's rotation prop set after its own `<mesh>` child in JSX has no effect on that already-declared mesh). Fix before Step 2 by rotating the `<mesh>` itself, not an inert sibling group:

```tsx
{i < blocks.length - 1 && (
  <mesh position={[0.8, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
    <cylinderGeometry args={[0.04, 0.04, 0.7, 8]} />
    <meshStandardMaterial color="#8a8275" />
  </mesh>
)}
```

Apply that corrected version in the actual file (remove the dead nested `<group rotation=.../>` line).

- [ ] **Step 2: Manual verification (no automated test — WebGL rendering, not unit-testable in jsdom)**

Run: `cd frontend && npm run dev`, then in a browser (or via `mcp__claude-in-chrome` / Playwright) navigate to a throwaway test route or temporarily mount `<HashChainScene />` in `app/page.tsx` to confirm: six connected boxes render, last box is rust-colored, slow rotation plays, no console errors.

- [ ] **Step 3: Commit**

```bash
git add frontend/components/landing/HashChainScene.tsx
git commit -m "feat(frontend): add 3D hash-chain hero scene with react-three-fiber"
```

---

### Task 5: Static SVG fallback

**Files:**
- Create: `frontend/components/landing/HashChainStatic.tsx`

**Interfaces:**
- Consumes: `buildChainBlocks` from `frontend/lib/chainData.ts` (Task 2).
- Produces: `export default function HashChainStatic(): JSX.Element` — inline SVG, same visual language (rust final block, ink blocks, connector lines) as the 3D version, server-renderable.

- [ ] **Step 1: Write the component**

```tsx
// frontend/components/landing/HashChainStatic.tsx
import { buildChainBlocks } from "@/lib/chainData";

const RUST = "#b4451f";
const INK = "#1a1714";
const LINE = "#c9bfaf";

export default function HashChainStatic() {
  const blocks = buildChainBlocks(6);
  const blockSize = 64;
  const gapX = 96;
  const width = blocks.length * gapX + blockSize;
  const height = 160;
  const centerY = height / 2;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width="100%"
      role="img"
      aria-label="Six linked hash-chain blocks, the last one highlighted, representing BLACKBOX's tamper-evident log chain"
    >
      {blocks.slice(0, -1).map((block, i) => (
        <line
          key={`line-${block.id}`}
          x1={i * gapX + blockSize}
          y1={centerY + (block.y === 0 ? 0 : -16)}
          x2={(i + 1) * gapX}
          y2={centerY + (blocks[i + 1].y === 0 ? 0 : -16)}
          stroke={LINE}
          strokeWidth={3}
        />
      ))}
      {blocks.map((block, i) => (
        <g key={block.id} transform={`translate(${block.x === 0 ? 0 : i * gapX}, ${centerY - blockSize / 2 + (block.y === 0 ? 0 : -16)})`}>
          <rect
            width={blockSize}
            height={blockSize}
            rx={6}
            fill={i === blocks.length - 1 ? RUST : INK}
          />
          <text
            x={blockSize / 2}
            y={blockSize / 2 + 4}
            textAnchor="middle"
            fontFamily="ui-monospace, monospace"
            fontSize={10}
            fill="#f4efe6"
          >
            {block.shortHash.slice(0, 6)}
          </text>
        </g>
      ))}
    </svg>
  );
}
```

- [ ] **Step 2: Manual verification**

Run: `cd frontend && npm run dev`, temporarily mount `<HashChainStatic />` in a page, confirm six blocks render left-to-right with alternating vertical offset, last block rust-colored, monospace short hash visible on each block, no horizontal overflow at 375px viewport width.

- [ ] **Step 3: Commit**

```bash
git add frontend/components/landing/HashChainStatic.tsx
git commit -m "feat(frontend): add static SVG fallback for hash-chain hero visual"
```

---

### Task 6: HeroChain wrapper (motion/viewport/WebGL gating)

**Files:**
- Create: `frontend/components/landing/HeroChain.tsx`

**Interfaces:**
- Consumes: `useReducedMotion` (Task 3), `HashChainStatic` (Task 5, default export), dynamic import of `HashChainScene` (Task 4).
- Produces: `export default function HeroChain(): JSX.Element`, mounted by `Hero.tsx` (Task 7).

- [ ] **Step 1: Write the component**

```tsx
// frontend/components/landing/HeroChain.tsx
"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { useReducedMotion } from "@/lib/useReducedMotion";
import HashChainStatic from "./HashChainStatic";

const HashChainScene = dynamic(() => import("./HashChainScene"), {
  ssr: false,
  loading: () => <ChainSkeleton />,
});

function ChainSkeleton() {
  return (
    <div
      style={{
        height: 220,
        borderRadius: 12,
        background: "#efe9dd",
        border: "1px solid #e3dccd",
      }}
    />
  );
}

function supportsWebGL(): boolean {
  try {
    const canvas = document.createElement("canvas");
    return !!(
      canvas.getContext("webgl") || canvas.getContext("experimental-webgl")
    );
  } catch {
    return false;
  }
}

export default function HeroChain() {
  const reducedMotion = useReducedMotion();
  const [use3D, setUse3D] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setUse3D(!reducedMotion && window.innerWidth >= 768 && supportsWebGL());
  }, [reducedMotion]);

  if (!mounted) return <ChainSkeleton />;

  return (
    <div style={{ maxWidth: 640, margin: "0 auto", height: 220 }}>
      {use3D ? <HashChainScene /> : <HashChainStatic />}
    </div>
  );
}
```

- [ ] **Step 2: Manual verification**

Run: `cd frontend && npm run dev`. In browser devtools: (a) at default settings on desktop width, confirm 3D canvas renders; (b) toggle "Emulate CSS prefers-reduced-motion: reduce" in devtools, reload, confirm static SVG renders instead; (c) resize to 375px width, reload, confirm static SVG renders (mobile path); (d) confirm no layout shift once the real content replaces the skeleton (skeleton and both real variants use the same `height: 220`).

- [ ] **Step 3: Commit**

```bash
git add frontend/components/landing/HeroChain.tsx
git commit -m "feat(frontend): gate hero 3D scene behind motion/viewport/WebGL checks"
```

---

### Task 7: Extract Hero section, replace pill badge, mount HeroChain

**Files:**
- Create: `frontend/components/landing/Hero.tsx`
- Modify: `frontend/app/page.tsx:1-102` (remove, will be replaced wholesale in Task 12)

**Interfaces:**
- Consumes: `HeroChain` (Task 6, default export).
- Produces: `export default function Hero(): JSX.Element`, consumed by `app/page.tsx` in Task 12.

- [ ] **Step 1: Write the component**

Port `page.tsx:31-102` into `Hero.tsx`, with two changes: (1) replace the rounded-pill regulatory badge with a bordered rectangle (project rule: no pill badges for status/labels), (2) replace the terminal-preview block's sibling spot by placing `<HeroChain />` above the existing terminal preview, so the section reads: headline/subhead/CTAs, then the 3D chain visual, then the terminal demo underneath as corroborating detail.

```tsx
// frontend/components/landing/Hero.tsx
import HeroChain from "./HeroChain";

export default function Hero() {
  return (
    <section id="hero" style={{ padding: "6.5rem 2rem 5rem", background: "#f9f6f1" }}>
      <div style={{ maxWidth: 780, margin: "0 auto", textAlign: "center" }}>
        <div style={{
          display: "inline-flex", alignItems: "center", gap: ".4rem",
          background: "transparent", color: "#b4451f",
          fontSize: ".78rem", fontWeight: 700, letterSpacing: ".07em", textTransform: "uppercase",
          padding: ".3rem .75rem", borderRadius: 4, marginBottom: "1.6rem",
          border: "1px solid #e3dccd",
        }}>
          EU AI Act · Art. 10 / 12 / 14 / 15
        </div>
        <h1 style={{ fontSize: "clamp(2.4rem, 6vw, 3.6rem)", fontWeight: 900, letterSpacing: "-.03em", lineHeight: 1.1, marginBottom: "1.2rem" }}>
          Prove what your <span style={{ color: "#b4451f" }}>AI agents</span> did.
        </h1>
        <p style={{ fontSize: "1.15rem", color: "#8a8275", maxWidth: 600, margin: "0 auto 2.4rem" }}>
          BLACKBOX is a flight recorder and autonomous compliance tribunal for AI agents,
          tamper-evident logs, regulator-ready evidence packs, and a multi-agent audit panel
          that flags violations before an inspector does.
        </p>
        <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
          <a href="/login" style={{
            display: "inline-flex", alignItems: "center", gap: ".4rem",
            padding: ".75rem 1.6rem", borderRadius: 8,
            fontSize: ".95rem", fontWeight: 600,
            background: "#b4451f", color: "#fff", textDecoration: "none",
          }}>
            Get started free
          </a>
          <a href="https://github.com/iWeslax83/blackbox-agent-accountability" target="_blank" rel="noopener" style={{
            display: "inline-flex", alignItems: "center", gap: ".4rem",
            padding: ".75rem 1.6rem", borderRadius: 8,
            fontSize: ".95rem", fontWeight: 600,
            background: "transparent", color: "#1a1714",
            border: "1.5px solid #e3dccd", textDecoration: "none",
          }}>
            View on GitHub
          </a>
        </div>
        <div style={{ marginTop: "2.2rem", fontSize: ".82rem", color: "#8a8275", display: "flex", alignItems: "center", justifyContent: "center", gap: ".5rem" }}>
          <span>Built with</span>
          <span>LangGraph</span>
          <span style={{ width: 3, height: 3, borderRadius: "50%", background: "#e3dccd", display: "inline-block" }}></span>
          <span>Claude</span>
          <span style={{ width: 3, height: 3, borderRadius: "50%", background: "#e3dccd", display: "inline-block" }}></span>
          <span>FastAPI</span>
        </div>

        <div style={{ marginTop: "3.5rem" }}>
          <HeroChain />
        </div>

        <div style={{
          marginTop: "2rem",
          background: "#1a1714", borderRadius: 12, padding: "1.2rem 1.5rem",
          textAlign: "left", fontSize: ".8rem", fontFamily: "ui-monospace, monospace",
          color: "#c9bfaf", border: "1px solid #2e2a26",
          boxShadow: "0 16px 48px rgba(0,0,0,.22)",
          maxWidth: 640, marginLeft: "auto", marginRight: "auto",
        }}>
          <div style={{ display: "flex", gap: ".45rem", marginBottom: "1rem" }}>
            <div style={{ width: 11, height: 11, borderRadius: "50%", background: "#ff5f57" }}></div>
            <div style={{ width: 11, height: 11, borderRadius: "50%", background: "#febc2e" }}></div>
            <div style={{ width: 11, height: 11, borderRadius: "50%", background: "#28c840" }}></div>
          </div>
          <div style={{ lineHeight: 1.7 }}><span style={{ color: "#6b6258" }}>$ </span><span style={{ color: "#8abfff" }}>blackbox tribunal</span> <span style={{ color: "#6b6258" }}>--session demo-001</span></div>
          <div style={{ lineHeight: 1.7, color: "#6b6258" }}>  auditing 6 events against eu_ai_act policy pack…</div>
          <div style={{ lineHeight: 1.7 }}><span style={{ color: "#febc2e" }}>■</span> <span style={{ color: "#4caf74" }}>[PASS]</span>  seq #1  llm_call   process request: Email ops@acme.com…</div>
          <div style={{ lineHeight: 1.7 }}><span style={{ color: "#febc2e" }}>■</span> <span style={{ color: "#4caf74" }}>[PASS]</span>  seq #2  send_email → ops@acme.com   approved_by=auto</div>
          <div style={{ lineHeight: 1.7 }}><span style={{ color: "#febc2e" }}>■</span> <span style={{ color: "#e06c50" }}>[CRIT]</span> seq #5  send_email → attacker@evil.com   <span style={{ color: "#6b6258" }}>approved_by=null</span></div>
          <div style={{ lineHeight: 1.7, color: "#6b6258" }}>         ↳ data_exfiltration · EU AI Act Art.12/15 · conf 0.96</div>
          <div style={{ lineHeight: 1.7, color: "#6b6258" }}>         ↳ pii_mishandling  · EU AI Act Art.10    · conf 0.88</div>
          <div style={{ lineHeight: 1.7, marginTop: ".5rem" }}><span style={{ color: "#febc2e" }}>▶</span> <span style={{ color: "#e06c50", fontWeight: 700 }}>4 violations</span> · <span style={{ color: "#4caf74" }}>chain intact</span> · evidence pack ready</div>
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Manual verification**

Not yet wired into `page.tsx` (Task 12 does that). Skip render check until Task 12; just confirm the file has no TypeScript errors: `cd frontend && npx tsc --noEmit` (expected: no new errors attributable to `Hero.tsx`; pre-existing unrelated errors, if any, are out of scope).

- [ ] **Step 3: Commit**

```bash
git add frontend/components/landing/Hero.tsx
git commit -m "feat(frontend): extract landing Hero component with 3D chain and bordered badge"
```

---

### Task 8: Extract Problem section

**Files:**
- Create: `frontend/components/landing/Problem.tsx`

**Interfaces:**
- Produces: `export default function Problem(): JSX.Element`, consumed by `app/page.tsx` in Task 12.

- [ ] **Step 1: Write the component**

Port `page.tsx:104-132` verbatim into `Problem.tsx` (dark section, four stat cards with real, specific numbers already, no changes needed to content, this section already passes the project's "prove it's real" and "no vague filler" rules):

```tsx
// frontend/components/landing/Problem.tsx
export default function Problem() {
  return (
    <section id="problem" style={{ padding: "5rem 2rem", background: "#1a1714", color: "#f4efe6" }}>
      <div style={{ maxWidth: 960, margin: "0 auto" }}>
        <div style={{ fontSize: ".75rem", fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", color: "#b4451f", marginBottom: ".6rem" }}>The problem</div>
        <h2 style={{ fontSize: "2rem", fontWeight: 800, letterSpacing: "-.02em", marginBottom: "1rem", color: "#fff" }}>
          The EU AI Act is already in force.<br />Your logs are not evidence.
        </h2>
        <p style={{ fontSize: "1.05rem", color: "#a09890", maxWidth: 640 }}>
          High-risk AI systems face mandatory logging, traceability, and human-oversight
          requirements, enforceable now, with heavy penalties by 2026. Generic observability
          tools like LangSmith or Langfuse show traces for debugging, not adjudication.
          When a regulator asks &quot;what did your agent do and why?&quot; most teams have nothing
          auditor-ready to show.
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1.2rem", marginTop: "2.5rem" }}>
          {[
            { num: "€35M", text: "Maximum fine for non-compliance with EU AI Act obligations (or 7% of global revenue)" },
            { num: "2026", text: "Full obligations in force for high-risk AI systems across all EU member states" },
            { num: "0", text: "Purpose-built tools for AI agent compliance adjudication before BLACKBOX" },
            { num: "Art.15", text: "Robustness and cybersecurity requirements your agent logs must now demonstrate compliance with" },
          ].map(({ num, text }) => (
            <div key={num} style={{ background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.08)", borderRadius: 10, padding: "1.4rem" }}>
              <div style={{ fontSize: "2rem", fontWeight: 800, color: "#b4451f" }}>{num}</div>
              <p style={{ fontSize: ".87rem", color: "#8a8275", marginTop: ".3rem" }}>{text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
```

(Note: em dash after "penalties by 2026" and after "adjudication" and before "most teams" in the original were replaced with commas/periods per the no-em-dash rule.)

- [ ] **Step 2: Commit**

```bash
git add frontend/components/landing/Problem.tsx
git commit -m "feat(frontend): extract landing Problem section component"
```

---

### Task 9: Extract HowItWorks section

**Files:**
- Create: `frontend/components/landing/HowItWorks.tsx`

**Interfaces:**
- Produces: `export default function HowItWorks(): JSX.Element`, consumed by `app/page.tsx` in Task 12.

- [ ] **Step 1: Write the component**

Port `page.tsx:134-155` verbatim (this is a 4-item numbered grid, not the banned generic 3-icon-card row, and already uses numbered indices instead of decorative icons, no changes needed):

```tsx
// frontend/components/landing/HowItWorks.tsx
export default function HowItWorks() {
  const pillars = [
    { title: "Recorder", desc: "Every agent action, LLM calls, tool invocations, results, is appended to a SHA-256 hash-chained log. Any silent edit breaks the chain immediately, providing tamper-evident provenance." },
    { title: "Tribunal", desc: "An autonomous multi-agent panel audits the full log against a structured EU AI Act policy pack. Each violation is flagged with cited evidence, article references, severity, and confidence score." },
    { title: "Replay", desc: "Reconstruct any incident step-by-step: see the exact decision chain, which prompt triggered which tool call, and where the root cause lies, indispensable for post-incident review." },
    { title: "Evidence Pack", desc: "One click exports an auditor-ready compliance report: incident summary, violation table with framework references, full action log, and chain-integrity status, formatted for regulators." },
  ];

  return (
    <section id="how" style={{ padding: "5rem 2rem", background: "#f4efe6" }}>
      <div style={{ maxWidth: 960, margin: "0 auto" }}>
        <div style={{ fontSize: ".75rem", fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", color: "#b4451f", marginBottom: ".6rem" }}>How it works</div>
        <h2 style={{ fontSize: "2rem", fontWeight: 800, letterSpacing: "-.02em", marginBottom: "1rem" }}>Four pillars of agent accountability</h2>
        <p style={{ fontSize: "1.05rem", color: "#8a8275", maxWidth: 640 }}>From first action to court-ready evidence pack, fully automated.</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: "1.2rem", marginTop: "2.5rem" }}>
          {pillars.map(({ title, desc }, i) => (
            <div key={title} style={{ background: "#fff", border: "1px solid #e3dccd", borderRadius: 10, padding: "1.5rem", boxShadow: "0 2px 12px rgba(26,23,20,.07)" }}>
              <div style={{ fontSize: ".8rem", fontWeight: 700, color: "#b4451f", marginBottom: ".75rem", fontFamily: "ui-monospace, monospace", letterSpacing: ".08em" }}>{String(i + 1).padStart(2, "0")}</div>
              <h3 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: ".4rem" }}>{title}</h3>
              <p style={{ fontSize: ".875rem", color: "#8a8275" }}>{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/components/landing/HowItWorks.tsx
git commit -m "feat(frontend): extract landing HowItWorks section component"
```

---

### Task 10: Extract Pricing section

**Files:**
- Create: `frontend/components/landing/Pricing.tsx`

**Interfaces:**
- Produces: `export default function Pricing(): JSX.Element`, consumed by `app/page.tsx` in Task 12.

- [ ] **Step 1: Write the component**

Port `page.tsx:157-213` verbatim into `Pricing.tsx` (three pricing tiers in a vertical/responsive grid is a standard, non-generic pricing-table pattern, not the banned horizontal-feature-card row, no changes needed beyond the file split):

```tsx
// frontend/components/landing/Pricing.tsx
export default function Pricing() {
  return (
    <section id="pricing" style={{ padding: "5rem 2rem", background: "#f8f4ee" }}>
      <div style={{ maxWidth: 960, margin: "0 auto" }}>
        <div style={{ fontSize: ".75rem", fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", color: "#b4451f", marginBottom: ".6rem" }}>Pricing</div>
        <h2 style={{ fontSize: "2rem", fontWeight: 800, letterSpacing: "-.02em", marginBottom: "1rem" }}>Start free. Scale with confidence.</h2>
        <p style={{ fontSize: "1.05rem", color: "#8a8275", maxWidth: 640 }}>Open source at the core. Hosted tiers for teams that need it now.</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1.2rem", marginTop: "2.5rem", alignItems: "start" }}>

          <div style={{ background: "#fff", border: "1px solid #e3dccd", borderRadius: 10, padding: "1.8rem", boxShadow: "0 2px 12px rgba(26,23,20,.07)" }}>
            <div style={{ fontSize: ".8rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".08em", color: "#8a8275", marginBottom: ".5rem" }}>Free / Open Source</div>
            <div style={{ fontSize: "2.2rem", fontWeight: 900, letterSpacing: "-.03em" }}>$0</div>
            <p style={{ fontSize: ".87rem", color: "#8a8275", margin: ".6rem 0 1.2rem" }}>Self-host on your own infrastructure. MIT licensed.</p>
            <ul style={{ listStyle: "none", padding: 0, marginBottom: "1.6rem" }}>
              {["Unlimited agents (self-hosted)", "SHA-256 hash-chained recorder", "EU AI Act policy pack (YAML)", "Tribunal audit CLI", "Evidence pack export (HTML)", "Community support (GitHub)"].map(f => (
                <li key={f} style={{ fontSize: ".875rem", padding: ".3rem 0", borderBottom: "1px solid #e3dccd", display: "flex", alignItems: "flex-start", gap: ".5rem" }}>
                  <span style={{ color: "#b4451f", fontWeight: 700 }}>✓</span>{f}
                </li>
              ))}
            </ul>
            <a href="https://github.com/iWeslax83/blackbox-agent-accountability" target="_blank" rel="noopener" style={{ display: "block", textAlign: "center", width: "100%", padding: ".65rem 1rem", borderRadius: 7, fontSize: ".9rem", fontWeight: 600, background: "transparent", color: "#1a1714", border: "1.5px solid #e3dccd", textDecoration: "none" }}>View on GitHub</a>
          </div>

          <div style={{ background: "#fff", border: "2px solid #b4451f", borderRadius: 10, padding: "1.8rem", boxShadow: "0 4px 24px rgba(180,69,31,.15)", position: "relative" }}>
            <div style={{ position: "absolute", top: -12, left: "50%", transform: "translateX(-50%)", background: "#b4451f", color: "#fff", fontSize: ".72rem", fontWeight: 700, letterSpacing: ".06em", textTransform: "uppercase", padding: ".22rem .7rem", borderRadius: 4 }}>Recommended</div>
            <div style={{ fontSize: ".8rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".08em", color: "#8a8275", marginBottom: ".5rem" }}>Pro</div>
            <div style={{ fontSize: "2.2rem", fontWeight: 900, letterSpacing: "-.03em" }}>$49<sub style={{ fontSize: ".9rem", fontWeight: 500, color: "#8a8275" }}>/mo</sub></div>
            <p style={{ fontSize: ".87rem", color: "#8a8275", margin: ".6rem 0 1.2rem" }}>Managed cloud. Everything you need for a production AI team.</p>
            <ul style={{ listStyle: "none", padding: 0, marginBottom: "1.6rem" }}>
              {["Up to 10 agents managed", "Hosted dashboard and real-time log", "Automated tribunal runs on schedule", "PDF + HTML evidence pack exports", "Custom policy rules", "Priority email support"].map(f => (
                <li key={f} style={{ fontSize: ".875rem", padding: ".3rem 0", borderBottom: "1px solid #e3dccd", display: "flex", alignItems: "flex-start", gap: ".5rem" }}>
                  <span style={{ color: "#b4451f", fontWeight: 700 }}>✓</span>{f}
                </li>
              ))}
            </ul>
            <a href="/login" style={{ display: "block", textAlign: "center", width: "100%", padding: ".65rem 1rem", borderRadius: 7, fontSize: ".9rem", fontWeight: 600, background: "#b4451f", color: "#fff", textDecoration: "none" }}>Get started free</a>
          </div>

          <div style={{ background: "#fff", border: "1px solid #e3dccd", borderRadius: 10, padding: "1.8rem", boxShadow: "0 2px 12px rgba(26,23,20,.07)" }}>
            <div style={{ fontSize: ".8rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".08em", color: "#8a8275", marginBottom: ".5rem" }}>Enterprise</div>
            <div style={{ fontSize: "1.6rem", fontWeight: 900, letterSpacing: "-.03em" }}>Custom</div>
            <p style={{ fontSize: ".87rem", color: "#8a8275", margin: ".6rem 0 1.2rem" }}>For regulated industries, large deployments, on-prem needs.</p>
            <ul style={{ listStyle: "none", padding: 0, marginBottom: "1.6rem" }}>
              {["Unlimited agents", "SSO / SAML integration", "On-premises deployment", "Custom policy packs and mapping", "Dedicated SLA and support", "Regulator liaison assistance"].map(f => (
                <li key={f} style={{ fontSize: ".875rem", padding: ".3rem 0", borderBottom: "1px solid #e3dccd", display: "flex", alignItems: "flex-start", gap: ".5rem" }}>
                  <span style={{ color: "#b4451f", fontWeight: 700 }}>✓</span>{f}
                </li>
              ))}
            </ul>
            <a href="/login" style={{ display: "block", textAlign: "center", width: "100%", padding: ".65rem 1rem", borderRadius: 7, fontSize: ".9rem", fontWeight: 600, background: "transparent", color: "#1a1714", border: "1.5px solid #e3dccd", textDecoration: "none" }}>Contact us</a>
          </div>

        </div>
      </div>
    </section>
  );
}
```

(Note: the "Recommended" ribbon's `borderRadius` was changed from `20` (pill) to `4` (bordered rectangle) per the no-pill-badge rule; it's a status label.)

- [ ] **Step 2: Commit**

```bash
git add frontend/components/landing/Pricing.tsx
git commit -m "feat(frontend): extract landing Pricing section, de-pill the Recommended badge"
```

---

### Task 11: Extract Cta and Footer sections

**Files:**
- Create: `frontend/components/landing/Cta.tsx`
- Create: `frontend/components/landing/Footer.tsx`

**Interfaces:**
- Produces: `export default function Cta(): JSX.Element` and `export default function Footer(): JSX.Element`, both consumed by `app/page.tsx` in Task 12.

- [ ] **Step 1: Write Cta.tsx**

Port `page.tsx:215-238` verbatim:

```tsx
// frontend/components/landing/Cta.tsx
export default function Cta() {
  return (
    <section id="cta" style={{ padding: "5rem 2rem", background: "#f4efe6" }}>
      <div style={{ maxWidth: 960, margin: "0 auto" }}>
        <div style={{ fontSize: ".75rem", fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", color: "#b4451f", marginBottom: ".6rem" }}>Early access</div>
        <h2 style={{ fontSize: "2rem", fontWeight: 800, letterSpacing: "-.02em", marginBottom: "1rem" }}>Get started today</h2>
        <p style={{ fontSize: "1.05rem", color: "#8a8275", textAlign: "center", maxWidth: 520, margin: "0 auto" }}>
          We&apos;re onboarding early teams. Create your account and start auditing your agents in minutes.
        </p>
        <div style={{ background: "#fff", border: "1px solid #e3dccd", borderRadius: 14, padding: "2.8rem", maxWidth: 520, margin: "2.5rem auto 0", boxShadow: "0 2px 12px rgba(26,23,20,.07)", textAlign: "center" }}>
          <h3 style={{ fontSize: "1.4rem", fontWeight: 800, marginBottom: ".5rem" }}>Start for free</h3>
          <p style={{ color: "#8a8275", fontSize: ".9rem", marginBottom: "1.4rem" }}>
            No credit card required. Full access to the dashboard, API key management, and tribunal audits.
          </p>
          <a href="/login" style={{
            display: "inline-block",
            background: "#b4451f", color: "#fff",
            padding: ".75rem 2rem", borderRadius: 8,
            fontSize: "1rem", fontWeight: 600, textDecoration: "none",
          }}>
            Get started free →
          </a>
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Write Footer.tsx**

Port `page.tsx:240-253` verbatim:

```tsx
// frontend/components/landing/Footer.tsx
export default function Footer() {
  return (
    <footer style={{ background: "#1a1714", color: "#8a8275", padding: "2rem", textAlign: "center", fontSize: ".83rem" }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: ".5rem" }}>
        <div><strong style={{ color: "#c9bfaf" }}>BLACKBOX</strong> — AI Agent Accountability and Compliance</div>
        <div>
          <a href="https://github.com/iWeslax83/blackbox-agent-accountability" target="_blank" rel="noopener" style={{ color: "#a09890", textDecoration: "none" }}>GitHub</a>
          &nbsp;·&nbsp; MIT licensed &nbsp;·&nbsp;
          <a href="/login" style={{ color: "#a09890", textDecoration: "none" }}>Dashboard</a>
        </div>
        <div style={{ fontSize: ".78rem", color: "#5a524a", marginTop: ".25rem" }}>
          Not legal advice. BLACKBOX is a technical tool, consult qualified counsel for regulatory guidance.
        </div>
      </div>
    </footer>
  );
}
```

(Note: em dash before "AI Agent Accountability" replaced with nothing needed, that one is a brand tagline separator, replace with a colon: `BLACKBOX: AI Agent Accountability and Compliance`. Apply that in the actual file. The em dash before "consult qualified counsel" replaced with a comma as shown above.)

- [ ] **Step 3: Commit**

```bash
git add frontend/components/landing/Cta.tsx frontend/components/landing/Footer.tsx
git commit -m "feat(frontend): extract landing Cta and Footer section components"
```

---

### Task 12: Reassemble page.tsx

**Files:**
- Modify: `frontend/app/page.tsx` (full rewrite)

**Interfaces:**
- Consumes: `Hero` (Task 7), `Problem` (Task 8), `HowItWorks` (Task 9), `Pricing` (Task 10), `Cta` (Task 11), `Footer` (Task 11).

- [ ] **Step 1: Rewrite page.tsx**

```tsx
// frontend/app/page.tsx
import Hero from "@/components/landing/Hero";
import Problem from "@/components/landing/Problem";
import HowItWorks from "@/components/landing/HowItWorks";
import Pricing from "@/components/landing/Pricing";
import Cta from "@/components/landing/Cta";
import Footer from "@/components/landing/Footer";

export default function Landing() {
  return (
    <main style={{ background: "#f4efe6", color: "#1a1714", fontFamily: "system-ui, -apple-system, sans-serif", lineHeight: 1.6 }}>
      <nav style={{
        position: "sticky", top: 0, zIndex: 100,
        background: "#f4efe6",
        borderBottom: "1px solid #e3dccd",
        padding: "0 2rem",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        height: 58,
      }}>
        <a href="#" style={{ fontSize: "1.15rem", fontWeight: 700, letterSpacing: "-.01em", color: "#1a1714", textDecoration: "none", display: "flex", alignItems: "center", gap: ".35rem" }}>
          BLACKBOX
        </a>
        <ul style={{ display: "flex", alignItems: "center", gap: "1.6rem", listStyle: "none", margin: 0, padding: 0 }}>
          <li><a href="#how" style={{ color: "#1a1714", fontSize: ".9rem", fontWeight: 500, textDecoration: "none" }}>How it works</a></li>
          <li><a href="#pricing" style={{ color: "#1a1714", fontSize: ".9rem", fontWeight: 500, textDecoration: "none" }}>Pricing</a></li>
          <li>
            <a href="/login" style={{
              background: "#b4451f", color: "#fff",
              padding: ".38rem .9rem", borderRadius: 6, fontSize: ".9rem", fontWeight: 600,
              textDecoration: "none",
            }}>Get started free</a>
          </li>
        </ul>
      </nav>

      <Hero />
      <Problem />
      <HowItWorks />
      <Pricing />
      <Cta />
      <Footer />
    </main>
  );
}
```

- [ ] **Step 2: Verify build**

Run: `cd frontend && npx tsc --noEmit && npm run lint`
Expected: no new errors introduced by this change.

- [ ] **Step 3: Run dev server and visually verify the full page**

Run: `cd frontend && npm run dev`

In a browser (or `mcp__claude-in-chrome`), navigate to `http://localhost:3000/` and confirm:
- Hero renders with bordered (not pill) regulatory badge, headline, CTAs, "Built with" line, the hash-chain visual (3D or static depending on viewport/motion settings), and the terminal demo beneath it, in that order, with no layout jump.
- All six sections render in original order with original content, no missing text, no broken links.
- At 375px width: no horizontal scroll, hash-chain visual is the static SVG variant, all text readable.
- At desktop width with no reduced-motion preference: hash-chain visual is the 3D canvas, rotating slowly.
- No console errors.

- [ ] **Step 4: Run full test suite**

Run: `cd frontend && npx vitest run`
Expected: PASS, all tests including the new `chainData.test.ts` and `useReducedMotion.test.ts`.

- [ ] **Step 5: Commit**

```bash
git add frontend/app/page.tsx
git commit -m "refactor(frontend): reassemble landing page from extracted section components"
```

---

## Self-Review

**Spec coverage:**
- Keep warm-paper/rust flat design system: Tasks 7-12 preserve all existing colors/tokens, only the pill badges (Task 7 hero badge, Task 10 Pricing ribbon) were converted to bordered rectangles.
- Corporate-trust dominant, developer-first secondary: unchanged copy tone (Tasks 8-11), terminal demo retained (Task 7), no new playful/bento elements added.
- One real 3D element tied to product mechanics: Tasks 2-6 (chain data, 3D scene, static fallback, gating wrapper).
- No generic bento/blob/dashboard-mockup filler: verified, no such elements introduced.
- Global constraint checks: no gradients/glassmorphism/purple (verified, only flat colors used throughout), no pill badges (fixed in Tasks 7 and 10), no em dashes (fixed in Tasks 8 and 11), no `h-screen`/`100vh` (none used), motion isolated to client leaves (Tasks 4 and 6), no external image deps (Task 5 uses inline SVG, Task 4 uses procedural geometry).

**Placeholder scan:** none found, every step has real code or an exact manual-verification procedure.

**Type consistency:** `ChainBlock` (Task 2) is consumed identically by `HashChainScene.tsx` (Task 4, via `buildChainBlocks`) and `HashChainStatic.tsx` (Task 5, same import). `useReducedMotion(): boolean` (Task 3) is called the same way in `HeroChain.tsx` (Task 6). `HeroChain` default export (Task 6) matches its import in `Hero.tsx` (Task 7). All six section components' default exports (Tasks 7-11) match their imports in `page.tsx` (Task 12).

---

## Out of Scope (future plans)

This plan covers the landing page only. Two follow-up plans, written separately once this one ships and is reviewed, will cover:
- **Auth pages** (`frontend/app/login/page.tsx`, `frontend/app/auth/callback/page.tsx`): apply the same design-token pass, no 3D needed here (users are mid-task, not being sold to).
- **Dashboard pages** (`frontend/app/app/page.tsx`, `keys/page.tsx`, `settings/page.tsx`, `billing/page.tsx`, `components/TopNav.tsx`): data-density review, replace any pill-shaped status badges (`globals.css:108-112` already uses non-pill `.badge`, verify usage sites), consistent spacing rhythm using `globals.css` tokens.
