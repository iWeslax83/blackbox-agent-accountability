import { DARK_BG, DARK_SURFACE, TEXT_ON_DARK, ACCENT_TEXT, ACCENT_FILL, MUTED_ON_DARK, BORDER_ON_DARK } from "@/lib/landingTheme";

export default function Cta() {
  return (
    <section id="cta" style={{ padding: "5rem 2rem", background: DARK_BG }}>
      <div style={{ maxWidth: 960, margin: "0 auto" }}>
        <div style={{ fontSize: ".75rem", fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", color: ACCENT_TEXT, marginBottom: ".6rem" }}>Early access</div>
        <h2 style={{ fontSize: "2rem", fontWeight: 800, letterSpacing: "-.02em", marginBottom: "1rem", color: TEXT_ON_DARK }}>Get started today</h2>
        <p style={{ fontSize: "1.05rem", color: MUTED_ON_DARK, textAlign: "center", maxWidth: 520, margin: "0 auto" }}>
          We&apos;re onboarding early teams. Create your account and start auditing your agents in minutes.
        </p>
        <div style={{ background: DARK_SURFACE, border: `1px solid ${BORDER_ON_DARK}`, borderRadius: 14, padding: "2.8rem", maxWidth: 520, margin: "2.5rem auto 0", boxShadow: "0 2px 12px rgba(0,0,0,.4)", textAlign: "center" }}>
          <h3 style={{ fontSize: "1.4rem", fontWeight: 800, marginBottom: ".5rem", color: TEXT_ON_DARK }}>Start for free</h3>
          <p style={{ color: MUTED_ON_DARK, fontSize: ".9rem", marginBottom: "1.4rem" }}>
            No credit card required. Full access to the dashboard, API key management, and tribunal audits.
          </p>
          <a href="/login" className="landing-btn" style={{
            display: "inline-block",
            background: ACCENT_FILL, color: "#fff",
            padding: ".75rem 2rem", borderRadius: 8,
            fontSize: "1rem", fontWeight: 600, textDecoration: "none",
          }}>
            Get started free →
          </a>
        </div>
      </div>
    </section>
  );
}
