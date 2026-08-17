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
