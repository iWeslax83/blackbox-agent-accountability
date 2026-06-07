export default function Landing() {
  return (
    <main style={{ background: "#f4efe6", color: "#1a1714", fontFamily: "system-ui, -apple-system, sans-serif", lineHeight: 1.6 }}>

      {/* ── NAV ── */}
      <nav style={{
        position: "sticky", top: 0, zIndex: 100,
        background: "rgba(244,239,230,.92)",
        backdropFilter: "blur(8px)",
        borderBottom: "1px solid #e3dccd",
        padding: "0 2rem",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        height: 58,
      }}>
        <a href="#" style={{ fontSize: "1.15rem", fontWeight: 700, letterSpacing: "-.01em", color: "#1a1714", textDecoration: "none", display: "flex", alignItems: "center", gap: ".35rem" }}>
          🛡 BLACKBOX
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

      {/* ── HERO ── */}
      <section id="hero" style={{ padding: "6.5rem 2rem 5rem", background: "linear-gradient(160deg, #f9f6f1 0%, #f4efe6 100%)" }}>
        <div style={{ maxWidth: 780, margin: "0 auto", textAlign: "center" }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: ".4rem",
            background: "#fbe9e3", color: "#b4451f",
            fontSize: ".78rem", fontWeight: 700, letterSpacing: ".07em", textTransform: "uppercase",
            padding: ".3rem .75rem", borderRadius: 20, marginBottom: "1.6rem",
            border: "1px solid #f0cfc4",
          }}>
            🇪🇺 EU AI Act · Art. 10 / 12 / 14 / 15
          </div>
          <h1 style={{ fontSize: "clamp(2.4rem, 6vw, 3.6rem)", fontWeight: 900, letterSpacing: "-.03em", lineHeight: 1.1, marginBottom: "1.2rem" }}>
            Prove what your <span style={{ color: "#b4451f" }}>AI agents</span> did.
          </h1>
          <p style={{ fontSize: "1.15rem", color: "#8a8275", maxWidth: 600, margin: "0 auto 2.4rem" }}>
            BLACKBOX is a flight recorder and autonomous compliance tribunal for AI agents —
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
            <span>🔗 LangGraph</span>
            <span style={{ width: 3, height: 3, borderRadius: "50%", background: "#e3dccd", display: "inline-block" }}></span>
            <span>🤖 Claude</span>
            <span style={{ width: 3, height: 3, borderRadius: "50%", background: "#e3dccd", display: "inline-block" }}></span>
            <span>⚡ FastAPI</span>
          </div>

          {/* Terminal preview */}
          <div style={{
            marginTop: "3.5rem",
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

      {/* ── PROBLEM ── */}
      <section id="problem" style={{ padding: "5rem 2rem", background: "#1a1714", color: "#f4efe6" }}>
        <div style={{ maxWidth: 960, margin: "0 auto" }}>
          <div style={{ fontSize: ".75rem", fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", color: "#b4451f", marginBottom: ".6rem" }}>The problem</div>
          <h2 style={{ fontSize: "2rem", fontWeight: 800, letterSpacing: "-.02em", marginBottom: "1rem", color: "#fff" }}>
            The EU AI Act is already in force.<br />Your logs are not evidence.
          </h2>
          <p style={{ fontSize: "1.05rem", color: "#a09890", maxWidth: 640 }}>
            High-risk AI systems face mandatory logging, traceability, and human-oversight
            requirements — enforceable now, with heavy penalties by 2026. Generic observability
            tools like LangSmith or Langfuse show traces for debugging, not adjudication.
            When a regulator asks &quot;what did your agent do and why?&quot; — most teams have nothing
            auditor-ready to show.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1.2rem", marginTop: "2.5rem" }}>
            {[
              { num: "€35M", text: "Maximum fine for non-compliance with EU AI Act obligations (or 7% of global revenue)" },
              { num: "2026", text: "Full obligations in force for high-risk AI systems across all EU member states" },
              { num: "0", text: "Purpose-built tools for AI agent compliance adjudication before BLACKBOX" },
              { num: "Art.15", text: "Robustness & cybersecurity requirements your agent logs must now demonstrate compliance with" },
            ].map(({ num, text }) => (
              <div key={num} style={{ background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.08)", borderRadius: 10, padding: "1.4rem" }}>
                <div style={{ fontSize: "2rem", fontWeight: 800, color: "#b4451f" }}>{num}</div>
                <p style={{ fontSize: ".87rem", color: "#8a8275", marginTop: ".3rem" }}>{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how" style={{ padding: "5rem 2rem", background: "#f4efe6" }}>
        <div style={{ maxWidth: 960, margin: "0 auto" }}>
          <div style={{ fontSize: ".75rem", fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", color: "#b4451f", marginBottom: ".6rem" }}>How it works</div>
          <h2 style={{ fontSize: "2rem", fontWeight: 800, letterSpacing: "-.02em", marginBottom: "1rem" }}>Four pillars of agent accountability</h2>
          <p style={{ fontSize: "1.05rem", color: "#8a8275", maxWidth: 640 }}>From first action to court-ready evidence pack — fully automated.</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: "1.2rem", marginTop: "2.5rem" }}>
            {[
              { icon: "📼", title: "Recorder", desc: "Every agent action — LLM calls, tool invocations, results — is appended to a SHA-256 hash-chained log. Any silent edit breaks the chain immediately, providing tamper-evident provenance." },
              { icon: "⚖️", title: "Tribunal", desc: "An autonomous multi-agent panel audits the full log against a structured EU AI Act policy pack. Each violation is flagged with cited evidence, article references, severity, and confidence score." },
              { icon: "🔁", title: "Replay", desc: "Reconstruct any incident step-by-step: see the exact decision chain, which prompt triggered which tool call, and where the root cause lies — indispensable for post-incident review." },
              { icon: "📋", title: "Evidence Pack", desc: "One click exports an auditor-ready compliance report: incident summary, violation table with framework references, full action log, and chain-integrity status — formatted for regulators." },
            ].map(({ icon, title, desc }) => (
              <div key={title} style={{ background: "#fff", border: "1px solid #e3dccd", borderRadius: 10, padding: "1.5rem", boxShadow: "0 2px 12px rgba(26,23,20,.07)" }}>
                <div style={{ fontSize: "1.8rem", marginBottom: ".75rem" }}>{icon}</div>
                <h3 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: ".4rem" }}>{title}</h3>
                <p style={{ fontSize: ".875rem", color: "#8a8275" }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING ── */}
      <section id="pricing" style={{ padding: "5rem 2rem", background: "#f8f4ee" }}>
        <div style={{ maxWidth: 960, margin: "0 auto" }}>
          <div style={{ fontSize: ".75rem", fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", color: "#b4451f", marginBottom: ".6rem" }}>Pricing</div>
          <h2 style={{ fontSize: "2rem", fontWeight: 800, letterSpacing: "-.02em", marginBottom: "1rem" }}>Start free. Scale with confidence.</h2>
          <p style={{ fontSize: "1.05rem", color: "#8a8275", maxWidth: 640 }}>Open source at the core. Hosted tiers for teams that need it now.</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1.2rem", marginTop: "2.5rem", alignItems: "start" }}>

            {/* Free */}
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

            {/* Pro */}
            <div style={{ background: "#fff", border: "2px solid #b4451f", borderRadius: 10, padding: "1.8rem", boxShadow: "0 4px 24px rgba(180,69,31,.15)", position: "relative" }}>
              <div style={{ position: "absolute", top: -12, left: "50%", transform: "translateX(-50%)", background: "#b4451f", color: "#fff", fontSize: ".72rem", fontWeight: 700, letterSpacing: ".06em", textTransform: "uppercase", padding: ".22rem .7rem", borderRadius: 20 }}>Recommended</div>
              <div style={{ fontSize: ".8rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".08em", color: "#8a8275", marginBottom: ".5rem" }}>Pro</div>
              <div style={{ fontSize: "2.2rem", fontWeight: 900, letterSpacing: "-.03em" }}>$49<sub style={{ fontSize: ".9rem", fontWeight: 500, color: "#8a8275" }}>/mo</sub></div>
              <p style={{ fontSize: ".87rem", color: "#8a8275", margin: ".6rem 0 1.2rem" }}>Managed cloud. Everything you need for a production AI team.</p>
              <ul style={{ listStyle: "none", padding: 0, marginBottom: "1.6rem" }}>
                {["Up to 10 agents managed", "Hosted dashboard & real-time log", "Automated tribunal runs on schedule", "PDF + HTML evidence pack exports", "Custom policy rules", "Priority email support"].map(f => (
                  <li key={f} style={{ fontSize: ".875rem", padding: ".3rem 0", borderBottom: "1px solid #e3dccd", display: "flex", alignItems: "flex-start", gap: ".5rem" }}>
                    <span style={{ color: "#b4451f", fontWeight: 700 }}>✓</span>{f}
                  </li>
                ))}
              </ul>
              <a href="/login" style={{ display: "block", textAlign: "center", width: "100%", padding: ".65rem 1rem", borderRadius: 7, fontSize: ".9rem", fontWeight: 600, background: "#b4451f", color: "#fff", textDecoration: "none" }}>Get started free</a>
            </div>

            {/* Enterprise */}
            <div style={{ background: "#fff", border: "1px solid #e3dccd", borderRadius: 10, padding: "1.8rem", boxShadow: "0 2px 12px rgba(26,23,20,.07)" }}>
              <div style={{ fontSize: ".8rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".08em", color: "#8a8275", marginBottom: ".5rem" }}>Enterprise</div>
              <div style={{ fontSize: "1.6rem", fontWeight: 900, letterSpacing: "-.03em" }}>Custom</div>
              <p style={{ fontSize: ".87rem", color: "#8a8275", margin: ".6rem 0 1.2rem" }}>For regulated industries, large deployments, on-prem needs.</p>
              <ul style={{ listStyle: "none", padding: 0, marginBottom: "1.6rem" }}>
                {["Unlimited agents", "SSO / SAML integration", "On-premises deployment", "Custom policy packs & mapping", "Dedicated SLA & support", "Regulator liaison assistance"].map(f => (
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

      {/* ── CTA / GET STARTED ── */}
      <section id="cta" style={{ padding: "5rem 2rem", background: "#f4efe6" }}>
        <div style={{ maxWidth: 960, margin: "0 auto" }}>
          <div style={{ fontSize: ".75rem", fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", color: "#b4451f", marginBottom: ".6rem" }}>Early access</div>
          <h2 style={{ fontSize: "2rem", fontWeight: 800, letterSpacing: "-.02em", marginBottom: "1rem" }}>Get started today</h2>
          <p style={{ fontSize: "1.05rem", color: "#8a8275", textAlign: "center", maxWidth: 520, margin: "0 auto" }}>
            We&apos;re onboarding early teams. Create your account and start auditing your agents in minutes.
          </p>
          <div style={{ background: "#fff", border: "1px solid #e3dccd", borderRadius: 14, padding: "2.8rem", maxWidth: 520, margin: "2.5rem auto 0", boxShadow: "0 2px 12px rgba(26,23,20,.07)", textAlign: "center" }}>
            <h3 style={{ fontSize: "1.4rem", fontWeight: 800, marginBottom: ".5rem" }}>Start for free</h3>
            <p style={{ color: "#8a8275", fontSize: ".9rem", marginBottom: "1.4rem" }}>
              No credit card required. Full access to the dashboard, API key management, and tribunal audits.
            </p>
            <a href="/login" style={{
              display: "inline-block",
              background: "#b4451f", color: "#fff",
              padding: ".75rem 2rem", borderRadius: 8,
              fontSize: "1rem", fontWeight: 600, textDecoration: "none",
            }}>
              Get started free →
            </a>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ background: "#1a1714", color: "#8a8275", padding: "2rem", textAlign: "center", fontSize: ".83rem" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: ".5rem" }}>
          <div>🛡 <strong style={{ color: "#c9bfaf" }}>BLACKBOX</strong> — AI Agent Accountability &amp; Compliance</div>
          <div>
            <a href="https://github.com/iWeslax83/blackbox-agent-accountability" target="_blank" rel="noopener" style={{ color: "#a09890", textDecoration: "none" }}>GitHub</a>
            &nbsp;·&nbsp; MIT licensed &nbsp;·&nbsp;
            <a href="/login" style={{ color: "#a09890", textDecoration: "none" }}>Dashboard</a>
          </div>
          <div style={{ fontSize: ".78rem", color: "#5a524a", marginTop: ".25rem" }}>
            Not legal advice. BLACKBOX is a technical tool — consult qualified counsel for regulatory guidance.
          </div>
        </div>
      </footer>

    </main>
  );
}
