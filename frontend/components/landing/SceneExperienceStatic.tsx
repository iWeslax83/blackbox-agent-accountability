// frontend/components/landing/SceneExperienceStatic.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import HashChainStatic from "./HashChainStatic";
import PricingZigzag from "./PricingZigzag";
import Cta from "./Cta";
import Footer from "./Footer";
import StickyMobileCta from "./StickyMobileCta";
import LandingInteractionStyles from "./dark/LandingInteractionStyles";
import { DARK_BG, TEXT_ON_DARK, ACCENT_FILL, ACCENT_TEXT, MUTED_ON_DARK, BORDER_ON_DARK } from "@/lib/landingTheme";
import { landingFont } from "@/lib/landingFont";

function FadeInSection({ children, style, id }: { children: React.ReactNode; style?: React.CSSProperties; id?: string }) {
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
      id={id}
      className="fade-section"
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
      <noscript>
        <style>{".fade-section{opacity:1 !important;}"}</style>
      </noscript>

      <FadeInSection id="opening" style={{ minHeight: "100dvh", display: "flex", flexDirection: "column", justifyContent: "center", padding: "0 1.5rem" }}>
        <h1 style={{ fontSize: "clamp(2.2rem, 8vw, 2.8rem)", fontWeight: 900, letterSpacing: "-.03em", lineHeight: 1.08, marginBottom: "1rem" }}>
          Every AI agent action, <span style={{ color: ACCENT_TEXT }}>logged and hash-chained</span>.
        </h1>
        <p style={{ fontSize: "1rem", color: MUTED_ON_DARK, lineHeight: 1.55, marginBottom: "1.5rem" }}>
          Tamper one row and the chain breaks visibly. An autonomous tribunal audits the log and exports a regulator-ready evidence pack.
        </p>
        <div style={{ display: "flex", gap: ".75rem", flexWrap: "wrap", marginBottom: "2rem" }}>
          <a href="/login" className="landing-btn" style={{
            display: "inline-flex", alignItems: "center", padding: ".75rem 1.4rem",
            borderRadius: 8, fontSize: ".9rem", fontWeight: 600,
            background: ACCENT_FILL, color: "#fff", textDecoration: "none",
          }}>
            Get started free
          </a>
          <a href="https://github.com/iWeslax83/teluvane" target="_blank" rel="noopener" className="landing-btn landing-link" style={{
            display: "inline-flex", alignItems: "center", padding: ".75rem 1.4rem",
            borderRadius: 8, fontSize: ".9rem", fontWeight: 600,
            background: "transparent", color: TEXT_ON_DARK, border: `1.5px solid ${BORDER_ON_DARK}`, textDecoration: "none",
          }}>
            View on GitHub
          </a>
        </div>
        <HashChainStatic />
      </FadeInSection>

      <FadeInSection id="problem" style={{ padding: "4rem 1.5rem", textAlign: "center" }}>
        <h2 style={{ fontSize: "1.8rem", fontWeight: 800, letterSpacing: "-.02em", lineHeight: 1.15, marginBottom: "1rem" }}>
          The EU AI Act asks for proof, not just logs.
        </h2>
        <p style={{ fontSize: ".95rem", color: MUTED_ON_DARK }}>
          Debugging traces tell you what an agent did. They don&apos;t tell a regulator whether it was allowed to. TELUVANE closes that gap.
        </p>
      </FadeInSection>

      <FadeInSection id="recorder" style={{ padding: "4rem 1.5rem" }}>
        <h2 style={{ fontSize: "1.8rem", fontWeight: 800, letterSpacing: "-.02em", marginBottom: "1rem" }}>
          Every action, chained. A panel of agents reviews it.
        </h2>
        <p style={{ fontSize: ".95rem", color: MUTED_ON_DARK }}>
          Every agent action is appended to a SHA-256 hash-chained log. It checks the full log against a structured EU AI Act policy pack and cites evidence for each finding.
        </p>
      </FadeInSection>

      <FadeInSection id="evidence-pack" style={{ padding: "4rem 1.5rem" }}>
        <h2 style={{ fontSize: "1.8rem", fontWeight: 800, letterSpacing: "-.02em", marginBottom: "1rem" }}>
          One click. A regulator-ready evidence pack.
        </h2>
        <p style={{ fontSize: ".95rem", color: MUTED_ON_DARK }}>
          Incident summary, violation table, full action log, and chain-integrity status, formatted for regulators.
        </p>
      </FadeInSection>

      <FadeInSection id="pricing" style={{ width: "100%", background: TEXT_ON_DARK }}>
        <div style={{ padding: "4rem 1.5rem" }}>
          <PricingZigzag headingColor={DARK_BG} />
        </div>
      </FadeInSection>

      <div id="cta-footer">
        <Cta />
        <Footer />
      </div>
      <StickyMobileCta />
    </main>
  );
}
