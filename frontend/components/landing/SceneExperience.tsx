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
import EvidenceLogCard from "./EvidenceLogCard";
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
          aria-label="An animated sequence of 3D scenes visualizing TELUVANE's hash-chain recorder, compliance tribunal, and evidence pack, synchronized to page scroll"
        >
          <ambientLight intensity={0.45} />
          <directionalLight position={[3, 4, 5]} intensity={0.8} />
          <pointLight position={[-4, -2, 3]} intensity={0.35} color={ACCENT_FILL} />
          <ScrollControls pages={TOTAL_PAGES} damping={0.2}>
            <CameraRig />
            <OpeningChainScene sceneIndex={0} />
            <ProblemStatsScene sceneIndex={1} />
            <RecorderChainScene sceneIndex={2} />
            <TribunalScene sceneIndex={3} />
            <EvidencePackScene sceneIndex={4} />

            <Scroll html style={{ width: "100%" }}>
              <section id="opening" style={{ ...sceneTextStyle, maxWidth: 1400 }}>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "3rem", alignItems: "center" }}>
                  <div style={{ flex: "1 1 460px", maxWidth: 600 }}>
                    <h1 style={{ fontSize: "clamp(2.6rem, 6vw, 4.2rem)", fontWeight: 900, letterSpacing: "-.03em", lineHeight: 1.05, marginBottom: "1.2rem" }}>
                      Every AI agent action, <span style={{ color: ACCENT_TEXT }}>logged and hash-chained</span>.
                    </h1>
                    <p style={{ fontSize: "1.1rem", color: MUTED_ON_DARK, lineHeight: 1.55, marginBottom: "2rem" }}>
                      Tamper one row and the chain breaks visibly. An autonomous tribunal audits the log and exports a regulator-ready evidence pack.
                    </p>
                    <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
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
                  </div>
                  <div style={{ flex: "1 1 320px", display: "flex", justifyContent: "center" }}>
                    <EvidenceLogCard />
                  </div>
                </div>
              </section>

              <section id="problem" style={{ ...sceneTextStyle, textAlign: "center", alignItems: "center" }}>
                <h2 style={{ fontSize: "clamp(1.8rem, 4vw, 2.6rem)", fontWeight: 800, letterSpacing: "-.02em", lineHeight: 1.1, marginBottom: "1rem", maxWidth: 700 }}>
                  The EU AI Act asks for proof, not just logs.
                </h2>
                <p style={{ fontSize: "1.05rem", color: MUTED_ON_DARK, maxWidth: 560 }}>
                  Debugging traces tell you what an agent did. They don&apos;t tell a regulator whether it was allowed to. TELUVANE closes that gap.
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
                  A panel of agents reviews every action.
                </h2>
                <p style={{ fontSize: "1.05rem", color: MUTED_ON_DARK, maxWidth: 480 }}>
                  It checks the full log against a structured EU AI Act policy pack and cites evidence and confidence for each finding, so you know exactly what happened and why.
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

              <section id="pricing" style={{ width: "100%", background: TEXT_ON_DARK }}>
                <div style={{ padding: "6rem 2rem", maxWidth: 1400, margin: "0 auto" }}>
                  <PricingZigzag headingColor={DARK_BG} />
                </div>
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
