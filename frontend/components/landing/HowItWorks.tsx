export default function HowItWorks() {
  const pillars = [
    { title: "Recorder", desc: "Every agent action (LLM calls, tool invocations, results) is appended to a SHA-256 hash-chained log. Any silent edit breaks the chain immediately, providing tamper-evident provenance." },
    { title: "Tribunal", desc: "An autonomous multi-agent panel audits the full log against a structured EU AI Act policy pack. Each violation is flagged with cited evidence, article references, severity, and confidence score." },
    { title: "Replay", desc: "Reconstruct any incident step-by-step: see the exact decision chain, which prompt triggered which tool call, and where the root cause lies: indispensable for post-incident review." },
    { title: "Evidence Pack", desc: "One click exports an auditor-ready compliance report: incident summary, violation table with framework references, full action log, and chain-integrity status, formatted for regulators." },
  ];

  return (
    <section id="how" style={{ padding: "5rem 2rem", background: "#f4efe6" }}>
      <div style={{ maxWidth: 960, margin: "0 auto" }}>
        <div style={{ fontSize: ".75rem", fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", color: "#b4451f", marginBottom: ".6rem" }}>How it works</div>
        <h2 style={{ fontSize: "2rem", fontWeight: 800, letterSpacing: "-.02em", marginBottom: "1rem" }}>Four pillars of agent accountability</h2>
        <p style={{ fontSize: "1.05rem", color: "#8a8275", maxWidth: 640 }}>From first action to court-ready evidence pack, fully automated.</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: "1.2rem", marginTop: "2.5rem" }}>
          {pillars.map(({ title, desc }, i) => (
            <div key={title} style={{ background: "#fff", border: "1px solid #e3dccd", borderRadius: 10, padding: "1.5rem", boxShadow: "0 2px 12px rgba(26,23,20,.07)" }}>
              <div style={{ fontSize: ".8rem", fontWeight: 700, color: "#b4451f", marginBottom: ".75rem", fontFamily: "ui-monospace, monospace", letterSpacing: ".08em" }}>{String(i + 1).padStart(2, "0")}</div>
              <h3 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: ".4rem" }}>{title}</h3>
              <p style={{ fontSize: ".875rem", color: "#8a8275" }}>{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
