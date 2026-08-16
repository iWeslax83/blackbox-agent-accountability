export default function Pricing() {
  return (
    <section id="pricing" style={{ padding: "5rem 2rem", background: "#f8f4ee" }}>
      <div style={{ maxWidth: 960, margin: "0 auto" }}>
        <div style={{ fontSize: ".75rem", fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", color: "#b4451f", marginBottom: ".6rem" }}>Pricing</div>
        <h2 style={{ fontSize: "2rem", fontWeight: 800, letterSpacing: "-.02em", marginBottom: "1rem" }}>Start free. Scale with confidence.</h2>
        <p style={{ fontSize: "1.05rem", color: "#8a8275", maxWidth: 640 }}>Open source at the core. Hosted tiers for teams that need it now.</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1.2rem", marginTop: "2.5rem", alignItems: "start" }}>

          <div style={{ background: "#fff", border: "1px solid #e3dccd", borderRadius: 10, padding: "1.8rem", boxShadow: "0 2px 12px rgba(26,23,20,.07)" }}>
            <div style={{ fontSize: ".8rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".08em", color: "#8a8275", marginBottom: ".5rem" }}>Free / Open Source</div>
            <div style={{ fontSize: "2.2rem", fontWeight: 900, letterSpacing: "-.03em" }}>$0</div>
            <p style={{ fontSize: ".87rem", color: "#8a8275", margin: ".6rem 0 1.2rem" }}>Self-host on your own infrastructure. MIT licensed.</p>
            <ul style={{ listStyle: "none", padding: 0, marginBottom: "1.6rem" }}>
              {["Unlimited agents (self-hosted)", "SHA-256 hash-chained recorder", "EU AI Act policy pack (YAML)", "Tribunal audit CLI", "Evidence pack export (HTML)", "Community support (GitHub)"].map(f => (
                <li key={f} style={{ fontSize: ".875rem", padding: ".3rem 0", borderBottom: "1px solid #e3dccd", display: "flex", alignItems: "flex-start", gap: ".5rem" }}>
                  <span style={{ color: "#b4451f", fontWeight: 700 }}>✓</span>{f}
                </li>
              ))}
            </ul>
            <a href="https://github.com/iWeslax83/blackbox-agent-accountability" target="_blank" rel="noopener" style={{ display: "block", textAlign: "center", width: "100%", padding: ".65rem 1rem", borderRadius: 7, fontSize: ".9rem", fontWeight: 600, background: "transparent", color: "#1a1714", border: "1.5px solid #e3dccd", textDecoration: "none" }}>View on GitHub</a>
          </div>

          <div style={{ background: "#fff", border: "2px solid #b4451f", borderRadius: 10, padding: "1.8rem", boxShadow: "0 4px 24px rgba(180,69,31,.15)", position: "relative" }}>
            <div style={{ position: "absolute", top: -12, left: "50%", transform: "translateX(-50%)", background: "#b4451f", color: "#fff", fontSize: ".72rem", fontWeight: 700, letterSpacing: ".06em", textTransform: "uppercase", padding: ".22rem .7rem", borderRadius: 4 }}>Recommended</div>
            <div style={{ fontSize: ".8rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".08em", color: "#8a8275", marginBottom: ".5rem" }}>Pro</div>
            <div style={{ fontSize: "2.2rem", fontWeight: 900, letterSpacing: "-.03em" }}>$49<sub style={{ fontSize: ".9rem", fontWeight: 500, color: "#8a8275" }}>/mo</sub></div>
            <p style={{ fontSize: ".87rem", color: "#8a8275", margin: ".6rem 0 1.2rem" }}>Managed cloud. Everything you need for a production AI team.</p>
            <ul style={{ listStyle: "none", padding: 0, marginBottom: "1.6rem" }}>
              {["Up to 10 agents managed", "Hosted dashboard and real-time log", "Automated tribunal runs on schedule", "PDF + HTML evidence pack exports", "Custom policy rules", "Priority email support"].map(f => (
                <li key={f} style={{ fontSize: ".875rem", padding: ".3rem 0", borderBottom: "1px solid #e3dccd", display: "flex", alignItems: "flex-start", gap: ".5rem" }}>
                  <span style={{ color: "#b4451f", fontWeight: 700 }}>✓</span>{f}
                </li>
              ))}
            </ul>
            <a href="/login" style={{ display: "block", textAlign: "center", width: "100%", padding: ".65rem 1rem", borderRadius: 7, fontSize: ".9rem", fontWeight: 600, background: "#b4451f", color: "#fff", textDecoration: "none" }}>Get started free</a>
          </div>

          <div style={{ background: "#fff", border: "1px solid #e3dccd", borderRadius: 10, padding: "1.8rem", boxShadow: "0 2px 12px rgba(26,23,20,.07)" }}>
            <div style={{ fontSize: ".8rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".08em", color: "#8a8275", marginBottom: ".5rem" }}>Enterprise</div>
            <div style={{ fontSize: "1.6rem", fontWeight: 900, letterSpacing: "-.03em" }}>Custom</div>
            <p style={{ fontSize: ".87rem", color: "#8a8275", margin: ".6rem 0 1.2rem" }}>For regulated industries, large deployments, on-prem needs.</p>
            <ul style={{ listStyle: "none", padding: 0, marginBottom: "1.6rem" }}>
              {["Unlimited agents", "SSO / SAML integration", "On-premises deployment", "Custom policy packs and mapping", "Dedicated SLA and support", "Regulator liaison assistance"].map(f => (
                <li key={f} style={{ fontSize: ".875rem", padding: ".3rem 0", borderBottom: "1px solid #e3dccd", display: "flex", alignItems: "flex-start", gap: ".5rem" }}>
                  <span style={{ color: "#b4451f", fontWeight: 700 }}>✓</span>{f}
                </li>
              ))}
            </ul>
            <a href="/login" style={{ display: "block", textAlign: "center", width: "100%", padding: ".65rem 1rem", borderRadius: 7, fontSize: ".9rem", fontWeight: 600, background: "transparent", color: "#1a1714", border: "1.5px solid #e3dccd", textDecoration: "none" }}>Contact us</a>
          </div>

        </div>
      </div>
    </section>
  );
}
