// frontend/app/page.tsx
import type { Metadata } from "next";
import LandingBody from "@/components/landing/LandingBody";
import { BG, INK, ACCENT, ACCENT_ON_FILL, BORDER } from "@/lib/landingTheme";

export const metadata: Metadata = {
  title: "TELUVANE: AI Agent Accountability",
  description: "Tamper-evident flight recorder and autonomous compliance tribunal for AI agents. Prove what your AI agents did, before a regulator asks.",
};

export default function Landing() {
  return (
    <div>
      <nav style={{
        position: "sticky", top: 0, zIndex: 100,
        background: BG,
        borderBottom: `1px solid ${BORDER}`,
        padding: "0 2rem",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        height: 58,
      }}>
        <a href="#opening" className="landing-link" style={{ fontSize: "1.15rem", fontWeight: 700, letterSpacing: "-.01em", color: INK, textDecoration: "none" }}>
          TELUVANE
        </a>
        <ul style={{ display: "flex", alignItems: "center", gap: "1.6rem", listStyle: "none", margin: 0, padding: 0 }}>
          <li><a href="#how" className="landing-link" style={{ color: INK, fontSize: ".9rem", fontWeight: 500, textDecoration: "none" }}>How it works</a></li>
          <li><a href="#pricing" className="landing-link" style={{ color: INK, fontSize: ".9rem", fontWeight: 500, textDecoration: "none" }}>Pricing</a></li>
          <li>
            <a href="/login" className="landing-btn" style={{
              background: ACCENT, color: ACCENT_ON_FILL,
              padding: ".38rem .9rem", borderRadius: 6, fontSize: ".9rem", fontWeight: 700,
              textDecoration: "none",
            }}>Get started free</a>
          </li>
        </ul>
      </nav>

      <LandingBody />
    </div>
  );
}
