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
