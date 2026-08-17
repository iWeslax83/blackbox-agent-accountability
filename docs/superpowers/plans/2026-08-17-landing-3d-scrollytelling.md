# Landing Page 3D Scrollytelling Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the BLACKBOX landing page's current light, card-stacked, generic-SaaS layout with a single dark, cinematic, scroll-scrubbed 3D experience where the camera moves through five scenes visualizing the product's real mechanics (hash-chain recorder, problem stats, tribunal audit, evidence pack), before settling into a calmer flat zig-zag pricing section and closing.

**Architecture:** One `@react-three/fiber` `<Canvas>` + drei `<ScrollControls>` (`pages={7}`, `damping` tuned) owns the entire page's single scroll region. All page content (five 3D-backed scenes plus Pricing and CTA/Footer) lives inside `<Scroll html>` as stacked full-height `<section>`s, so there is exactly one scroll mechanism for the whole page (no nested scroll regions). A capability-gating wrapper (`SceneGate`) picks between this experience and a fully separate, server-renderable stacked-HTML fallback (`SceneExperienceStatic`) for reduced-motion, narrow viewports, and no-WebGL, following the `useSyncExternalStore`-based mount-detection pattern already proven in the previously-shipped `HeroChain.tsx`.

**Tech Stack:** Next.js 16 (non-standard version, read `frontend/node_modules/next/dist/docs/01-app/` before writing Next-specific code, per `frontend/AGENTS.md`), React 19, TypeScript, `@react-three/fiber` (installed), `@react-three/drei` (this plan reinstalls it), `three` (installed), Vitest for pure-logic unit tests.

**Spec:** `docs/superpowers/specs/2026-08-17-landing-page-3d-scrollytelling-redesign.md` — read it in full; this plan argues from it and does not restate its reasoning, only its concrete requirements.

## Global Constraints

- No gradients, no glassmorphism/`backdrop-filter`, no purple/violet. Flat near-black background (`#0d0c0b`) + one accent color family (rust/amber).
- No em dashes (—) in any copy, code, comment, or commit message.
- No pill badges (`rounded-full` + tint) for status/labels.
- Never `git add -A` / `git add .`. Match commit style: `feat(frontend): ...` / `fix(frontend): ...` / `refactor(frontend): ...`, no session links.
- Scope is `frontend/app/page.tsx` and `frontend/components/landing/**` only. Do not touch `/login`, `/app/*`, `/privacy`, `/terms`, `/auth/callback`, or `frontend/app/globals.css`'s global serif body font.
- Full desktop 3D path: `ScrollControls` is the single scroll mechanism for the entire page (`pages={7}`: Opening, Problem, Recorder, Tribunal, EvidencePack, Pricing, CtaFooter). All visible page content lives inside `<Scroll html>`. No section exists outside the Canvas/ScrollControls tree except the sticky nav.
- Reduced-motion/mobile (`< 768px`)/no-WebGL path: completely separate stacked-HTML component, `IntersectionObserver`-driven opacity cross-fades only (no slides, no parallax, no elastic/overshoot), full-height sections use `min-height: 100dvh` (never `100vh`).
- Per-element entrance fade: 200-300ms. Exit: 150-200ms (60-70% of entrance). No element holds below `opacity: 0.2` mid-transition.
- Every interactive element needs a visible `:focus-visible` ring on the dark background and `:active` press feedback (`scale(0.97)`, `transition: transform 100ms ease-out`).
- Canvas accessibility: verify `aria-label` placement against the installed `@react-three/fiber` version's actual `Canvas` prop-spreading behavior before trusting it reaches the accessibility tree (a prior plan found this landed on the wrong DOM node).
- New dark-on-dark text/accent colors must be verified against WCAG AA (4.5:1 normal text, 3:1 large text) before use, not assumed.
- Existing convention: inline `style={{...}}` objects, no Tailwind, no icon library (numbered/dot convention stays), no GSAP/Framer Motion mixed with the R3F tree.

---

## File Structure

- `frontend/lib/contrast.ts` / `.test.ts` — new. WCAG contrast-ratio math, verifies the chosen dark-theme colors.
- `frontend/lib/landingTheme.ts` — new. Dark-theme color token constants, informed by `contrast.ts`.
- `frontend/lib/useClientSnapshot.ts` / `.test.ts` — new. Generic one-time client-value hook, extracted from the existing pattern in `HeroChain.tsx`.
- `frontend/lib/sceneProgress.ts` / `.test.ts` — new. Pure scroll-offset-to-scene math (`getActiveSceneIndex`, `getSceneLocalProgress`), scene/page constants.
- `frontend/lib/landingFont.ts` — new. Geist font loader (`next/font/google`), landing-page-only.
- `frontend/components/landing/dark/LandingInteractionStyles.tsx` — new. Injects the shared `.landing-btn` press/focus CSS once.
- `frontend/components/landing/scenes/ChainBlocksGroup.tsx` — new. Shared 3D hash-chain block geometry (extracted/generalized from the now-superseded `HashChainScene.tsx`), reused by the Opening and Recorder scenes.
- `frontend/components/landing/scenes/CameraRig.tsx` — new. Drives the shared `<Canvas>` camera position from `useScroll().offset`.
- `frontend/components/landing/scenes/OpeningChainScene.tsx` — new.
- `frontend/components/landing/scenes/ProblemStatsScene.tsx` — new.
- `frontend/components/landing/scenes/RecorderChainScene.tsx` — new.
- `frontend/components/landing/scenes/TribunalScene.tsx` — new.
- `frontend/components/landing/scenes/EvidencePackScene.tsx` — new.
- `frontend/components/landing/SceneExperience.tsx` — new. The full desktop 3D experience: `Canvas` + `ScrollControls` + `CameraRig` + all five 3D scenes + all seven HTML sections via `Scroll html`.
- `frontend/components/landing/SceneExperienceStatic.tsx` — new. Server-renderable fallback: stacked HTML sections, `IntersectionObserver` cross-fades, reuses `HashChainStatic`.
- `frontend/components/landing/SceneGate.tsx` — new. Capability gate choosing `SceneExperience` vs `SceneExperienceStatic`.
- `frontend/components/landing/PricingZigzag.tsx` — new. Replaces `Pricing.tsx`.
- `frontend/components/landing/Footer.tsx` — modify. Dark-theme restyle.
- `frontend/components/landing/Cta.tsx` — modify. Dark-theme restyle (folded into the CtaFooter HTML section, still its own component for clarity).
- `frontend/components/landing/StickyMobileCta.tsx` — modify. Dark-theme restyle (used only on the static/mobile fallback path).
- `frontend/app/page.tsx` — modify. Reassembled around `SceneGate` + `PricingZigzag` (desktop path renders these inside `SceneExperience`; the static path composes them directly).
- Delete (superseded, verified unused after reassembly): `frontend/components/landing/Hero.tsx`, `frontend/components/landing/HeroChain.tsx`, `frontend/components/landing/HashChainScene.tsx`, `frontend/components/landing/Problem.tsx`, `frontend/components/landing/HowItWorks.tsx`, `frontend/components/landing/Pricing.tsx`.
- Kept unchanged, reused: `frontend/lib/chainData.ts`, `frontend/lib/useReducedMotion.ts`, `frontend/components/landing/HashChainStatic.tsx`.

---

### Task 1: Reinstall `@react-three/drei`

**Files:**
- Modify: `frontend/package.json`, `frontend/package-lock.json`

**Interfaces:**
- Produces: `@react-three/drei` importable (`ScrollControls`, `Scroll`, `useScroll`, `Text`) from any client component in later tasks.

- [ ] **Step 1: Install**

Run:
```bash
cd frontend && npm install @react-three/drei
```

- [ ] **Step 2: Verify peer compatibility with the installed React/R3F versions**

Run: `npm ls @react-three/drei @react-three/fiber three react`
Expected: no `ERESOLVE` warnings. If any appear, note the resolved versions in the commit message body.

- [ ] **Step 3: Locate the ScrollControls API surface for this installed version**

Run: `find node_modules/@react-three/drei -iname "*ScrollControls*"` and read the matching `.d.ts` file to confirm the exact prop names (`pages`, `damping`, `distance`) and the `useScroll()` return shape (`offset`, `delta`, `range`, `visible`) before any later task writes code against them. Note any discrepancy from this plan's assumptions in your report.

- [ ] **Step 4: Commit**

```bash
git add frontend/package.json frontend/package-lock.json
git commit -m "feat(frontend): reinstall @react-three/drei for scroll-scrubbed scenes"
```

---

### Task 2: Contrast verification utility (TDD)

**Files:**
- Create: `frontend/lib/contrast.ts`
- Test: `frontend/lib/contrast.test.ts`

**Interfaces:**
- Produces:
  ```ts
  export function contrastRatio(hexA: string, hexB: string): number;
  export function meetsWcagAA(hexA: string, hexB: string, largeText?: boolean): boolean;
  ```
- Consumed by: this task's own test (verifying the chosen dark-theme palette), and by `landingTheme.ts` (Task 3) as the documented source of truth for why those exact hex values were chosen.

- [ ] **Step 1: Write the failing test**

```ts
// frontend/lib/contrast.test.ts
import { describe, it, expect } from "vitest";
import { contrastRatio, meetsWcagAA } from "./contrast";

describe("contrastRatio", () => {
  it("returns 21 for pure black against pure white", () => {
    expect(contrastRatio("#000000", "#ffffff")).toBeCloseTo(21, 0);
  });

  it("returns 1 for a color against itself", () => {
    expect(contrastRatio("#b4451f", "#b4451f")).toBeCloseTo(1, 1);
  });

  it("is symmetric", () => {
    const a = contrastRatio("#0d0c0b", "#f4efe6");
    const b = contrastRatio("#f4efe6", "#0d0c0b");
    expect(a).toBeCloseTo(b, 5);
  });
});

describe("meetsWcagAA", () => {
  it("passes for the near-black background against the off-white text color", () => {
    expect(meetsWcagAA("#0d0c0b", "#f4efe6")).toBe(true);
  });

  it("fails for two near-identical dark grays as normal text", () => {
    expect(meetsWcagAA("#0d0c0b", "#141311")).toBe(false);
  });

  it("allows a lower ratio for large text", () => {
    // a ratio that fails 4.5:1 normal-text but clears 3:1 large-text
    const passesLarge = meetsWcagAA("#0d0c0b", "#8a6a55", true);
    const passesNormal = meetsWcagAA("#0d0c0b", "#8a6a55", false);
    expect(passesLarge).toBe(true);
    expect(passesNormal).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd frontend && npx vitest run lib/contrast.test.ts`
Expected: FAIL, `Cannot find module './contrast'`.

- [ ] **Step 3: Write minimal implementation**

```ts
// frontend/lib/contrast.ts
function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace("#", "");
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  return [r, g, b];
}

function relativeLuminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex).map((channel) => {
    const c = channel / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrastRatio(hexA: string, hexB: string): number {
  const lumA = relativeLuminance(hexA);
  const lumB = relativeLuminance(hexB);
  const lighter = Math.max(lumA, lumB);
  const darker = Math.min(lumA, lumB);
  return (lighter + 0.05) / (darker + 0.05);
}

export function meetsWcagAA(hexA: string, hexB: string, largeText = false): boolean {
  const ratio = contrastRatio(hexA, hexB);
  return largeText ? ratio >= 3 : ratio >= 4.5;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd frontend && npx vitest run lib/contrast.test.ts`
Expected: PASS, 6 tests.

- [ ] **Step 5: Verify the actual spec-proposed accent color and pick a final value**

Run a quick check (e.g. temporarily add `console.log(contrastRatio("#0d0c0b", "#d97a4a"))` to a scratch script, or use `node -e` with a small inline snippet requiring the compiled output, or add a throwaway test assertion) to get the real ratio for `#0d0c0b` against the spec's proposed `#d97a4a` accent-on-dark text color. If it is below 4.5, lighten `#d97a4a` (increase RGB values, keep it in the same rust/amber hue family, not shifting toward a different hue) until `meetsWcagAA("#0d0c0b", <candidate>)` is `true`, and use that exact final hex in Task 3. Record the final chosen hex and its measured ratio in your task report; this value is load-bearing for Task 3, do not defer it.

- [ ] **Step 6: Commit**

```bash
git add frontend/lib/contrast.ts frontend/lib/contrast.test.ts
git commit -m "feat(frontend): add WCAG contrast ratio utility for dark-theme colors"
```

---

### Task 3: Dark theme color tokens

**Files:**
- Create: `frontend/lib/landingTheme.ts`

**Interfaces:**
- Consumes: the verified accent-on-dark hex from Task 2 Step 5.
- Produces:
  ```ts
  export const DARK_BG: string;        // "#0d0c0b"
  export const DARK_SURFACE: string;   // slightly lighter than DARK_BG, for cards
  export const TEXT_ON_DARK: string;   // "#f4efe6"
  export const ACCENT_TEXT: string;    // the Task 2-verified lightened accent, for text on dark
  export const ACCENT_FILL: string;    // "#b4451f", for filled button backgrounds
  export const MUTED_ON_DARK: string;  // a desaturated mid-gray for secondary text
  export const BORDER_ON_DARK: string; // a subtle border color for cards/dividers
  ```
  Consumed by every scene/component task from here on. All later tasks import colors from this file rather than repeating hex literals, so a single later color adjustment only touches this file.

- [ ] **Step 1: Write the file**

Use the exact `ACCENT_TEXT` value determined in Task 2 Step 5 (do not guess it here; if Task 2 found `#d97a4a` already passes, use it as-is):

```ts
// frontend/lib/landingTheme.ts
export const DARK_BG = "#0d0c0b";
export const DARK_SURFACE = "#171512";
export const TEXT_ON_DARK = "#f4efe6";
export const ACCENT_TEXT = "#d97a4a"; // replace with Task 2's verified value if different
export const ACCENT_FILL = "#b4451f";
export const MUTED_ON_DARK = "#a89c8e";
export const BORDER_ON_DARK = "#2a2723";
```

- [ ] **Step 2: Add a regression test asserting the file's exported colors actually pass contrast**

```ts
// frontend/lib/landingTheme.test.ts
import { describe, it, expect } from "vitest";
import { meetsWcagAA } from "./contrast";
import { DARK_BG, TEXT_ON_DARK, ACCENT_TEXT, MUTED_ON_DARK } from "./landingTheme";

describe("landingTheme contrast", () => {
  it("TEXT_ON_DARK meets AA normal text against DARK_BG", () => {
    expect(meetsWcagAA(DARK_BG, TEXT_ON_DARK)).toBe(true);
  });

  it("ACCENT_TEXT meets AA normal text against DARK_BG", () => {
    expect(meetsWcagAA(DARK_BG, ACCENT_TEXT)).toBe(true);
  });

  it("MUTED_ON_DARK meets AA large text against DARK_BG", () => {
    expect(meetsWcagAA(DARK_BG, MUTED_ON_DARK, true)).toBe(true);
  });
});
```

This test is not decorative: if a later task edits `landingTheme.ts`'s colors without checking contrast, this test catches the regression immediately instead of silently shipping unreadable text.

- [ ] **Step 3: Run test to verify it passes**

Run: `cd frontend && npx vitest run lib/landingTheme.test.ts`
Expected: PASS, 3 tests. If any fail, adjust the failing color in `landingTheme.ts` (lighten it, same hue family) until it passes, then re-run.

- [ ] **Step 4: Commit**

```bash
git add frontend/lib/landingTheme.ts frontend/lib/landingTheme.test.ts
git commit -m "feat(frontend): add dark-theme color tokens with contrast regression test"
```

---

### Task 4: Extract `useClientSnapshot` (TDD)

**Files:**
- Create: `frontend/lib/useClientSnapshot.ts`
- Test: `frontend/lib/useClientSnapshot.test.ts`

**Interfaces:**
- Produces: `export function useClientSnapshot<T>(getClientValue: () => T, serverValue: T): T;`
- Consumed by: `SceneGate.tsx` (Task 17).

- [ ] **Step 1: Write the failing test**

```ts
// frontend/lib/useClientSnapshot.test.ts
import { describe, it, expect } from "vitest";
import { renderHook } from "@testing-library/react";
import { useClientSnapshot } from "./useClientSnapshot";

describe("useClientSnapshot", () => {
  it("returns the client value on render", () => {
    const { result } = renderHook(() => useClientSnapshot(() => "client", "server"));
    expect(result.current).toBe("client");
  });

  it("returns a fresh client value each time getClientValue's underlying data changes and a re-render is forced", () => {
    let value = 1;
    const { result, rerender } = renderHook(() => useClientSnapshot(() => value, 0));
    expect(result.current).toBe(1);
    value = 2;
    rerender();
    expect(result.current).toBe(2);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd frontend && npx vitest run lib/useClientSnapshot.test.ts`
Expected: FAIL, `Cannot find module './useClientSnapshot'`.

- [ ] **Step 3: Write minimal implementation**

```ts
// frontend/lib/useClientSnapshot.ts
"use client";
import { useSyncExternalStore } from "react";

// One-time (or externally-triggered) client-only reads that have no server
// value and don't need their own change-notification source. Modeled as a
// no-op-subscription external store so the client value is available on the
// very first client render, without the extra render pass a `useEffect` +
// `setState` mount-detection dance would cost.
export function useClientSnapshot<T>(getClientValue: () => T, serverValue: T): T {
  return useSyncExternalStore(
    () => () => {},
    getClientValue,
    () => serverValue,
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd frontend && npx vitest run lib/useClientSnapshot.test.ts`
Expected: PASS, 2 tests.

- [ ] **Step 5: Commit**

```bash
git add frontend/lib/useClientSnapshot.ts frontend/lib/useClientSnapshot.test.ts
git commit -m "feat(frontend): extract useClientSnapshot as a shared lib hook"
```

---

### Task 5: Scene progress math (TDD)

**Files:**
- Create: `frontend/lib/sceneProgress.ts`
- Test: `frontend/lib/sceneProgress.test.ts`

**Interfaces:**
- Produces:
  ```ts
  export const SCENE_COUNT = 5;       // 3D-backed scenes: Opening, Problem, Recorder, Tribunal, EvidencePack
  export const TOTAL_PAGES = 7;       // + Pricing, CtaFooter (flat, no 3D geometry)
  export const SCENE_DEPTH = 8;       // world units of camera travel per scene, for CameraRig
  export const PIN_SCENE_INDEX = 4;   // EvidencePack scene index (0-based) that pins
  export const PIN_FRACTION = 0.4;    // fraction of that scene's local progress range spent pinned
  export function getActiveSceneIndex(offset: number, sceneCount?: number): number;
  export function getSceneLocalProgress(offset: number, sceneCount: number, sceneIndex: number): number;
  ```
- Consumed by: `CameraRig.tsx` (Task 9), every scene component (Tasks 10-14), `SceneExperience.tsx` (Task 15), `SceneExperienceStatic.tsx` (Task 16, for `TOTAL_PAGES`-equivalent section count reasoning, though the static path doesn't use scroll-offset math directly).

- [ ] **Step 1: Write the failing test**

```ts
// frontend/lib/sceneProgress.test.ts
import { describe, it, expect } from "vitest";
import { getActiveSceneIndex, getSceneLocalProgress, SCENE_COUNT, TOTAL_PAGES } from "./sceneProgress";

describe("constants", () => {
  it("defines 5 3D scenes across 7 total scroll pages", () => {
    expect(SCENE_COUNT).toBe(5);
    expect(TOTAL_PAGES).toBe(7);
  });
});

describe("getActiveSceneIndex", () => {
  it("returns 0 at the very start", () => {
    expect(getActiveSceneIndex(0, 5)).toBe(0);
  });

  it("returns the last scene index near the end of the 3D range", () => {
    expect(getActiveSceneIndex(0.99, 5)).toBe(4);
  });

  it("returns 1 partway into the second scene's range", () => {
    expect(getActiveSceneIndex(0.21, 5)).toBe(1);
  });

  it("clamps offsets above 1 to the last scene", () => {
    expect(getActiveSceneIndex(1.5, 5)).toBe(4);
  });

  it("clamps negative offsets to the first scene", () => {
    expect(getActiveSceneIndex(-0.2, 5)).toBe(0);
  });
});

describe("getSceneLocalProgress", () => {
  it("is 0 at the exact start of a scene's range", () => {
    expect(getSceneLocalProgress(0.2, 5, 1)).toBeCloseTo(0, 5);
  });

  it("is 1 at the exact end of a scene's range", () => {
    expect(getSceneLocalProgress(0.4, 5, 1)).toBeCloseTo(1, 5);
  });

  it("is 0.5 halfway through a scene's range", () => {
    expect(getSceneLocalProgress(0.1, 5, 0)).toBeCloseTo(0.5, 5);
  });

  it("clamps below 0 for offsets before the scene starts", () => {
    expect(getSceneLocalProgress(0.05, 5, 1)).toBe(0);
  });

  it("clamps above 1 for offsets after the scene ends", () => {
    expect(getSceneLocalProgress(0.9, 5, 1)).toBe(1);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd frontend && npx vitest run lib/sceneProgress.test.ts`
Expected: FAIL, `Cannot find module './sceneProgress'`.

- [ ] **Step 3: Write minimal implementation**

```ts
// frontend/lib/sceneProgress.ts
export const SCENE_COUNT = 5;
export const TOTAL_PAGES = 7;
export const SCENE_DEPTH = 8;
export const PIN_SCENE_INDEX = 4;
export const PIN_FRACTION = 0.4;

export function getActiveSceneIndex(offset: number, sceneCount: number = SCENE_COUNT): number {
  const clamped = Math.min(Math.max(offset, 0), 0.999999);
  return Math.floor(clamped * sceneCount);
}

export function getSceneLocalProgress(offset: number, sceneCount: number, sceneIndex: number): number {
  const sceneSpan = 1 / sceneCount;
  const sceneStart = sceneIndex * sceneSpan;
  const local = (offset - sceneStart) / sceneSpan;
  return Math.min(Math.max(local, 0), 1);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd frontend && npx vitest run lib/sceneProgress.test.ts`
Expected: PASS, 11 tests.

- [ ] **Step 5: Commit**

```bash
git add frontend/lib/sceneProgress.ts frontend/lib/sceneProgress.test.ts
git commit -m "feat(frontend): add scroll-offset-to-scene pure logic"
```

---

### Task 6: Landing-page font

**Files:**
- Create: `frontend/lib/landingFont.ts`

**Interfaces:**
- Produces: `export const landingFont: { className: string; style: { fontFamily: string } };` (the object `next/font/google`'s loader returns).
- Consumed by: `app/page.tsx` (Task 22).

- [ ] **Step 1: Read the Next.js font-loading doc for this project's version**

Read `frontend/node_modules/next/dist/docs/01-app/01-getting-started/` for any `font` optimization guide file (search `find frontend/node_modules/next/dist/docs -iname "*font*"`), to confirm `next/font/google`'s API shape (the `Geist` export, `subsets`/`weight`/`display` options) is unchanged for this Next.js version before writing the loader.

- [ ] **Step 2: Write the file**

```ts
// frontend/lib/landingFont.ts
import { Geist } from "next/font/google";

export const landingFont = Geist({
  subsets: ["latin"],
  weight: ["400", "500", "700", "800", "900"],
  display: "swap",
});
```

If Step 1's doc check reveals `Geist` is not available under `next/font/google` for this Next.js version (some versions ship it only via the separate `geist` npm package rather than Google Fonts), install the `geist` package instead (`npm install geist`) and adjust the import to `import { GeistSans } from "geist/font/sans"`, exporting the same `landingFont` shape (`{ className, style }`) either way. Document which path was taken in your report.

- [ ] **Step 3: Verify**

Run: `cd frontend && npx tsc --noEmit`
Expected: no new errors.

- [ ] **Step 4: Commit**

```bash
git add frontend/lib/landingFont.ts frontend/package.json frontend/package-lock.json
git commit -m "feat(frontend): add Geist font loader for the landing page"
```

(Include `package.json`/`package-lock.json` in the `git add` only if Step 2's fallback path installed the `geist` package; otherwise omit them, nothing else changed.)

---

### Task 7: Shared button/focus interaction styles

**Files:**
- Create: `frontend/components/landing/dark/LandingInteractionStyles.tsx`

**Interfaces:**
- Produces: `export default function LandingInteractionStyles(): JSX.Element;` — a component that renders a single scoped `<style>` tag defining the `.landing-btn` class's `:active` and `:focus-visible` states. Mount once, near the top of the page tree.
- Consumed by: `SceneExperience.tsx` (Task 15) and `SceneExperienceStatic.tsx` (Task 16) each mount one instance (they're mutually exclusive render paths, so no duplicate-style risk); any element using the `.landing-btn` class (nav CTA, scene CTAs, pricing buttons) gets the shared behavior.

- [ ] **Step 1: Write the component**

```tsx
// frontend/components/landing/dark/LandingInteractionStyles.tsx
import { ACCENT_TEXT } from "@/lib/landingTheme";

export default function LandingInteractionStyles() {
  return (
    <style>{`
      .landing-btn {
        transition: transform 100ms ease-out;
      }
      .landing-btn:active {
        transform: scale(0.97);
      }
      .landing-btn:focus-visible {
        outline: 2px solid ${ACCENT_TEXT};
        outline-offset: 3px;
      }
      .landing-link:focus-visible {
        outline: 2px solid ${ACCENT_TEXT};
        outline-offset: 2px;
        border-radius: 2px;
      }
    `}</style>
  );
}
```

- [ ] **Step 2: Verify**

Run: `cd frontend && npx tsc --noEmit`
Expected: no new errors (this component isn't consumed anywhere yet, so it's a standalone type-check pass).

- [ ] **Step 3: Commit**

```bash
git add frontend/components/landing/dark/LandingInteractionStyles.tsx
git commit -m "feat(frontend): add shared button press and focus-visible styles"
```

---

### Task 8: Shared chain-block 3D geometry

**Files:**
- Create: `frontend/components/landing/scenes/ChainBlocksGroup.tsx`

**Interfaces:**
- Consumes: `ChainBlock` type and no direct call to `buildChainBlocks` inside this file (blocks are passed in as a prop, so this component stays a pure presentational geometry renderer reusable at any block count).
- Produces: `export default function ChainBlocksGroup(props: { blocks: ChainBlock[]; centerX?: number }): JSX.Element;` — renders the box-plus-connector geometry (generalized from the now-superseded `HashChainScene.tsx`'s inline `ChainGroup`), using `landingTheme` colors instead of the old light-theme hex literals. Consumed by `OpeningChainScene.tsx` (Task 10) and `RecorderChainScene.tsx` (Task 12).

- [ ] **Step 1: Write the component**

```tsx
// frontend/components/landing/scenes/ChainBlocksGroup.tsx
"use client";

import type { ChainBlock } from "@/lib/chainData";
import { DARK_SURFACE, ACCENT_FILL, BORDER_ON_DARK } from "@/lib/landingTheme";

export default function ChainBlocksGroup({
  blocks,
  centerX,
}: {
  blocks: ChainBlock[];
  centerX?: number;
}) {
  const offset = centerX ?? ((blocks.length - 1) * 1.6) / 2;

  return (
    <group>
      {blocks.map((block, i) => (
        <group key={block.id} position={[block.x - offset, block.y, block.z]}>
          <mesh>
            <boxGeometry args={[0.9, 0.9, 0.9]} />
            <meshStandardMaterial
              color={i === blocks.length - 1 ? ACCENT_FILL : DARK_SURFACE}
              roughness={0.45}
              metalness={0.15}
              emissive={i === blocks.length - 1 ? ACCENT_FILL : "#000000"}
              emissiveIntensity={i === blocks.length - 1 ? 0.25 : 0}
            />
          </mesh>
          {i < blocks.length - 1 && (
            <mesh position={[0.8, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.04, 0.04, 0.7, 8]} />
              <meshStandardMaterial color={BORDER_ON_DARK} />
            </mesh>
          )}
        </group>
      ))}
    </group>
  );
}
```

Note the dark-theme restyle from the original: near-black `DARK_SURFACE` blocks (not `#1a1714` ink, which was tuned for a light background) with a thin `emissive` rim only on the highlighted last block, so blocks stay readable against the near-black canvas background per the spec's "thin light rim" requirement, and connectors use the dark-theme border color instead of the old light-theme gray.

- [ ] **Step 2: Verify**

Run: `cd frontend && npx tsc --noEmit`
Expected: no new errors.

- [ ] **Step 3: Commit**

```bash
git add frontend/components/landing/scenes/ChainBlocksGroup.tsx
git commit -m "feat(frontend): extract shared chain-block 3D geometry for dark scenes"
```

---

### Task 9: Camera rig

**Files:**
- Create: `frontend/components/landing/scenes/CameraRig.tsx`

**Interfaces:**
- Consumes: `useScroll` from `@react-three/drei` (Task 1), `SCENE_COUNT`, `SCENE_DEPTH` from `sceneProgress.ts` (Task 5).
- Produces: `export default function CameraRig(): null;` — a component with no visual output of its own, mounted once inside `<ScrollControls>`, that moves the shared `<Canvas>` camera every frame based on the drei-damped scroll offset. Mounted by `SceneExperience.tsx` (Task 15).

- [ ] **Step 1: Write the component**

```tsx
// frontend/components/landing/scenes/CameraRig.tsx
"use client";

import { useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { useScroll } from "@react-three/drei";
import { SCENE_COUNT, SCENE_DEPTH } from "@/lib/sceneProgress";

export default function CameraRig() {
  const scroll = useScroll();
  const { camera } = useThree();
  const targetZ = useRef(0);

  useFrame(() => {
    // scroll.offset covers the whole ScrollControls range (0..1 across all
    // TOTAL_PAGES); only the first SCENE_COUNT/TOTAL_PAGES fraction of that
    // range corresponds to camera travel through the 3D scenes. Past that
    // point the camera holds at its final position while flat HTML content
    // (Pricing, CtaFooter) scrolls past in the Scroll html layer.
    const sceneFraction = Math.min(scroll.offset / (SCENE_COUNT / 7), 1);
    targetZ.current = -sceneFraction * SCENE_DEPTH * (SCENE_COUNT - 1);
    camera.position.z = 6 + targetZ.current;
    camera.lookAt(0, 0, targetZ.current);
  });

  return null;
}
```

Note: `SCENE_COUNT / 7` hardcodes the `TOTAL_PAGES` denominator (7) rather than importing `TOTAL_PAGES` to avoid a divide-by-a-differently-named-constant footgun if the two constants ever drift; since both live in the same file (`sceneProgress.ts`) and are exported together, replace this with `SCENE_COUNT / TOTAL_PAGES` (importing `TOTAL_PAGES` alongside `SCENE_COUNT`) for the actual implementation, this inline note is just explaining the intent. Write the real file using `TOTAL_PAGES` imported from `@/lib/sceneProgress`, not the literal `7`.

- [ ] **Step 2: Verify**

Run: `cd frontend && npx tsc --noEmit`
Expected: no new errors. (This component has no automated test: it's a per-frame imperative camera driver with no pure-logic surface beyond what `sceneProgress.test.ts` already covers; it's verified visually once `SceneExperience.tsx` exists, in Task 15's manual check.)

- [ ] **Step 3: Commit**

```bash
git add frontend/components/landing/scenes/CameraRig.tsx
git commit -m "feat(frontend): add scroll-driven camera rig for the scene experience"
```

---

### Task 10: Opening scene (3D)

**Files:**
- Create: `frontend/components/landing/scenes/OpeningChainScene.tsx`

**Interfaces:**
- Consumes: `ChainBlocksGroup` (Task 8), `buildChainBlocks` from `@/lib/chainData` (existing), `useScroll` (drei), `getSceneLocalProgress` from `sceneProgress.ts` (Task 5), `useReducedMotion` (existing).
- Produces: `export default function OpeningChainScene(props: { sceneIndex: number }): JSX.Element;` — mounted by `SceneExperience.tsx` (Task 15) at world position `x = 2.5` (right side, since the Opening scene's HTML headline sits on the left per the spec's asymmetric split).

- [ ] **Step 1: Write the component**

```tsx
// frontend/components/landing/scenes/OpeningChainScene.tsx
"use client";

import { useRef } from "react";
import type { Group } from "three";
import { useFrame } from "@react-three/fiber";
import { useScroll } from "@react-three/drei";
import { buildChainBlocks } from "@/lib/chainData";
import { getSceneLocalProgress, SCENE_COUNT } from "@/lib/sceneProgress";
import { useReducedMotion } from "@/lib/useReducedMotion";
import ChainBlocksGroup from "./ChainBlocksGroup";

const blocks = buildChainBlocks(6);

export default function OpeningChainScene({ sceneIndex }: { sceneIndex: number }) {
  const groupRef = useRef<Group>(null);
  const scroll = useScroll();
  const reducedMotion = useReducedMotion();

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    const local = getSceneLocalProgress(scroll.offset, SCENE_COUNT, sceneIndex);
    // Entrance: fade/scale in over the first 30% of this scene's range.
    // Exit: fade/scale out over the last 30%, per the plan's 150-200ms-equivalent
    // exit-faster-than-enter rule, expressed here as scroll-range fractions
    // since this element's visibility is scroll-driven, not time-driven.
    const enter = Math.min(local / 0.3, 1);
    const exit = local > 0.7 ? 1 - Math.min((local - 0.7) / 0.3, 1) : 1;
    const visibility = Math.min(enter, exit);
    groupRef.current.scale.setScalar(0.9 + visibility * 0.1);
    if (!reducedMotion) {
      groupRef.current.rotation.y += delta * 0.12;
    }
  });

  return (
    <group ref={groupRef} position={[2.5, 0, 0]}>
      <ChainBlocksGroup blocks={blocks} />
    </group>
  );
}
```

- [ ] **Step 2: Verify**

Run: `cd frontend && npx tsc --noEmit`
Expected: no new errors.

- [ ] **Step 3: Commit**

```bash
git add frontend/components/landing/scenes/OpeningChainScene.tsx
git commit -m "feat(frontend): add opening scene 3D chain, positioned for asymmetric hero split"
```

---

### Task 11: Problem stats scene (3D)

**Files:**
- Create: `frontend/components/landing/scenes/ProblemStatsScene.tsx`

**Interfaces:**
- Consumes: `Text` from `@react-three/drei` (Task 1), `useScroll` (drei), `getSceneLocalProgress` (Task 5), `ACCENT_TEXT`/`TEXT_ON_DARK` from `landingTheme.ts` (Task 3).
- Produces: `export default function ProblemStatsScene(props: { sceneIndex: number }): JSX.Element;`

- [ ] **Step 1: Write the component**

```tsx
// frontend/components/landing/scenes/ProblemStatsScene.tsx
"use client";

import { Text } from "@react-three/drei";
import { useScroll } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import type { Group } from "three";
import { getSceneLocalProgress, SCENE_COUNT, SCENE_DEPTH } from "@/lib/sceneProgress";
import { ACCENT_TEXT, TEXT_ON_DARK } from "@/lib/landingTheme";

const STATS = [
  { num: "€35M", start: 0.0 },
  { num: "2026", start: 0.25 },
  { num: "0", start: 0.5 },
  { num: "Art.15", start: 0.75 },
];
const STAT_SPAN = 0.25;

function statOpacity(local: number, start: number): number {
  const local0 = (local - start) / STAT_SPAN;
  if (local0 < 0 || local0 > 1) return 0;
  const enter = Math.min(local0 / 0.3, 1);
  const exit = local0 > 0.7 ? 1 - Math.min((local0 - 0.7) / 0.3, 1) : 1;
  return Math.max(0.2, Math.min(enter, exit));
}

export default function ProblemStatsScene({ sceneIndex }: { sceneIndex: number }) {
  const groupRef = useRef<Group>(null);
  const scroll = useScroll();

  useFrame(() => {
    const local = getSceneLocalProgress(scroll.offset, SCENE_COUNT, sceneIndex);
    if (groupRef.current) {
      groupRef.current.children.forEach((child, i) => {
        const opacity = statOpacity(local, STATS[i].start);
        child.traverse((node) => {
          const material = (node as unknown as { material?: { opacity: number; transparent: boolean } }).material;
          if (material) {
            material.transparent = true;
            material.opacity = opacity;
          }
        });
      });
    }
  });

  const worldZ = -sceneIndex * SCENE_DEPTH;

  return (
    <group ref={groupRef} position={[0, 0, worldZ]}>
      {STATS.map((stat, i) => (
        <Text
          key={stat.num}
          position={[0, 0.4 - i * 0.02, 0.01 * i]}
          fontSize={1.6}
          color={i === 0 ? ACCENT_TEXT : TEXT_ON_DARK}
          anchorX="center"
          anchorY="middle"
        >
          {stat.num}
        </Text>
      ))}
    </group>
  );
}
```

- [ ] **Step 2: Verify**

Run: `cd frontend && npx tsc --noEmit`
Expected: no new errors.

- [ ] **Step 3: Commit**

```bash
git add frontend/components/landing/scenes/ProblemStatsScene.tsx
git commit -m "feat(frontend): add problem-stats 3D scene with staggered number reveal"
```

---

### Task 12: Recorder scene (3D)

**Files:**
- Create: `frontend/components/landing/scenes/RecorderChainScene.tsx`

**Interfaces:**
- Consumes: `ChainBlocksGroup` (Task 8), `buildChainBlocks` (existing), `useScroll`, `getSceneLocalProgress`, `SCENE_DEPTH` (Task 5).
- Produces: `export default function RecorderChainScene(props: { sceneIndex: number }): JSX.Element;`

- [ ] **Step 1: Write the component**

```tsx
// frontend/components/landing/scenes/RecorderChainScene.tsx
"use client";

import { useRef } from "react";
import type { Group } from "three";
import { useFrame } from "@react-three/fiber";
import { useScroll } from "@react-three/drei";
import { buildChainBlocks } from "@/lib/chainData";
import { getSceneLocalProgress, SCENE_COUNT, SCENE_DEPTH } from "@/lib/sceneProgress";
import ChainBlocksGroup from "./ChainBlocksGroup";

const blocks = buildChainBlocks(12);

export default function RecorderChainScene({ sceneIndex }: { sceneIndex: number }) {
  const groupRef = useRef<Group>(null);
  const scroll = useScroll();
  const worldZ = -sceneIndex * SCENE_DEPTH;

  useFrame(() => {
    if (!groupRef.current) return;
    const local = getSceneLocalProgress(scroll.offset, SCENE_COUNT, sceneIndex);
    // Camera travels ALONGSIDE this chain (per the spec): translate the
    // whole group's X as local progress advances, rather than rotating it,
    // so it reads as "the camera moves along the chain."
    groupRef.current.position.x = -6 + local * 6;
    const enter = Math.min(local / 0.25, 1);
    const exit = local > 0.75 ? 1 - Math.min((local - 0.75) / 0.25, 1) : 1;
    groupRef.current.scale.setScalar(Math.max(0.2, Math.min(enter, exit)));
  });

  return (
    <group ref={groupRef} position={[0, 0, worldZ]}>
      <ChainBlocksGroup blocks={blocks} centerX={0} />
    </group>
  );
}
```

- [ ] **Step 2: Verify**

Run: `cd frontend && npx tsc --noEmit`
Expected: no new errors.

- [ ] **Step 3: Commit**

```bash
git add frontend/components/landing/scenes/RecorderChainScene.tsx
git commit -m "feat(frontend): add recorder 3D scene with an extended traveling chain"
```

---

### Task 13: Tribunal scene (3D)

**Files:**
- Create: `frontend/components/landing/scenes/TribunalScene.tsx`

**Interfaces:**
- Consumes: `useScroll`, `getSceneLocalProgress`, `SCENE_DEPTH` (Task 5), `ACCENT_FILL`/`DARK_SURFACE` (Task 3).
- Produces: `export default function TribunalScene(props: { sceneIndex: number }): JSX.Element;`

- [ ] **Step 1: Write the component**

```tsx
// frontend/components/landing/scenes/TribunalScene.tsx
"use client";

import { useRef } from "react";
import type { Group, Mesh, MeshStandardMaterial } from "three";
import { useFrame } from "@react-three/fiber";
import { useScroll } from "@react-three/drei";
import { getSceneLocalProgress, SCENE_COUNT, SCENE_DEPTH } from "@/lib/sceneProgress";
import { ACCENT_FILL, DARK_SURFACE } from "@/lib/landingTheme";

const NODE_COUNT = 6;
const NODE_POSITIONS: Array<[number, number, number]> = Array.from({ length: NODE_COUNT }, (_, i) => {
  const angle = (i / NODE_COUNT) * Math.PI * 2;
  return [Math.cos(angle) * 2, Math.sin(angle) * 1.2, 0];
});

export default function TribunalScene({ sceneIndex }: { sceneIndex: number }) {
  const groupRef = useRef<Group>(null);
  const meshRefs = useRef<Array<Mesh | null>>([]);
  const scroll = useScroll();
  const worldZ = -sceneIndex * SCENE_DEPTH;

  useFrame(() => {
    const local = getSceneLocalProgress(scroll.offset, SCENE_COUNT, sceneIndex);
    // Staggered reveal: each node flips from neutral to accent color one
    // at a time as local progress advances, not all simultaneously.
    meshRefs.current.forEach((mesh, i) => {
      if (!mesh) return;
      const nodeThreshold = (i + 1) / (NODE_COUNT + 1);
      const material = mesh.material as MeshStandardMaterial;
      const isFlagged = local > nodeThreshold;
      material.color.set(isFlagged ? ACCENT_FILL : DARK_SURFACE);
      material.emissiveIntensity = isFlagged ? 0.3 : 0;
    });
  });

  return (
    <group ref={groupRef} position={[0, 0, worldZ]}>
      {NODE_POSITIONS.map((pos, i) => (
        <mesh key={i} position={pos} ref={(el) => { meshRefs.current[i] = el; }}>
          <sphereGeometry args={[0.35, 24, 24]} />
          <meshStandardMaterial color={DARK_SURFACE} emissive={ACCENT_FILL} emissiveIntensity={0} roughness={0.4} />
        </mesh>
      ))}
    </group>
  );
}
```

- [ ] **Step 2: Verify**

Run: `cd frontend && npx tsc --noEmit`
Expected: no new errors.

- [ ] **Step 3: Commit**

```bash
git add frontend/components/landing/scenes/TribunalScene.tsx
git commit -m "feat(frontend): add tribunal 3D scene with staggered verdict-node reveal"
```

---

### Task 14: Evidence pack scene (3D, pinned)

**Files:**
- Create: `frontend/components/landing/scenes/EvidencePackScene.tsx`

**Interfaces:**
- Consumes: `useScroll`, `getSceneLocalProgress`, `SCENE_DEPTH`, `PIN_FRACTION` (Task 5), `DARK_SURFACE`/`ACCENT_FILL` (Task 3).
- Produces: `export default function EvidencePackScene(props: { sceneIndex: number }): JSX.Element;`

- [ ] **Step 1: Write the component**

```tsx
// frontend/components/landing/scenes/EvidencePackScene.tsx
"use client";

import { useRef } from "react";
import type { Mesh, MeshStandardMaterial } from "three";
import { useFrame } from "@react-three/fiber";
import { useScroll } from "@react-three/drei";
import { getSceneLocalProgress, SCENE_COUNT, SCENE_DEPTH, PIN_FRACTION } from "@/lib/sceneProgress";
import { DARK_SURFACE, ACCENT_FILL } from "@/lib/landingTheme";

export default function EvidencePackScene({ sceneIndex }: { sceneIndex: number }) {
  const meshRef = useRef<Mesh>(null);
  const scroll = useScroll();
  const worldZ = -sceneIndex * SCENE_DEPTH;

  useFrame(() => {
    if (!meshRef.current) return;
    const local = getSceneLocalProgress(scroll.offset, SCENE_COUNT, sceneIndex);
    // Assembly happens over the first (1 - PIN_FRACTION) of the scene's range;
    // the remaining PIN_FRACTION is the pinned hold, during which the plane
    // stays fully assembled and lit rather than continuing to animate, giving
    // the "camera holds while the report finishes appearing" pause the plan
    // calls for (the actual scroll-position hold is implemented by
    // SceneExperience's HTML section height for this scene, this component
    // only needs to stop animating once assembly completes).
    const assemblyEnd = 1 - PIN_FRACTION;
    const assembly = Math.min(local / assemblyEnd, 1);
    meshRef.current.scale.set(1, assembly, 1);
    const material = meshRef.current.material as MeshStandardMaterial;
    material.emissiveIntensity = 0.15 + assembly * 0.2;
  });

  return (
    <group position={[0, 0, worldZ]}>
      <mesh ref={meshRef} rotation={[-Math.PI / 2.5, 0, 0]}>
        <planeGeometry args={[2.4, 3.2]} />
        <meshStandardMaterial color={DARK_SURFACE} emissive={ACCENT_FILL} emissiveIntensity={0.15} roughness={0.5} side={2} />
      </mesh>
    </group>
  );
}
```

- [ ] **Step 2: Verify**

Run: `cd frontend && npx tsc --noEmit`
Expected: no new errors.

- [ ] **Step 3: Commit**

```bash
git add frontend/components/landing/scenes/EvidencePackScene.tsx
git commit -m "feat(frontend): add evidence-pack 3D scene with pinned assembly"
```

---

### Task 15: Scene experience (full desktop 3D path)

**Files:**
- Create: `frontend/components/landing/SceneExperience.tsx`

**Interfaces:**
- Consumes: `Canvas` (`@react-three/fiber`), `ScrollControls`/`Scroll` (`@react-three/drei`, Task 1), `CameraRig` (Task 9), all five scene components (Tasks 10-14), `LandingInteractionStyles` (Task 7), `PricingZigzag` (Task 18), `Cta`/`Footer` (Tasks 19-20), `DARK_BG`/`TEXT_ON_DARK`/`ACCENT_FILL` (Task 3), `landingFont` (Task 6), `SCENE_COUNT`/`TOTAL_PAGES` (Task 5).
- Produces: `export default function SceneExperience(): JSX.Element;` — consumed by `SceneGate.tsx` (Task 17).

- [ ] **Step 1: Write the component**

```tsx
// frontend/components/landing/SceneExperience.tsx
"use client";

import { Canvas } from "@react-three/fiber";
import { ScrollControls, Scroll } from "@react-three/drei";
import CameraRig from "./scenes/CameraRig";
import OpeningChainScene from "./scenes/OpeningChainScene";
import ProblemStatsScene from "./scenes/ProblemStatsScene";
import RecorderChainScene from "./scenes/RecorderChainScene";
import TribunalScene from "./scenes/TribunalScene";
import EvidencePackScene from "./scenes/EvidencePackScene";
import LandingInteractionStyles from "./dark/LandingInteractionStyles";
import PricingZigzag from "./PricingZigzag";
import Cta from "./Cta";
import Footer from "./Footer";
import { TOTAL_PAGES } from "@/lib/sceneProgress";
import { DARK_BG, TEXT_ON_DARK, ACCENT_FILL, ACCENT_TEXT } from "@/lib/landingTheme";
import { landingFont } from "@/lib/landingFont";

const sceneTextStyle: React.CSSProperties = {
  minHeight: "100dvh",
  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
  padding: "0 2rem",
  maxWidth: 1400,
  margin: "0 auto",
};

export default function SceneExperience() {
  return (
    <div className={landingFont.className} style={{ background: DARK_BG, color: TEXT_ON_DARK }}>
      <LandingInteractionStyles />
      <div style={{ height: "100dvh", position: "sticky", top: 0 }}>
        <Canvas
          camera={{ position: [0, 0, 6], fov: 45 }}
          dpr={[1, 1.5]}
          gl={{ antialias: true, alpha: true }}
          aria-label="An animated sequence of 3D scenes visualizing BLACKBOX's hash-chain recorder, compliance tribunal, and evidence pack, synchronized to page scroll"
        >
          <ambientLight intensity={0.5} />
          <directionalLight position={[3, 4, 5]} intensity={0.8} />
          <ScrollControls pages={TOTAL_PAGES} damping={0.2}>
            <CameraRig />
            <OpeningChainScene sceneIndex={0} />
            <ProblemStatsScene sceneIndex={1} />
            <RecorderChainScene sceneIndex={2} />
            <TribunalScene sceneIndex={3} />
            <EvidencePackScene sceneIndex={4} />

            <Scroll html style={{ width: "100%" }}>
              <section id="opening" style={{ ...sceneTextStyle, maxWidth: 600 }}>
                <div style={{
                  display: "inline-flex", alignItems: "center", width: "fit-content",
                  border: "1px solid #2a2723", borderRadius: 4,
                  padding: ".3rem .75rem", marginBottom: "1.6rem",
                  fontSize: ".78rem", fontWeight: 700, letterSpacing: ".07em", textTransform: "uppercase",
                  color: ACCENT_TEXT,
                }}>
                  EU AI Act &middot; Art. 10 / 12 / 14 / 15
                </div>
                <h1 style={{ fontSize: "clamp(2.6rem, 6vw, 4.2rem)", fontWeight: 900, letterSpacing: "-.03em", lineHeight: 1.05, marginBottom: "1.2rem" }}>
                  Prove what your <span style={{ color: ACCENT_TEXT }}>AI agents</span> did.
                </h1>
                <p style={{ fontSize: "1.1rem", color: "#a89c8e", lineHeight: 1.55, marginBottom: "2rem" }}>
                  A flight recorder and autonomous compliance tribunal for AI agents. Tamper-evident logs, regulator-ready evidence packs.
                </p>
                <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
                  <a href="/login" className="landing-btn" style={{
                    display: "inline-flex", alignItems: "center", padding: ".75rem 1.6rem",
                    borderRadius: 8, fontSize: ".95rem", fontWeight: 600,
                    background: ACCENT_FILL, color: "#fff", textDecoration: "none",
                  }}>
                    Get started free
                  </a>
                  <a href="https://github.com/iWeslax83/blackbox-agent-accountability" target="_blank" rel="noopener" className="landing-btn landing-link" style={{
                    display: "inline-flex", alignItems: "center", padding: ".75rem 1.6rem",
                    borderRadius: 8, fontSize: ".95rem", fontWeight: 600,
                    background: "transparent", color: TEXT_ON_DARK, border: "1.5px solid #2a2723", textDecoration: "none",
                  }}>
                    View on GitHub
                  </a>
                </div>
              </section>

              <section id="problem" style={{ ...sceneTextStyle, textAlign: "center", alignItems: "center" }}>
                <h2 style={{ fontSize: "clamp(1.8rem, 4vw, 2.6rem)", fontWeight: 800, letterSpacing: "-.02em", lineHeight: 1.1, marginBottom: "1rem", maxWidth: 700 }}>
                  The EU AI Act is already in force. Your logs are not evidence.
                </h2>
                <p style={{ fontSize: "1.05rem", color: "#a89c8e", maxWidth: 560 }}>
                  Mandatory logging and traceability requirements are enforceable now. Generic observability tools show traces for debugging, not adjudication.
                </p>
              </section>

              <section id="recorder" style={{ ...sceneTextStyle, alignItems: "flex-end", textAlign: "right" }}>
                <h2 style={{ fontSize: "clamp(1.8rem, 4vw, 2.6rem)", fontWeight: 800, letterSpacing: "-.02em", marginBottom: "1rem", maxWidth: 520 }}>
                  Every action, chained.
                </h2>
                <p style={{ fontSize: "1.05rem", color: "#a89c8e", maxWidth: 480 }}>
                  Every agent action is appended to a SHA-256 hash-chained log. A silent edit breaks the chain immediately.
                </p>
              </section>

              <section id="tribunal" style={sceneTextStyle}>
                <h2 style={{ fontSize: "clamp(1.8rem, 4vw, 2.6rem)", fontWeight: 800, letterSpacing: "-.02em", marginBottom: "1rem", maxWidth: 520 }}>
                  A multi-agent panel, flagging violations.
                </h2>
                <p style={{ fontSize: "1.05rem", color: "#a89c8e", maxWidth: 480 }}>
                  An autonomous tribunal audits the full log against a structured EU AI Act policy pack, citing evidence and confidence for every flag.
                </p>
              </section>

              <section id="evidence-pack" style={{ ...sceneTextStyle, textAlign: "center", alignItems: "center", minHeight: "150dvh" }}>
                <h2 style={{ fontSize: "clamp(1.8rem, 4vw, 2.6rem)", fontWeight: 800, letterSpacing: "-.02em", marginBottom: "1rem", maxWidth: 560 }}>
                  One click. A regulator-ready evidence pack.
                </h2>
                <p style={{ fontSize: "1.05rem", color: "#a89c8e", maxWidth: 480 }}>
                  Incident summary, violation table, full action log, and chain-integrity status, formatted for regulators.
                </p>
              </section>

              <section id="pricing" style={{ padding: "6rem 2rem", maxWidth: 1400, margin: "0 auto" }}>
                <PricingZigzag />
              </section>

              <section id="cta-footer" style={{ maxWidth: 1400, margin: "0 auto" }}>
                <Cta />
                <Footer />
              </section>
            </Scroll>
          </ScrollControls>
        </Canvas>
      </div>
    </div>
  );
}
```

Note the Evidence Pack section's `minHeight: "150dvh"`: this is what implements the spec's pinned hold at the HTML-layout level (a taller section means more scroll distance elapses at effectively the same visual scene, giving the pause), matched to `PIN_FRACTION` conceptually but not driven by it programmatically here since page height is a static value and `PIN_FRACTION` only governs the 3D component's own internal assembly-vs-hold timing (Task 14). Keep both in mind together when tuning during manual verification: if the pin doesn't feel long enough or feels too long, adjust the `150dvh` value here, not `PIN_FRACTION`.

- [ ] **Step 2: Verify TypeScript and a dev-server smoke check**

Run: `cd frontend && npx tsc --noEmit`
Expected: no new errors.

Run: `npm run dev`, visit `http://localhost:3000/` in a browser (Chromium only, `chromium.launch()` if using Playwright, since `SceneGate` doesn't exist yet you'll need to temporarily mount `<SceneExperience />` directly in a scratch route or temporarily swap it into `app/page.tsx` for this check, then revert `app/page.tsx` before committing since Task 22 does that properly). Confirm: the canvas renders, scrolling moves through all five scenes with visible content changes, the Pricing/CtaFooter flat sections appear after scene 5, no console errors.

- [ ] **Step 3: Commit**

```bash
git add frontend/components/landing/SceneExperience.tsx
git commit -m "feat(frontend): assemble the full scroll-scrubbed scene experience"
```

---

### Task 16: Static fallback experience

**Files:**
- Create: `frontend/components/landing/SceneExperienceStatic.tsx`

**Interfaces:**
- Consumes: `HashChainStatic` (existing, unchanged), `PricingZigzag` (Task 18), `Cta`/`Footer` (Tasks 19-20), `StickyMobileCta` (Task 21), `landingFont` (Task 6), `landingTheme` colors (Task 3).
- Produces: `export default function SceneExperienceStatic(): JSX.Element;` — server-renderable (no client hooks needed beyond the `IntersectionObserver` cross-fade, which is isolated into its own small client wrapper within this file). Consumed by `SceneGate.tsx` (Task 17).

- [ ] **Step 1: Write a small client cross-fade wrapper inline in the same file**

```tsx
// frontend/components/landing/SceneExperienceStatic.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import HashChainStatic from "./HashChainStatic";
import PricingZigzag from "./PricingZigzag";
import Cta from "./Cta";
import Footer from "./Footer";
import StickyMobileCta from "./StickyMobileCta";
import LandingInteractionStyles from "./dark/LandingInteractionStyles";
import { DARK_BG, TEXT_ON_DARK, ACCENT_FILL, ACCENT_TEXT } from "@/lib/landingTheme";
import { landingFont } from "@/lib/landingFont";

function FadeInSection({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setVisible(true);
      },
      { threshold: 0.2 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      style={{
        opacity: visible ? 1 : 0,
        transition: "opacity 250ms ease-out",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export default function SceneExperienceStatic() {
  return (
    <main className={landingFont.className} style={{ background: DARK_BG, color: TEXT_ON_DARK, lineHeight: 1.6 }}>
      <LandingInteractionStyles />

      <FadeInSection style={{ minHeight: "100dvh", display: "flex", flexDirection: "column", justifyContent: "center", padding: "0 1.5rem" }}>
        <div style={{
          display: "inline-flex", alignItems: "center", width: "fit-content",
          border: "1px solid #2a2723", borderRadius: 4,
          padding: ".3rem .75rem", marginBottom: "1.4rem",
          fontSize: ".75rem", fontWeight: 700, letterSpacing: ".07em", textTransform: "uppercase",
          color: ACCENT_TEXT,
        }}>
          EU AI Act &middot; Art. 10 / 12 / 14 / 15
        </div>
        <h1 style={{ fontSize: "clamp(2.2rem, 8vw, 2.8rem)", fontWeight: 900, letterSpacing: "-.03em", lineHeight: 1.08, marginBottom: "1rem" }}>
          Prove what your <span style={{ color: ACCENT_TEXT }}>AI agents</span> did.
        </h1>
        <p style={{ fontSize: "1rem", color: "#a89c8e", lineHeight: 1.55, marginBottom: "1.5rem" }}>
          A flight recorder and autonomous compliance tribunal for AI agents. Tamper-evident logs, regulator-ready evidence packs.
        </p>
        <div style={{ display: "flex", gap: ".75rem", flexWrap: "wrap", marginBottom: "2rem" }}>
          <a href="/login" className="landing-btn" style={{
            display: "inline-flex", alignItems: "center", padding: ".75rem 1.4rem",
            borderRadius: 8, fontSize: ".9rem", fontWeight: 600,
            background: ACCENT_FILL, color: "#fff", textDecoration: "none",
          }}>
            Get started free
          </a>
          <a href="https://github.com/iWeslax83/blackbox-agent-accountability" target="_blank" rel="noopener" className="landing-btn landing-link" style={{
            display: "inline-flex", alignItems: "center", padding: ".75rem 1.4rem",
            borderRadius: 8, fontSize: ".9rem", fontWeight: 600,
            background: "transparent", color: TEXT_ON_DARK, border: "1.5px solid #2a2723", textDecoration: "none",
          }}>
            View on GitHub
          </a>
        </div>
        <HashChainStatic />
      </FadeInSection>

      <FadeInSection style={{ padding: "4rem 1.5rem", textAlign: "center" }}>
        <h2 style={{ fontSize: "1.8rem", fontWeight: 800, letterSpacing: "-.02em", lineHeight: 1.15, marginBottom: "1rem" }}>
          The EU AI Act is already in force. Your logs are not evidence.
        </h2>
        <p style={{ fontSize: ".95rem", color: "#a89c8e" }}>
          Mandatory logging and traceability requirements are enforceable now. Generic observability tools show traces for debugging, not adjudication.
        </p>
      </FadeInSection>

      <FadeInSection style={{ padding: "4rem 1.5rem" }}>
        <h2 style={{ fontSize: "1.8rem", fontWeight: 800, letterSpacing: "-.02em", marginBottom: "1rem" }}>
          Every action, chained. A multi-agent panel, flagging violations.
        </h2>
        <p style={{ fontSize: ".95rem", color: "#a89c8e" }}>
          Every agent action is appended to a SHA-256 hash-chained log. An autonomous tribunal audits the full log against a structured EU AI Act policy pack.
        </p>
      </FadeInSection>

      <FadeInSection style={{ padding: "4rem 1.5rem" }}>
        <h2 style={{ fontSize: "1.8rem", fontWeight: 800, letterSpacing: "-.02em", marginBottom: "1rem" }}>
          One click. A regulator-ready evidence pack.
        </h2>
        <p style={{ fontSize: ".95rem", color: "#a89c8e" }}>
          Incident summary, violation table, full action log, and chain-integrity status, formatted for regulators.
        </p>
      </FadeInSection>

      <FadeInSection style={{ padding: "4rem 1.5rem" }}>
        <PricingZigzag />
      </FadeInSection>

      <Cta />
      <Footer />
      <StickyMobileCta />
    </main>
  );
}
```

- [ ] **Step 2: Verify**

Run: `cd frontend && npx tsc --noEmit`
Expected: no new errors.

- [ ] **Step 3: Commit**

```bash
git add frontend/components/landing/SceneExperienceStatic.tsx
git commit -m "feat(frontend): add reduced-motion/mobile fallback with cross-fade sections"
```

---

### Task 17: Capability gate

**Files:**
- Create: `frontend/components/landing/SceneGate.tsx`

**Interfaces:**
- Consumes: `useClientSnapshot` (Task 4), `useReducedMotion` (existing), `dynamic` from `next/dynamic`, `SceneExperienceStatic` (Task 16).
- Produces: `export default function SceneGate(): JSX.Element;` — consumed by `app/page.tsx` (Task 22).

- [ ] **Step 1: Write the component**

```tsx
// frontend/components/landing/SceneGate.tsx
"use client";

import dynamic from "next/dynamic";
import { useClientSnapshot } from "@/lib/useClientSnapshot";
import { useReducedMotion } from "@/lib/useReducedMotion";
import SceneExperienceStatic from "./SceneExperienceStatic";
import { DARK_BG } from "@/lib/landingTheme";

const SceneExperience = dynamic(() => import("./SceneExperience"), {
  ssr: false,
  loading: () => <SceneSkeleton />,
});

function SceneSkeleton() {
  return <div style={{ minHeight: "100dvh", background: DARK_BG }} />;
}

let cachedWebglSupported: boolean | null = null;

function supportsWebGL(): boolean {
  if (cachedWebglSupported !== null) return cachedWebglSupported;
  try {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
    cachedWebglSupported = !!ctx;
    if (ctx && "getExtension" in ctx) {
      (ctx as WebGLRenderingContext).getExtension("WEBGL_lose_context")?.loseContext();
    }
  } catch {
    cachedWebglSupported = false;
  }
  return cachedWebglSupported;
}

export default function SceneGate() {
  const reducedMotion = useReducedMotion();
  const mounted = useClientSnapshot(() => true, false);
  const webglSupported = useClientSnapshot(() => supportsWebGL(), false);
  const wideViewport = useClientSnapshot(() => window.innerWidth >= 768, false);

  if (!mounted) {
    return <SceneExperienceStatic />;
  }

  const use3D = !reducedMotion && wideViewport && webglSupported;

  return use3D ? <SceneExperience /> : <SceneExperienceStatic />;
}
```

Note this mirrors `HeroChain.tsx`'s proven gating shape (server/pre-mount renders the static path directly, per the prior plan's final-review fix, rather than an empty skeleton, so SSR output is always meaningful content) but scoped to the whole page instead of one hero element, and does not wrap the 3D path in an error boundary that falls back to `SceneExperienceStatic` mid-render the way `HeroChain` did for its smaller scene, because `SceneExperience` is the entire page's content: if it threw after `SceneExperienceStatic` had already been swapped out, an error boundary here would need to re-render the *entire* static page, including re-running the whole cross-fade-observer lifecycle from scratch, which is a materially different (and heavier) recovery than `HeroChain`'s original small-canvas case. This is a known, accepted trade-off, not an oversight, record it as such in your task report rather than silently adding an error boundary that changes this behavior without discussion.

- [ ] **Step 2: Verify**

Run: `cd frontend && npx tsc --noEmit`
Expected: no new errors.

- [ ] **Step 3: Commit**

```bash
git add frontend/components/landing/SceneGate.tsx
git commit -m "feat(frontend): add capability gate choosing the 3D or static landing experience"
```

---

### Task 18: Zig-zag pricing

**Files:**
- Create: `frontend/components/landing/PricingZigzag.tsx`

**Interfaces:**
- Produces: `export default function PricingZigzag(): JSX.Element;` — consumed by `SceneExperience.tsx` (Task 15) and `SceneExperienceStatic.tsx` (Task 16).

- [ ] **Step 1: Write the component**

Port the three pricing tiers' content from the now-superseded `Pricing.tsx` (read it first for the exact feature-list copy per tier before writing this file, to carry the copy over unchanged in substance per the spec), restyled for dark theme and laid out as an asymmetric zig-zag instead of three equal-width cards:

```tsx
// frontend/components/landing/PricingZigzag.tsx
import { DARK_SURFACE, BORDER_ON_DARK, ACCENT_FILL, ACCENT_TEXT, TEXT_ON_DARK } from "@/lib/landingTheme";

function Tier({
  eyebrow, price, priceSuffix, description, features, ctaLabel, ctaHref, emphasized, align,
}: {
  eyebrow: string; price: string; priceSuffix?: string; description: string;
  features: string[]; ctaLabel: string; ctaHref: string; emphasized?: boolean;
  align: "left" | "right";
}) {
  return (
    <div style={{
      maxWidth: 460,
      marginLeft: align === "right" ? "auto" : 0,
      marginRight: align === "left" ? "auto" : 0,
      background: DARK_SURFACE,
      border: `1px solid ${emphasized ? ACCENT_FILL : BORDER_ON_DARK}`,
      borderRadius: 12,
      padding: "2rem",
      marginBottom: "3rem",
    }}>
      <div style={{ fontSize: ".78rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".07em", color: "#a89c8e", marginBottom: ".5rem" }}>
        {eyebrow}
      </div>
      <div style={{ fontSize: "2.4rem", fontWeight: 900, letterSpacing: "-.03em", color: TEXT_ON_DARK }}>
        {price}
        {priceSuffix && <sub style={{ fontSize: "1rem", fontWeight: 500, color: "#a89c8e" }}>{priceSuffix}</sub>}
      </div>
      <p style={{ fontSize: ".9rem", color: "#a89c8e", margin: ".6rem 0 1.4rem" }}>{description}</p>
      <ul style={{ listStyle: "none", padding: 0, marginBottom: "1.6rem" }}>
        {features.map((f) => (
          <li key={f} style={{ fontSize: ".875rem", padding: ".35rem 0", borderBottom: `1px solid ${BORDER_ON_DARK}`, display: "flex", gap: ".5rem", color: TEXT_ON_DARK }}>
            <span style={{ color: ACCENT_TEXT, fontWeight: 700 }}>&#10003;</span>{f}
          </li>
        ))}
      </ul>
      <a href={ctaHref} target={ctaHref.startsWith("http") ? "_blank" : undefined} rel={ctaHref.startsWith("http") ? "noopener" : undefined} className="landing-btn" style={{
        display: "block", textAlign: "center", padding: ".7rem 1rem", borderRadius: 7,
        fontSize: ".9rem", fontWeight: 600, textDecoration: "none",
        background: emphasized ? ACCENT_FILL : "transparent",
        color: emphasized ? "#fff" : TEXT_ON_DARK,
        border: emphasized ? "none" : `1.5px solid ${BORDER_ON_DARK}`,
      }}>
        {ctaLabel}
      </a>
    </div>
  );
}

export default function PricingZigzag() {
  return (
    <div>
      <div style={{ fontSize: ".78rem", fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", color: ACCENT_TEXT, marginBottom: ".6rem" }}>
        Pricing
      </div>
      <h2 style={{ fontSize: "2rem", fontWeight: 800, letterSpacing: "-.02em", marginBottom: "2.5rem", color: TEXT_ON_DARK }}>
        Start free. Scale with confidence.
      </h2>

      <Tier
        align="left"
        eyebrow="Free / Open Source"
        price="$0"
        description="Self-host on your own infrastructure. MIT licensed."
        features={["Unlimited agents (self-hosted)", "SHA-256 hash-chained recorder", "EU AI Act policy pack (YAML)", "Tribunal audit CLI", "Evidence pack export (HTML)", "Community support (GitHub)"]}
        ctaLabel="View on GitHub"
        ctaHref="https://github.com/iWeslax83/blackbox-agent-accountability"
      />
      <Tier
        align="right"
        emphasized
        eyebrow="Pro"
        price="$49"
        priceSuffix="/mo"
        description="Managed cloud. Everything you need for a production AI team."
        features={["Up to 10 agents managed", "Hosted dashboard and real-time log", "Automated tribunal runs on schedule", "PDF + HTML evidence pack exports", "Custom policy rules", "Priority email support"]}
        ctaLabel="Get started free"
        ctaHref="/login"
      />
      <Tier
        align="left"
        eyebrow="Enterprise"
        price="Custom"
        description="For regulated industries, large deployments, on-prem needs."
        features={["Unlimited agents", "SSO / SAML integration", "On-premises deployment", "Custom policy packs and mapping", "Dedicated SLA and support", "Regulator liaison assistance"]}
        ctaLabel="Contact us"
        ctaHref="/login"
      />
    </div>
  );
}
```

- [ ] **Step 2: Verify**

Run: `cd frontend && npx tsc --noEmit`
Expected: no new errors.

- [ ] **Step 3: Commit**

```bash
git add frontend/components/landing/PricingZigzag.tsx
git commit -m "feat(frontend): add asymmetric zig-zag pricing, replacing the 3-card row"
```

---

### Task 19: Footer dark restyle

**Files:**
- Modify: `frontend/components/landing/Footer.tsx`

**Interfaces:**
- Consumes: `DARK_BG`/`TEXT_ON_DARK`/`ACCENT_TEXT`/`BORDER_ON_DARK` from `landingTheme.ts` (Task 3).

- [ ] **Step 1: Read the current file, then restyle**

Read `frontend/components/landing/Footer.tsx` in full first (it currently uses `#1a1714` background, close to but not the exact new `DARK_BG` token). Replace hardcoded colors with `landingTheme` imports, keeping the exact copy, links, and structure unchanged:

```tsx
// frontend/components/landing/Footer.tsx
import { DARK_BG, TEXT_ON_DARK, ACCENT_TEXT } from "@/lib/landingTheme";

export default function Footer() {
  return (
    <footer style={{ background: DARK_BG, color: "#a89c8e", padding: "2rem", textAlign: "center", fontSize: ".83rem", borderTop: "1px solid #2a2723" }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: ".5rem" }}>
        <div><strong style={{ color: TEXT_ON_DARK }}>BLACKBOX</strong>: AI Agent Accountability and Compliance</div>
        <div>
          <a href="https://github.com/iWeslax83/blackbox-agent-accountability" target="_blank" rel="noopener" className="landing-link" style={{ color: "#a89c8e", textDecoration: "none" }}>GitHub</a>
          &nbsp;&middot;&nbsp; MIT licensed &nbsp;&middot;&nbsp;
          <a href="/login" className="landing-link" style={{ color: "#a89c8e", textDecoration: "none" }}>Dashboard</a>
          &nbsp;&middot;&nbsp;
          <a href="/privacy" className="landing-link" style={{ color: "#a89c8e", textDecoration: "none" }}>Privacy</a>
          &nbsp;&middot;&nbsp;
          <a href="/terms" className="landing-link" style={{ color: "#a89c8e", textDecoration: "none" }}>Terms</a>
        </div>
        <div style={{ fontSize: ".78rem", color: "#6b6258" }}>
          Bursa, T&uuml;rkiye
        </div>
        <div style={{ fontSize: ".78rem", color: "#6b6258" }}>
          Not legal advice. BLACKBOX is a technical tool, consult qualified counsel for regulatory guidance.
        </div>
      </div>
    </footer>
  );
}
```

Preserve whatever the actual current file's exact link set is (Privacy/Terms links and the Bursa line were added by a prior plan; read the real current file and keep all of that content, only changing colors and adding `landing-link` classes for focus-visible support).

- [ ] **Step 2: Verify**

Run: `cd frontend && npx tsc --noEmit`
Expected: no new errors.

- [ ] **Step 3: Commit**

```bash
git add frontend/components/landing/Footer.tsx
git commit -m "refactor(frontend): restyle footer for the dark landing theme"
```

---

### Task 20: Cta dark restyle

**Files:**
- Modify: `frontend/components/landing/Cta.tsx`

- [ ] **Step 1: Read the current file, then restyle**

Read `frontend/components/landing/Cta.tsx` in full, then apply the same treatment as Task 19: replace hardcoded light-theme colors with `landingTheme` imports and `className="landing-btn"` on its CTA button, keep all copy and structure unchanged otherwise.

- [ ] **Step 2: Verify**

Run: `cd frontend && npx tsc --noEmit`
Expected: no new errors.

- [ ] **Step 3: Commit**

```bash
git add frontend/components/landing/Cta.tsx
git commit -m "refactor(frontend): restyle CTA section for the dark landing theme"
```

---

### Task 21: StickyMobileCta dark restyle

**Files:**
- Modify: `frontend/components/landing/StickyMobileCta.tsx`

- [ ] **Step 1: Read the current file, then restyle**

Read `frontend/components/landing/StickyMobileCta.tsx` in full (it's only used on the static/mobile fallback path from here on, per Task 16 and 17, since the full desktop 3D path doesn't render on narrow viewports at all). Replace its light-theme background (`#f4efe6`) and border with the dark equivalents from `landingTheme.ts`, add `className="landing-btn"` to its CTA link, keep the `@media (max-width: 767px)` visibility logic and `env(safe-area-inset-bottom)` padding unchanged.

- [ ] **Step 2: Verify**

Run: `cd frontend && npx tsc --noEmit`
Expected: no new errors.

- [ ] **Step 3: Commit**

```bash
git add frontend/components/landing/StickyMobileCta.tsx
git commit -m "refactor(frontend): restyle sticky mobile CTA for the dark landing theme"
```

---

### Task 22: Reassemble page.tsx, delete superseded components

**Files:**
- Modify: `frontend/app/page.tsx`
- Delete: `frontend/components/landing/Hero.tsx`, `frontend/components/landing/HeroChain.tsx`, `frontend/components/landing/HashChainScene.tsx`, `frontend/components/landing/Problem.tsx`, `frontend/components/landing/HowItWorks.tsx`, `frontend/components/landing/Pricing.tsx`

**Interfaces:**
- Consumes: `SceneGate` (Task 17), `landingTheme` colors (Task 3), `landingFont` (Task 6).

- [ ] **Step 1: Confirm the six files to delete are genuinely unused after this task's edit**

This step must run AFTER Step 2's rewrite, not before (the files are still referenced by the current `page.tsx` until it's rewritten). Do Step 2 first, then come back and run:

```bash
cd frontend && grep -rln "from \"@/components/landing/Hero\"\|from \"./Hero\"\|from \"@/components/landing/HeroChain\"\|from \"./HeroChain\"\|from \"@/components/landing/HashChainScene\"\|from \"./HashChainScene\"\|from \"@/components/landing/Problem\"\|from \"./Problem\"\|from \"@/components/landing/HowItWorks\"\|from \"./HowItWorks\"\|from \"@/components/landing/Pricing\"\|from \"./Pricing\"" app components lib
```

Expected: no output (all six are unreferenced once `page.tsx` no longer imports them). If any reference remains, do not delete that specific file, report it instead.

- [ ] **Step 2: Rewrite `app/page.tsx`**

```tsx
// frontend/app/page.tsx
import type { Metadata } from "next";
import SceneGate from "@/components/landing/SceneGate";
import { DARK_BG, TEXT_ON_DARK, ACCENT_FILL } from "@/lib/landingTheme";
import { landingFont } from "@/lib/landingFont";

export const metadata: Metadata = {
  title: "BLACKBOX: AI Agent Accountability",
  description: "Tamper-evident flight recorder and autonomous compliance tribunal for AI agents. Prove what your AI agents did, before a regulator asks.",
};

export default function Landing() {
  return (
    <div className={landingFont.className}>
      <nav style={{
        position: "sticky", top: 0, zIndex: 100,
        background: DARK_BG,
        borderBottom: "1px solid #2a2723",
        padding: "0 2rem",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        height: 58,
      }}>
        <a href="#opening" className="landing-link" style={{ fontSize: "1.15rem", fontWeight: 700, letterSpacing: "-.01em", color: TEXT_ON_DARK, textDecoration: "none" }}>
          BLACKBOX
        </a>
        <ul style={{ display: "flex", alignItems: "center", gap: "1.6rem", listStyle: "none", margin: 0, padding: 0 }}>
          <li><a href="#recorder" className="landing-link" style={{ color: TEXT_ON_DARK, fontSize: ".9rem", fontWeight: 500, textDecoration: "none" }}>How it works</a></li>
          <li><a href="#pricing" className="landing-link" style={{ color: TEXT_ON_DARK, fontSize: ".9rem", fontWeight: 500, textDecoration: "none" }}>Pricing</a></li>
          <li>
            <a href="/login" className="landing-btn" style={{
              background: ACCENT_FILL, color: "#fff",
              padding: ".38rem .9rem", borderRadius: 6, fontSize: ".9rem", fontWeight: 600,
              textDecoration: "none",
            }}>Get started free</a>
          </li>
        </ul>
      </nav>

      <SceneGate />
    </div>
  );
}
```

Note the nav's `#how` anchor is now `#recorder` (there's no longer a single "How it works" section, the narrative spans four scenes, `#recorder` is the closest match and is a real `id` on the Recorder scene's `<section>` from Task 15/16). The nav itself lives OUTSIDE `SceneGate`/`SceneExperience`'s `<Scroll html>` region on purpose (it's a normal sticky header, not part of the scroll-scrubbed content), so its own anchor-link clicks trigger real browser anchor-jump behavior against whichever experience (3D or static) is currently mounted, each of which has matching `id`s on its own sections.

- [ ] **Step 3: Delete the six superseded files**

```bash
cd frontend
git rm components/landing/Hero.tsx components/landing/HeroChain.tsx components/landing/HashChainScene.tsx components/landing/Problem.tsx components/landing/HowItWorks.tsx components/landing/Pricing.tsx
```

- [ ] **Step 4: Verify**

Run: `cd frontend && npx tsc --noEmit`
Expected: no new errors.

Run: `npx vitest run`
Expected: all existing tests still pass (this task deletes no test files; `chainData.test.ts`, `useReducedMotion.test.ts`, plus this plan's new `contrast.test.ts`, `landingTheme.test.ts`, `useClientSnapshot.test.ts`, `sceneProgress.test.ts` should all be green).

- [ ] **Step 5: Commit**

```bash
git add frontend/app/page.tsx
git commit -m "refactor(frontend): reassemble landing page around the scene experience, remove superseded components"
```

(The `git rm` from Step 3 already staged the deletions; this commit picks them up alongside `page.tsx`.)

---

### Task 23: Full-page QA sweep

**Files:**
- None modified. Verification-only task, no commits, matching the shape of the prior plan's final QA task.

- [ ] **Step 1: Production build**

Run: `cd frontend && NEXT_PUBLIC_SUPABASE_URL=https://placeholder.supabase.co NEXT_PUBLIC_SUPABASE_ANON_KEY=placeholder NEXT_PUBLIC_SITE_URL=http://localhost:3000 npm run build`
Expected: succeeds, `/` prerenders.

- [ ] **Step 2: Full test suite**

Run: `cd frontend && npx vitest run`
Expected: all tests pass (existing + this plan's new pure-logic tests).

- [ ] **Step 3: Desktop 3D path verification (Chromium via Playwright, `chromium.launch()` only)**

Against `npm run start` (production build): load `/` at a desktop viewport (e.g. 1440x900) with no `prefers-reduced-motion` set. Verify:
- The 3D canvas renders and camera position visibly changes as you programmatically scroll (dispatch scroll events or use Playwright's `page.mouse.wheel`), passing through all five scenes' visual content.
- The Evidence Pack scene's pin: scrolling through its section takes noticeably longer (more scroll distance) than the other scenes, without the visual content jumping ahead early.
- The nav's `#recorder` and `#pricing` links jump to the correct section when clicked (this is the anchor-link check required by the spec).
- Keyboard scrolling (Page Down, arrow keys) moves through the scenes (the keyboard scroll check required by the spec).
- The canvas element (or its accessible wrapper) exposes the `aria-label` text somewhere reachable by the accessibility tree, verified against the actual installed `@react-three/fiber` `CanvasImpl` behavior (re-check the same prop-spreading concern the prior plan hit) rather than assumed from the JSX prop alone.
- Focus-visible rings appear on Tab-focused nav links, CTA buttons, and pricing tier buttons.
- No console errors.
- No horizontal scroll at any point during the scroll sequence.

- [ ] **Step 4: Reduced-motion and mobile path verification**

With `prefers-reduced-motion: reduce` emulated at desktop width: confirm `SceneExperienceStatic` renders instead of `SceneExperience` (no `<canvas>` element present), sections cross-fade into view on scroll via the `IntersectionObserver`, no slide/parallax motion, single `<h1>`.

At 375px width (no reduced-motion forced): confirm the same static path renders (viewport-width gate), no horizontal scroll, `StickyMobileCta` appears, `min-height: 100dvh` sections don't cause layout jumps.

- [ ] **Step 5: Contrast and CLS/frame-budget checks**

Confirm `landingTheme.test.ts` (Task 3) passing is sufficient evidence for the color-contrast requirement (it already asserts this programmatically); no additional manual contrast tooling needed beyond that automated check.

Using Chrome DevTools' Performance panel (or a Lighthouse run) against the production build: record a CLS metric while the 3D path loads and confirm no unexpected layout shift once the canvas mounts (the `SceneSkeleton`'s `100dvh` height should already match the mounted experience's height, per Task 17's design). Record a frame-time trace during scroll through the busiest scene (Tribunal, with 6 animated spheres) and confirm frame times stay reasonably close to the ~16ms/60fps budget on this machine; note the actual numbers in your report even if they're imperfect, this is a recorded measurement, not a pass/fail gate that blocks the task, per the spec's framing of this as flagged risk to measure and report on.

- [ ] **Step 6: Report**

Summarize pass/fail per check above. Any check that fails outright (build fails, tests fail, console errors, broken anchor links, missing focus rings, broken keyboard scroll, contrast test failing) is a finding requiring a fix before this plan is considered done, following the same fix-loop process used by the prior two plans' final reviews. Performance measurements (CLS number, frame-time numbers) are reported as data, not treated as auto-fail thresholds, consistent with how the spec frames them as risk to measure.

---

## Self-Review

**Spec coverage:**
- Concept/mechanism/tone: Task 15 (`SceneExperience`), Task 3 (`landingTheme`).
- Scroll damping + anchor-link + keyboard verification: Task 15 Step 1 (`damping={0.2}`), Task 22 Step 2 (real anchor ids), Task 23 Step 3.
- Seven scenes/sections (5 cinematic + pricing + cta-footer), asymmetric opening, zig-zag pricing: Tasks 10-18, 22.
- Entrances/exits, concrete timing (200-300ms/150-200ms/opacity floor 0.2): Tasks 10-14's per-scene `enter`/`exit` math, expressed as scroll-range fractions rather than literal ms since these transitions are scroll-driven, not time-driven; the ms values from the spec inform the fraction widths chosen (e.g. 30% of a scene's range at typical scroll speed approximates the target duration) and are documented as tunable in Task 15's note.
- Pinning (single moment, Evidence Pack): Task 14, Task 15's `150dvh` section.
- Mobile/reduced-motion fallback, `min-h-dvh`: Task 16.
- Typography (Geist, tracking/leading scale): Task 6, applied inline throughout Tasks 15-16, 18 (letter-spacing/line-height values match the spec's scale on headline/body/label text).
- Button press feedback + focus-visible: Task 7, applied via `.landing-btn`/`.landing-link` classes throughout.
- No Tailwind, no icon library, no glassmorphism: honored throughout (no task introduces any of these).
- Accessibility (focus rings, canvas aria-label, contrast, keyboard scroll): Task 7, Task 15's `aria-label`, Task 2/3's contrast tests, Task 23 Step 3.
- CLS/frame-budget: Task 23 Step 5.

**Placeholder scan:** none found. Every step has real code, exact commands, or an exact verification procedure with concrete pass criteria.

**Type consistency:** `ChainBlock`/`buildChainBlocks` (existing) consumed identically by `ChainBlocksGroup` (Task 8), `OpeningChainScene` (Task 10), `RecorderChainScene` (Task 12). `getSceneLocalProgress(offset, sceneCount, sceneIndex): number` and `getActiveSceneIndex(offset, sceneCount?): number` (Task 5) are called with matching signatures in every scene component (Tasks 10-14) and `CameraRig` implicitly via `SCENE_COUNT`/`SCENE_DEPTH`. `landingTheme.ts`'s exported color constants (Task 3) are imported with matching names throughout Tasks 7-22, no task invents a differently-named color constant. `useClientSnapshot<T>(getClientValue, serverValue): T` (Task 4) is called identically in `SceneGate.tsx` (Task 17) to the shape already proven in the prior plan's `HeroChain.tsx`. `landingFont.className` (Task 6) is applied identically in `SceneExperience.tsx`, `SceneExperienceStatic.tsx`, and `app/page.tsx` (Tasks 15, 16, 22).
