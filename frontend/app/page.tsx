// frontend/app/page.tsx
import type { Metadata } from "next";
import Hero from "@/components/landing/Hero";
import Problem from "@/components/landing/Problem";
import HowItWorks from "@/components/landing/HowItWorks";
import Pricing from "@/components/landing/Pricing";
import Cta from "@/components/landing/Cta";
import Footer from "@/components/landing/Footer";

export const metadata: Metadata = {
  title: "BLACKBOX: AI Agent Accountability",
  description: "Tamper-evident flight recorder and autonomous compliance tribunal for AI agents. Prove what your AI agents did, before a regulator asks.",
};

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
