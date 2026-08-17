# Landing Page 3D Scrollytelling Redesign

## Status

Approved direction (concept, mechanism, tone, and taste-skill/Apple-design additions confirmed across multiple exchanges with the user). This spec consolidates those decisions before handoff to `superpowers:writing-plans`.

## Problem

The current landing page (`frontend/app/page.tsx` + `frontend/components/landing/*`) reads as generic AI-SaaS: centered hero, four stat cards, a four-pillar grid, three pricing cards side by side, warm-paper light theme. A single small 3D hash-chain visual was added to the hero in a prior plan, but it did not change the site's overall structure, tone, or memorability. The user wants a genuinely different, "out of this world," eye-catching site: a dark, cinematic, scroll-driven 3D experience where the camera moves through the product's real mechanics as the visitor scrolls, not a decorative bolt-on.

## Scope

**In scope:** `frontend/app/page.tsx` and everything under `frontend/components/landing/` (the public, unauthenticated landing page only).

**Out of scope, explicitly:** `/login`, `/app/*` (dashboard), `/privacy`, `/terms`, `/auth/callback`. These stay in their current light, functional, low-motion design — a compliance/audit product's working screens should stay calm and fast, not cinematic. This redesign does not touch `frontend/app/globals.css`'s global serif body font (used by those other pages) or any dashboard component.

## Concept: "Black Box Flight Deck"

A dark, cinematic, scroll-scrubbed 3D experience. Instead of stacking small decorative 3D elements into an otherwise ordinary page, the whole landing page becomes a single continuous 3D scene that the scrollbar drives the camera through, with synchronized HTML text overlaid at each stop. Each "scene" visualizes a real part of the product (the hash-chain, the tribunal audit, the evidence pack) rather than an abstract shape.

## Mechanism: scroll-scrubbed camera, not free 3D navigation

Considered and rejected: a fully free-roam 3D space where users click objects to fly between sections (Bruno-Simon style). Too slow to build, too disorienting for a B2B compliance buyer evaluating the product, and accessibility-hostile.

Considered and rejected: keeping the page as normal scroll with bigger decorative 3D moments scattered in it (this is roughly what the prior plan already shipped) — doesn't solve the "still feels generic" complaint.

**Chosen:** the page still scrolls vertically like a normal website (native scrollbar, works with browser search/anchor links/screen readers as much as a 3D experience can), but scroll position drives a single `@react-three/fiber` `<Canvas>`'s camera through a sequence of 3D "scenes" using drei's `<ScrollControls>` + `useScroll()`. HTML content (headline, body copy, CTAs) is layered on top via drei's `<Scroll html>` container, so text stays fully accessible DOM (selectable, screen-reader-reachable, indexable) rather than being drawn inside the canvas.

**Scroll feel:** use `ScrollControls`'s built-in `damping` prop (a small value, e.g. `0.15-0.25`, tuned during implementation, not a separate smooth-scroll library like Lenis) so the camera settles into position with a brief ease instead of tracking raw scroll input 1:1. Raw undamped scroll reads as mechanical, not premium. Do not add a separate smooth-scroll dependency for this — `ScrollControls`'s own damping is the right tool and avoids introducing a second scroll-position source of truth. The existing nav's in-page anchor links (`#how`, `#pricing`) must be re-verified once damping is tuned, since damped/virtualized scroll containers can desync from native anchor-jump behavior; this is a required verification step in the implementation plan, not an assumption.

## Visual tone

Near-black background (`#0d0c0b`, not pure `#000000`), a single desaturated rust/amber accent (reuse the existing `--rust: #b4451f` family, shifted lighter/warmer for dark-background contrast if needed, e.g. `#d97a4a` for text-on-dark use, `#b4451f` for filled buttons), off-white text (`#f4efe6`, the existing `--paper` token, inverted to foreground use). No gradients, no glassmorphism/backdrop-filter panels, no purple. This keeps full compliance with the project's existing global design rules (`~/.claude/CLAUDE.md`) while flipping light-to-dark.

## Page structure: scenes, not cards

Replaces the current Hero / Problem / HowItWorks / Pricing / Cta / Footer stack with:

1. **Opening scene** — asymmetric split: headline + subhead + CTAs on one side (left on desktop), the 3D hash-chain (existing `HashChainScene` geometry, restyled for dark background: emissive/lit rust accent on the terminal block, ink blocks now near-black-on-near-black with a thin light rim so they still read against the dark bg) on the other side, slowly rotating. No centered hero — this directly fixes the "hero is centered" critique raised during design review.
2. **Problem scene** — as the user scrolls, the camera pushes in; the four stat numbers (€35M, 2026, 0, Art.15) are no longer a card grid — they appear as large floating 3D-positioned text (rendered via drei's `<Text>` or as HTML anchored to 3D-projected screen positions) that scale/fade in one at a time as the camera passes them, each one dominating the viewport briefly instead of four equal boxes at once.
3. **Recorder scene** — camera travels alongside an extended hash-chain (more blocks than the hero's 6, e.g. 10-14) to visualize "every action gets chained." This scene reuses `lib/chainData.ts`'s `buildChainBlocks`, extended.
4. **Tribunal scene** — a cluster of small "verdict" nodes (spheres or rounded boxes) that are neutral-colored by default and animate to the rust accent color one at a time (not simultaneously — a staggered reveal keyed to scroll progress) to represent the multi-agent audit flagging violations.
5. **Evidence Pack scene** — a single object (a flat rounded plane, representing the exported report) that assembles/solidifies as the camera arrives, then the scene fades to prepare for the tone shift into Pricing. This is the one scene in the sequence that briefly **pins**: scroll progress holds the camera in place for a short scroll distance while the report object finishes assembling and its summary text finishes appearing, then releases into the Pricing transition. This is the only pinned moment in the whole page — pinning is reserved for this single emphasis point, not applied to every scene, per the "use pinning sparingly" caveat.
6. **Pricing** — the 3D canvas's visible influence recedes here (still present as a subtle background gradient-free field, but no foreground 3D object): three pricing tiers are presented as an asymmetric zig-zag (Free tier left-aligned with more whitespace, Pro tier emphasized and shifted right, Enterprise tier left-aligned again) rather than three equal-width cards in a row, per the "no 3-column card row" rule. Content stays flat, readable HTML on a solid dark card surface (no 3D) — a buyer comparing prices should not have to track a moving camera.
7. **CTA + Footer** — calm close, flat dark surfaces, same as current copy/links, restyled for dark theme.

**Entrances and exits are both deliberate.** Each scene above needs both an entry treatment (already described per scene) and an explicit exit treatment tied to the next scene's arrival, not just a fade-to-nothing: e.g. the Recorder scene's chain should visibly recede/dim as the Tribunal scene's nodes begin appearing in front of it, rather than the chain abruptly vanishing before the next scene starts. This exit choreography is a required part of each scene's implementation, not left as an afterthought once entrances are done.

**Concrete timing.** Per-element entrance/exit fades within a scene (e.g. one stat number fading in, one tribunal node flipping color) target 200-300ms; the exit is faster than the enter, roughly 60-70% of the enter's duration (~150-200ms), consistent with the wider design system's existing momentum. No fading element should hold at an opacity below 0.2 mid-transition — either commit to fully visible or fully hidden, don't leave things lingering faint. These are starting values to tune against real scroll speed during implementation, not hard-locked, but "brief"/"short" alone is not sufficient for the plan to implement against.

## Mobile & reduced-motion behavior

Extends the pattern already established by `HeroChain.tsx`/`useReducedMotion.ts` from the prior plan (do not reinvent it):

- `prefers-reduced-motion: reduce`, viewport `< 768px`, or no WebGL support: the scroll-scrubbed camera experience is replaced entirely. Each scene renders as a normal stacked HTML section (the scene's HTML content, plus a static image or simplified static SVG standing in for that scene's 3D moment, reusing the existing `HashChainStatic` component for the Recorder scene and simple static equivalents for the others) in normal document flow with normal scroll. No `ScrollControls`, no continuous canvas, no camera movement.
- On the reduced/mobile path, section-to-section transitions use short opacity cross-fades on scroll-into-view (via `IntersectionObserver`, not scroll-position math), never slides or parallax, per Apple-design §14. No elastic/overshoot easing anywhere on this path.
- The reduced/mobile fallback's full-height sections (if any section needs to fill the viewport, e.g. the Opening scene's stacked equivalent) use `min-height: 100dvh`, never `100vh`, following the same convention already established in the prior plans (`not-found.tsx`, the plan's own Global Constraints).
- On the full desktop 3D path, scroll IS the interruption/redirect mechanism (§3): because the camera position is a pure function of scroll offset (via `ScrollControls`), scrolling up mid-transition naturally and instantly reverses the camera with no separate "undo" logic needed — this is why `ScrollControls` was chosen over a GSAP ScrollTrigger + Three.js timeline approach, which would need explicit interrupt handling.

## Typography

Add a real display font via `next/font/google` (Geist, self-hosted at build time, no external font request at runtime, no separate font licensing step needed) for the landing page only, replacing the current inline `system-ui` stack in `frontend/app/page.tsx`. Body copy can stay on Geist as well (one font family, different weights) rather than pairing two typefaces, to keep the "premium tech" feel simple.

Tracking/leading scale (Apple-design §15, applied concretely):
- Display/scene headlines (the large per-scene text, e.g. "Prove what your AI agents did."): `letter-spacing: -0.02em to -0.03em`, `line-height: 1.05-1.1`.
- Body copy (subheads, paragraph text): `letter-spacing: 0`, `line-height: 1.5-1.6`.
- Small/label text (eyebrow labels, pricing tier labels): `letter-spacing: 0.05-0.08em` (slightly positive, matches the existing uppercase-label convention already in the codebase), `line-height: 1.4`.

This is a concrete instruction for the implementation plan, not left to per-component improvisation.

## Interaction details

- Primary/secondary CTA buttons get explicit `:active` press feedback: `transform: scale(0.97)`, `transition: transform 100ms ease-out` (Apple-design §1/§4) — currently absent from the codebase's buttons.
- No custom cursor, no magnetic buttons, no particle effects, no holographic/liquid-glass panels — these are explicitly excluded per the project's own anti-AI-slop rules (`design-taste-frontend-v1`'s "AI Tells" section) despite being available in that skill's creative arsenal; the brief is "different and premium," not "every trend at once."

## Accessibility

- **Focus states.** Every interactive element on the new dark theme (nav links, primary/secondary CTAs, pricing tier buttons, footer links) must keep a visible focus ring on keyboard `:focus-visible` (a 2-3px ring in a color with sufficient contrast against `#0d0c0b`, e.g. the lighter `#d97a4a` accent or off-white `#f4efe6`, not the default browser outline which is often invisible on dark backgrounds if left unstyled). This was not addressed in the prior two plans' dark-adjacent work and must not be dropped here.
- **Canvas accessibility.** The `<Canvas>` element (or its wrapping container) needs a real `aria-label` describing the scene sequence's content, applied to an element that actually reaches the accessibility tree — the prior plan's final review found that `@react-three/fiber`'s `<Canvas>` spreads unrecognized props onto its outer wrapper `<div>`, not the inner `<canvas>` DOM node, so `aria-label` placement must be re-verified against the installed R3F version's `CanvasImpl` behavior during implementation, not assumed to land correctly from a prop.
- **Color contrast verification.** The accent-on-dark text color (`#d97a4a` on `#0d0c0b`) must be measured against WCAG AA (4.5:1 normal text, 3:1 large text) before use for body-sized text; if it falls short, lighten the accent for text-only use while keeping the more saturated `#b4451f` for filled button backgrounds (button text contrast against the button's own fill is a separate, also-required check).
- **Keyboard scroll verification.** Once `ScrollControls` damping is tuned, verify keyboard-driven scrolling (Page Down/Page Up, Space, arrow keys, Home/End) still moves the camera through scenes correctly, in addition to the anchor-link check already specified above — damped/virtualized scroll containers can sometimes intercept or desync from native keyboard scroll handling.

## Explicitly kept as-is (resolved tensions from design-taste-frontend-v1 review)

- **No Tailwind migration.** The codebase's existing inline-style-object convention (`style={{...}}` throughout `components/landing/*`) is kept. Introducing Tailwind mid-project would be a large, unrelated migration the user never asked for, and would violate the "don't propose unrelated refactoring" principle from the brainstorming process. New landing components continue in the existing inline-style pattern.
- **No icon library.** The project's existing convention (numbered indices `01`-`04`, small separator dots, no decorative icon glyphs) is kept rather than adding `@phosphor-icons/react`/`@radix-ui/react-icons`, since `~/.claude/CLAUDE.md` already bans "generic decorative icons standing in for substance" and the current numbered-index treatment already satisfies that rule.
- **No glassmorphism/backdrop-filter materials**, despite Apple-design's materials section (§12) discussing translucency as a hierarchy tool — the project's own global rule against glassmorphism is the binding constraint here (per `ui-inspiration` skill's stated precedence: project rules override borrowed reference material).

## Technical approach

- **New dependency:** `@react-three/drei` (previously installed, then removed as unused in the "production readiness" plan when nothing consumed it — reinstall it, this redesign is the actual consumer). `@react-three/fiber` and `three` are already installed.
- **No new dependency for scroll-scrubbing itself:** drei's `ScrollControls`/`useScroll`/`Scroll` handle the scroll-to-camera-position mapping; no GSAP/ScrollTrigger needed for this mechanism, avoiding the mixed-motion-library risk flagged by `design-taste-frontend-v1` ("never mix GSAP/ThreeJS with Framer Motion in the same component tree" — this spec uses neither GSAP nor Framer Motion for the 3D path, only drei/R3F, plus plain CSS for the reduced-motion HTML path and the button press states).
- **Component shape:** one new top-level client component (e.g. `components/landing/SceneExperience.tsx`) owns the `<Canvas>` + `<ScrollControls>` + all per-scene 3D sub-components (extending/restyling the existing `HashChainScene`-family components rather than replacing them) plus the HTML overlay content via `<Scroll html>`. A sibling component (e.g. `components/landing/SceneExperienceStatic.tsx`, a server-renderable stacked-sections fallback) handles the reduced-motion/mobile/no-WebGL path. A thin client gating wrapper (extending the existing `HeroChain.tsx`-style `useSyncExternalStore`-based mount/capability detection, fixed from the prior plan's final-review learnings — correct-on-first-client-render, not a `useState`+`useEffect` flip) picks between them, replacing today's per-section component composition in `frontend/app/page.tsx`.
- **Copy content** (headlines, stat numbers, pillar descriptions, pricing tiers, footer links) carries over from the current components essentially unchanged in substance — this is a structural and visual redesign, not a rewrite of what the product says about itself. Any copy adjustments needed to fit the new scene pacing (e.g. shorter per-scene text since it appears one screen-height at a time instead of all at once) are made narrowly, preserving the existing no-em-dash, no-hype-word copy voice already established.

## Testing

- Pure-logic pieces (extended `chainData.ts` block generation for the longer Recorder-scene chain, any new scroll-progress-to-scene-index mapping function) get unit tests, following the TDD pattern already used for `chainData.test.ts`/`useReducedMotion.test.ts`.
- The 3D scene components themselves are not unit-testable (same rationale as the prior plan: WebGL isn't testable in jsdom) — verified via manual/browser checks (Chromium only, per the project's browser-automation rule) at each implementation step: desktop full-3D path renders and scroll-scrubs correctly, reduced-motion path shows the cross-fade stacked fallback, mobile width shows the fallback, no console errors, no horizontal scroll, single `<h1>` per effectively-visible "page" state.
- Full production build (`npm run build`) must still succeed and prerender the route statically, consistent with the prior two plans' verification standard.
- **Layout shift check.** `ScrollControls`'s `pages` prop determines total scrollable height; verify the fallback/loading state (before the 3D bundle and its assets finish mounting) reserves the same page height the final mounted experience will need, so there is no visible jump in scrollbar size or page height once the canvas finishes loading. Measure with a real CLS check (e.g. Chrome DevTools Performance panel or a Lighthouse run against the production build), not just eyeballing it.
- **Frame budget check.** With multiple scenes' geometry potentially resident at once (even if only one is in-focus), verify actual frame time stays near the ~16ms/60fps budget during scroll on the production build, not just that the page "feels smooth" anecdotally — record this with the browser's performance profiler during the manual verification pass.

## Open implementation risk (flagged for the plan, not blocking this spec)

Real risk this spec does not fully resolve, to be handled during implementation/task review rather than upfront:
- **Content-projected `<Text>` positions at scroll-scrubbed camera stops** are more fiddly to get pixel-right than a normal scroll page; the implementation plan should budget explicit visual-inspection verification steps (matching the rigor the prior plan's final review applied when it caught the broken OG-image headline by actually rendering and looking at it, not just trusting a green build).
- **Bundle size for the full desktop 3D experience** will be larger than the prior plan's single hero scene (more geometry, more scenes). The existing gating pattern (only load the 3D bundle for capable/opted-in visitors) contains this, but the plan should include an actual bundle-size check as a verification step, not just assume the existing gate is sufficient at this larger scale.
