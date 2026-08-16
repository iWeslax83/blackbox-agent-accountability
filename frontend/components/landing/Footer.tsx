export default function Footer() {
  return (
    <footer style={{ background: "#1a1714", color: "#8a8275", padding: "2rem", textAlign: "center", fontSize: ".83rem" }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: ".5rem" }}>
        <div><strong style={{ color: "#c9bfaf" }}>BLACKBOX</strong>: AI Agent Accountability and Compliance</div>
        <div>
          <a href="https://github.com/iWeslax83/blackbox-agent-accountability" target="_blank" rel="noopener" style={{ color: "#a09890", textDecoration: "none" }}>GitHub</a>
          &nbsp;·&nbsp; MIT licensed &nbsp;·&nbsp;
          <a href="/login" style={{ color: "#a09890", textDecoration: "none" }}>Dashboard</a>
        </div>
        <div style={{ fontSize: ".78rem", color: "#5a524a", marginTop: ".25rem" }}>
          Not legal advice. BLACKBOX is a technical tool, consult qualified counsel for regulatory guidance.
        </div>
      </div>
    </footer>
  );
}
