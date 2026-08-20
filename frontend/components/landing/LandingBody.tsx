// frontend/components/landing/LandingBody.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import EvidenceLogCard from "./EvidenceLogCard";
import PricingZigzag from "./PricingZigzag";
import Cta from "./Cta";
import Footer from "./Footer";
import StickyMobileCta from "./StickyMobileCta";
import LandingInteractionStyles from "./dark/LandingInteractionStyles";
import { useReducedMotion } from "@/lib/useReducedMotion";
import { DARK_BG, TEXT_ON_DARK, ACCENT_FILL, ACCENT_TEXT, MUTED_ON_DARK, BORDER_ON_DARK, DARK_SURFACE } from "@/lib/landingTheme";
import { landingFont } from "@/lib/landingFont";

function FadeInSection({ children, style, id }: { children: React.ReactNode; style?: React.CSSProperties; id?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const reducedMotion = useReducedMotion();

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
        opacity: reducedMotion || visible ? 1 : 0,
        transition: reducedMotion ? "none" : "opacity 250ms ease-out",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

const statCards = [
  { num: "€35M", text: "Maximum fine for non-compliance with EU AI Act obligations, or 7% of global revenue." },
  { num: "2026", text: "Full obligations in force for high-risk AI systems across all EU member states." },
  { num: "0", text: "Purpose-built tools for AI agent compliance adjudication before TELUVANE." },
  { num: "Art.15", text: "Robustness and cybersecurity requirements your agent logs must now demonstrate." },
];

const pillars = [
  { title: "Recorder", desc: "Every agent action, LLM call, tool invocation, and result is appended to a SHA-256 hash-chained log. Any silent edit breaks the chain immediately." },
  { title: "Tribunal", desc: "An autonomous multi-agent panel audits the full log against a structured EU AI Act policy pack, citing evidence, article references, and a confidence score for each finding." },
  { title: "Evidence Pack", desc: "One click exports an auditor-ready report: incident summary, violation table, full action log, and chain-integrity status, formatted for regulators." },
];

export default function LandingBody() {
  return (
    <main className={landingFont.className} style={{ background: DARK_BG, color: TEXT_ON_DARK, lineHeight: 1.6 }}>
      <LandingInteractionStyles />
      <noscript>
        <style>{".fade-section{opacity:1 !important;}"}</style>
      </noscript>

      <FadeInSection id="opening" style={{ minHeight: "80dvh", display: "flex", flexDirection: "column", justifyContent: "center", padding: "4rem 1.5rem" }}>
        <div style={{ maxWidth: 700 }}>
          <h1 style={{ fontSize: "clamp(2.2rem, 6vw, 3.2rem)", fontWeight: 900, letterSpacing: "-.03em", lineHeight: 1.08, marginBottom: "1.1rem" }}>
            Every AI agent action, <span style={{ color: ACCENT_TEXT }}>logged and hash-chained</span>.
          </h1>
          <p style={{ fontSize: "1.1rem", color: MUTED_ON_DARK, lineHeight: 1.55, marginBottom: "2rem", maxWidth: 560 }}>
            Tamper one row and the chain breaks visibly. An autonomous tribunal audits the log and exports a regulator-ready evidence pack.
          </p>
          <div style={{ display: "flex", gap: ".75rem", flexWrap: "wrap", marginBottom: "1.5rem" }}>
            <a href="/login" className="landing-btn" style={{
              display: "inline-flex", alignItems: "center", padding: ".75rem 1.6rem",
              borderRadius: 8, fontSize: ".95rem", fontWeight: 600,
              background: ACCENT_FILL, color: "#fff", textDecoration: "none",
            }}>
              Get started free
            </a>
            <a href="https://github.com/iWeslax83/teluvane" target="_blank" rel="noopener" className="landing-btn landing-link" style={{
              display: "inline-flex", alignItems: "center", padding: ".75rem 1.6rem",
              borderRadius: 8, fontSize: ".95rem", fontWeight: 600,
              background: "transparent", color: TEXT_ON_DARK, border: `1.5px solid ${BORDER_ON_DARK}`, textDecoration: "none",
            }}>
              View on GitHub
            </a>
          </div>
          <div style={{ fontSize: ".82rem", color: MUTED_ON_DARK, display: "flex", alignItems: "center", gap: ".5rem" }}>
            <span>Built with</span>
            <span>LangGraph</span>
            <span style={{ width: 3, height: 3, borderRadius: "50%", background: BORDER_ON_DARK, display: "inline-block" }}></span>
            <span>Claude</span>
            <span style={{ width: 3, height: 3, borderRadius: "50%", background: BORDER_ON_DARK, display: "inline-block" }}></span>
            <span>FastAPI</span>
          </div>
        </div>
      </FadeInSection>

      <FadeInSection id="problem" style={{ padding: "4rem 1.5rem" }}>
        <div style={{ maxWidth: 960, margin: "0 auto" }}>
          <div style={{ fontSize: ".78rem", fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", color: ACCENT_TEXT, marginBottom: ".6rem" }}>The problem</div>
          <h2 style={{ fontSize: "clamp(1.8rem, 4vw, 2.4rem)", fontWeight: 800, letterSpacing: "-.02em", lineHeight: 1.15, marginBottom: "1rem", maxWidth: 640 }}>
            The EU AI Act asks for proof, not just logs.
          </h2>
          <p style={{ fontSize: "1.02rem", color: MUTED_ON_DARK, maxWidth: 640 }}>
            Debugging traces tell you what an agent did. They don&apos;t tell a regulator whether it was allowed to. TELUVANE closes that gap.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1.1rem", marginTop: "2.2rem" }}>
            {statCards.map(({ num, text }) => (
              <div key={num} style={{ background: DARK_SURFACE, border: `1px solid ${BORDER_ON_DARK}`, borderRadius: 10, padding: "1.3rem" }}>
                <div style={{ fontSize: "1.9rem", fontWeight: 800, color: ACCENT_TEXT }}>{num}</div>
                <p style={{ fontSize: ".85rem", color: MUTED_ON_DARK, marginTop: ".3rem" }}>{text}</p>
              </div>
            ))}
          </div>
        </div>
      </FadeInSection>

      <FadeInSection id="how" style={{ padding: "4rem 1.5rem" }}>
        <div style={{ maxWidth: 960, margin: "0 auto" }}>
          <div style={{ fontSize: ".78rem", fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", color: ACCENT_TEXT, marginBottom: ".6rem" }}>How it works</div>
          <h2 style={{ fontSize: "clamp(1.8rem, 4vw, 2.4rem)", fontWeight: 800, letterSpacing: "-.02em", marginBottom: "1rem", maxWidth: 640 }}>
            Three steps from first action to court-ready evidence.
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))", gap: "1.2rem", marginTop: "2.2rem" }}>
            {pillars.map(({ title, desc }, i) => (
              <div key={title} style={{ background: DARK_SURFACE, border: `1px solid ${BORDER_ON_DARK}`, borderRadius: 10, padding: "1.5rem" }}>
                <div style={{ fontSize: ".8rem", fontWeight: 700, color: ACCENT_TEXT, marginBottom: ".75rem", fontFamily: "ui-monospace, monospace", letterSpacing: ".08em" }}>
                  {String(i + 1).padStart(2, "0")}
                </div>
                <h3 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: ".4rem" }}>{title}</h3>
                <p style={{ fontSize: ".875rem", color: MUTED_ON_DARK }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </FadeInSection>

      <FadeInSection id="proof" style={{ padding: "4rem 1.5rem" }}>
        <div style={{ maxWidth: 960, margin: "0 auto", display: "flex", flexWrap: "wrap", gap: "2.5rem", alignItems: "center" }}>
          <div style={{ flex: "1 1 320px" }}>
            <div style={{ fontSize: ".78rem", fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", color: ACCENT_TEXT, marginBottom: ".6rem" }}>Proof</div>
            <h2 style={{ fontSize: "clamp(1.6rem, 3.6vw, 2.1rem)", fontWeight: 800, letterSpacing: "-.02em", marginBottom: "1rem" }}>
              A real log entry, not a mockup.
            </h2>
            <p style={{ fontSize: ".98rem", color: MUTED_ON_DARK, maxWidth: 460 }}>
              Every event is hashed, chained to the one before it, and checked on every read. If <code>chain</code> ever reads anything but <code>INTACT</code>, you know exactly which row was touched.
            </p>
          </div>
          <div style={{ flex: "1 1 320px", display: "flex", justifyContent: "center" }}>
            <EvidenceLogCard />
          </div>
        </div>
      </FadeInSection>

      <FadeInSection id="pricing" style={{ padding: "4rem 1.5rem" }}>
        <div style={{ maxWidth: 960, margin: "0 auto" }}>
          <PricingZigzag />
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
