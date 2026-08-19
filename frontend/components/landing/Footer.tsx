import { DARK_BG, TEXT_ON_DARK, MUTED_ON_DARK } from "@/lib/landingTheme";

export default function Footer() {
  return (
    <footer className="site-footer" style={{ background: DARK_BG, color: MUTED_ON_DARK, padding: "2rem", textAlign: "center", fontSize: ".83rem" }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: ".5rem" }}>
        <div><strong style={{ color: TEXT_ON_DARK }}>TELUVANE</strong>: AI Agent Accountability and Compliance</div>
        <div>
          <a href="https://github.com/iWeslax83/teluvane" target="_blank" rel="noopener" className="landing-link" style={{ color: MUTED_ON_DARK, textDecoration: "none" }}>GitHub</a>
          &nbsp;·&nbsp; MIT licensed &nbsp;·&nbsp;
          <a href="/login" className="landing-link" style={{ color: MUTED_ON_DARK, textDecoration: "none" }}>Dashboard</a>
          &nbsp;·&nbsp;
          <a href="/privacy" className="landing-link" style={{ color: MUTED_ON_DARK, textDecoration: "none" }}>Privacy</a>
          &nbsp;·&nbsp;
          <a href="/terms" className="landing-link" style={{ color: MUTED_ON_DARK, textDecoration: "none" }}>Terms</a>
        </div>
        <div style={{ fontSize: ".78rem", color: MUTED_ON_DARK, marginTop: ".25rem" }}>
          Bursa, Türkiye
        </div>
        <div style={{ fontSize: ".78rem", color: MUTED_ON_DARK }}>
          Not legal advice. TELUVANE is a technical tool, consult qualified counsel for regulatory guidance.
        </div>
      </div>
      <style>{`
        @media (max-width: 767px) {
          .site-footer { padding-bottom: calc(2rem + 64px); }
        }
      `}</style>
    </footer>
  );
}
