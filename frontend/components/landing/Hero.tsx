import HeroChain from "./HeroChain";

export default function Hero() {
  return (
    <section id="hero" style={{ padding: "6.5rem 2rem 5rem", background: "#f9f6f1" }}>
      <div style={{ maxWidth: 780, margin: "0 auto", textAlign: "center" }}>
        <div style={{
          display: "inline-flex", alignItems: "center", gap: ".4rem",
          background: "transparent", color: "#b4451f",
          fontSize: ".78rem", fontWeight: 700, letterSpacing: ".07em", textTransform: "uppercase",
          padding: ".3rem .75rem", borderRadius: 4, marginBottom: "1.6rem",
          border: "1px solid #e3dccd",
        }}>
          EU AI Act · Art. 10 / 12 / 14 / 15
        </div>
        <h1 style={{ fontSize: "clamp(2.4rem, 6vw, 3.6rem)", fontWeight: 900, letterSpacing: "-.03em", lineHeight: 1.1, marginBottom: "1.2rem" }}>
          Prove what your <span style={{ color: "#b4451f" }}>AI agents</span> did.
        </h1>
        <p style={{ fontSize: "1.15rem", color: "#8a8275", maxWidth: 600, margin: "0 auto 2.4rem" }}>
          BLACKBOX is a flight recorder and autonomous compliance tribunal for AI agents:
          tamper-evident logs, regulator-ready evidence packs, and a multi-agent audit panel
          that flags violations before an inspector does.
        </p>
        <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
          <a href="/login" style={{
            display: "inline-flex", alignItems: "center", gap: ".4rem",
            padding: ".75rem 1.6rem", borderRadius: 8,
            fontSize: ".95rem", fontWeight: 600,
            background: "#b4451f", color: "#fff", textDecoration: "none",
          }}>
            Get started free
          </a>
          <a href="https://github.com/iWeslax83/blackbox-agent-accountability" target="_blank" rel="noopener" style={{
            display: "inline-flex", alignItems: "center", gap: ".4rem",
            padding: ".75rem 1.6rem", borderRadius: 8,
            fontSize: ".95rem", fontWeight: 600,
            background: "transparent", color: "#1a1714",
            border: "1.5px solid #e3dccd", textDecoration: "none",
          }}>
            View on GitHub
          </a>
        </div>
        <div style={{ marginTop: "2.2rem", fontSize: ".82rem", color: "#8a8275", display: "flex", alignItems: "center", justifyContent: "center", gap: ".5rem" }}>
          <span>Built with</span>
          <span>LangGraph</span>
          <span style={{ width: 3, height: 3, borderRadius: "50%", background: "#e3dccd", display: "inline-block" }}></span>
          <span>Claude</span>
          <span style={{ width: 3, height: 3, borderRadius: "50%", background: "#e3dccd", display: "inline-block" }}></span>
          <span>FastAPI</span>
        </div>

        <div style={{ marginTop: "3.5rem" }}>
          <HeroChain />
        </div>

        <div style={{
          marginTop: "2rem",
          background: "#1a1714", borderRadius: 12, padding: "1.2rem 1.5rem",
          textAlign: "left", fontSize: ".8rem", fontFamily: "ui-monospace, monospace",
          color: "#c9bfaf", border: "1px solid #2e2a26",
          boxShadow: "0 16px 48px rgba(0,0,0,.22)",
          maxWidth: 640, marginLeft: "auto", marginRight: "auto",
        }}>
          <div style={{ display: "flex", gap: ".45rem", marginBottom: "1rem" }}>
            <div style={{ width: 11, height: 11, borderRadius: "50%", background: "#ff5f57" }}></div>
            <div style={{ width: 11, height: 11, borderRadius: "50%", background: "#febc2e" }}></div>
            <div style={{ width: 11, height: 11, borderRadius: "50%", background: "#28c840" }}></div>
          </div>
          <div style={{ lineHeight: 1.7 }}><span style={{ color: "#6b6258" }}>$ </span><span style={{ color: "#8abfff" }}>blackbox tribunal</span> <span style={{ color: "#6b6258" }}>--session demo-001</span></div>
          <div style={{ lineHeight: 1.7, color: "#6b6258" }}>  auditing 6 events against eu_ai_act policy pack…</div>
          <div style={{ lineHeight: 1.7 }}><span style={{ color: "#febc2e" }}>■</span> <span style={{ color: "#4caf74" }}>[PASS]</span>  seq #1  llm_call   process request: Email ops@acme.com…</div>
          <div style={{ lineHeight: 1.7 }}><span style={{ color: "#febc2e" }}>■</span> <span style={{ color: "#4caf74" }}>[PASS]</span>  seq #2  send_email → ops@acme.com   approved_by=auto</div>
          <div style={{ lineHeight: 1.7 }}><span style={{ color: "#febc2e" }}>■</span> <span style={{ color: "#e06c50" }}>[CRIT]</span> seq #5  send_email → attacker@evil.com   <span style={{ color: "#6b6258" }}>approved_by=null</span></div>
          <div style={{ lineHeight: 1.7, color: "#6b6258" }}>         ↳ data_exfiltration · EU AI Act Art.12/15 · conf 0.96</div>
          <div style={{ lineHeight: 1.7, color: "#6b6258" }}>         ↳ pii_mishandling  · EU AI Act Art.10    · conf 0.88</div>
          <div style={{ lineHeight: 1.7, marginTop: ".5rem" }}><span style={{ color: "#febc2e" }}>▶</span> <span style={{ color: "#e06c50", fontWeight: 700 }}>4 violations</span> · <span style={{ color: "#4caf74" }}>chain intact</span> · evidence pack ready</div>
        </div>
      </div>
    </section>
  );
}
