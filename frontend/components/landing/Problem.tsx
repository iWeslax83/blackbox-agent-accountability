export default function Problem() {
  return (
    <section id="problem" style={{ padding: "5rem 2rem", background: "#1a1714", color: "#f4efe6" }}>
      <div style={{ maxWidth: 960, margin: "0 auto" }}>
        <div style={{ fontSize: ".75rem", fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", color: "#b4451f", marginBottom: ".6rem" }}>The problem</div>
        <h2 style={{ fontSize: "2rem", fontWeight: 800, letterSpacing: "-.02em", marginBottom: "1rem", color: "#fff" }}>
          The EU AI Act is already in force.<br />Your logs are not evidence.
        </h2>
        <p style={{ fontSize: "1.05rem", color: "#a09890", maxWidth: 640 }}>
          High-risk AI systems face mandatory logging, traceability, and human-oversight
          requirements, enforceable now, with heavy penalties by 2026. Generic observability
          tools like LangSmith or Langfuse show traces for debugging, not adjudication.
          When a regulator asks &quot;what did your agent do and why?&quot; most teams have nothing
          auditor-ready to show.
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1.2rem", marginTop: "2.5rem" }}>
          {[
            { num: "€35M", text: "Maximum fine for non-compliance with EU AI Act obligations (or 7% of global revenue)" },
            { num: "2026", text: "Full obligations in force for high-risk AI systems across all EU member states" },
            { num: "0", text: "Purpose-built tools for AI agent compliance adjudication before BLACKBOX" },
            { num: "Art.15", text: "Robustness and cybersecurity requirements your agent logs must now demonstrate compliance with" },
          ].map(({ num, text }) => (
            <div key={num} style={{ background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.08)", borderRadius: 10, padding: "1.4rem" }}>
              <div style={{ fontSize: "2rem", fontWeight: 800, color: "#b4451f" }}>{num}</div>
              <p style={{ fontSize: ".87rem", color: "#8a8275", marginTop: ".3rem" }}>{text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
