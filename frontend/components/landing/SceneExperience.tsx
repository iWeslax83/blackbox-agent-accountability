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
import { DARK_BG, TEXT_ON_DARK, ACCENT_FILL, ACCENT_TEXT, MUTED_ON_DARK, BORDER_ON_DARK } from "@/lib/landingTheme";
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
                  border: `1px solid ${BORDER_ON_DARK}`, borderRadius: 4,
                  padding: ".3rem .75rem", marginBottom: "1.6rem",
                  fontSize: ".78rem", fontWeight: 700, letterSpacing: ".07em", textTransform: "uppercase",
                  color: ACCENT_TEXT,
                }}>
                  EU AI Act &middot; Art. 10 / 12 / 14 / 15
                </div>
                <h1 style={{ fontSize: "clamp(2.6rem, 6vw, 4.2rem)", fontWeight: 900, letterSpacing: "-.03em", lineHeight: 1.05, marginBottom: "1.2rem" }}>
                  Prove what your <span style={{ color: ACCENT_TEXT }}>AI agents</span> did.
                </h1>
                <p style={{ fontSize: "1.1rem", color: MUTED_ON_DARK, lineHeight: 1.55, marginBottom: "2rem" }}>
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
                    background: "transparent", color: TEXT_ON_DARK, border: `1.5px solid ${BORDER_ON_DARK}`, textDecoration: "none",
                  }}>
                    View on GitHub
                  </a>
                </div>
              </section>

              <section id="problem" style={{ ...sceneTextStyle, textAlign: "center", alignItems: "center" }}>
                <h2 style={{ fontSize: "clamp(1.8rem, 4vw, 2.6rem)", fontWeight: 800, letterSpacing: "-.02em", lineHeight: 1.1, marginBottom: "1rem", maxWidth: 700 }}>
                  The EU AI Act is already in force. Your logs are not evidence.
                </h2>
                <p style={{ fontSize: "1.05rem", color: MUTED_ON_DARK, maxWidth: 560 }}>
                  Mandatory logging and traceability requirements are enforceable now. Generic observability tools show traces for debugging, not adjudication.
                </p>
              </section>

              <section id="recorder" style={{ ...sceneTextStyle, alignItems: "flex-end", textAlign: "right" }}>
                <h2 style={{ fontSize: "clamp(1.8rem, 4vw, 2.6rem)", fontWeight: 800, letterSpacing: "-.02em", marginBottom: "1rem", maxWidth: 520 }}>
                  Every action, chained.
                </h2>
                <p style={{ fontSize: "1.05rem", color: MUTED_ON_DARK, maxWidth: 480 }}>
                  Every agent action is appended to a SHA-256 hash-chained log. A silent edit breaks the chain immediately.
                </p>
              </section>

              <section id="tribunal" style={sceneTextStyle}>
                <h2 style={{ fontSize: "clamp(1.8rem, 4vw, 2.6rem)", fontWeight: 800, letterSpacing: "-.02em", marginBottom: "1rem", maxWidth: 520 }}>
                  A multi-agent panel, flagging violations.
                </h2>
                <p style={{ fontSize: "1.05rem", color: MUTED_ON_DARK, maxWidth: 480 }}>
                  An autonomous tribunal audits the full log against a structured EU AI Act policy pack, citing evidence and confidence for every flag.
                </p>
              </section>

              <section id="evidence-pack" style={{ ...sceneTextStyle, textAlign: "center", alignItems: "center", minHeight: "150dvh" }}>
                <h2 style={{ fontSize: "clamp(1.8rem, 4vw, 2.6rem)", fontWeight: 800, letterSpacing: "-.02em", marginBottom: "1rem", maxWidth: 560 }}>
                  One click. A regulator-ready evidence pack.
                </h2>
                <p style={{ fontSize: "1.05rem", color: MUTED_ON_DARK, maxWidth: 480 }}>
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
