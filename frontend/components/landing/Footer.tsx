import { TEXT_ON_LIGHT, MUTED_ON_LIGHT, BG_LIGHT, BORDER_ON_LIGHT } from "@/lib/landingTheme";

export default function Footer() {
  return (
    <footer className="site-footer" style={{ background: BG_LIGHT, color: MUTED_ON_LIGHT, padding: "2rem", textAlign: "center", fontSize: ".83rem", borderTop: `1px solid ${BORDER_ON_LIGHT}` }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: ".5rem" }}>
        <div><strong style={{ color: TEXT_ON_LIGHT }}>TELUVANE</strong>: AI Agent Accountability and Compliance</div>
        <div>
          <a href="https://github.com/iWeslax83/teluvane" target="_blank" rel="noopener" className="landing-link" style={{ color: MUTED_ON_LIGHT, textDecoration: "none" }}>GitHub</a>
          &nbsp;·&nbsp; AGPL-3.0 licensed &nbsp;·&nbsp;
          <a href="/login" className="landing-link" style={{ color: MUTED_ON_LIGHT, textDecoration: "none" }}>Dashboard</a>
          &nbsp;·&nbsp;
          <a href="/privacy" className="landing-link" style={{ color: MUTED_ON_LIGHT, textDecoration: "none" }}>Privacy</a>
          &nbsp;·&nbsp;
          <a href="/terms" className="landing-link" style={{ color: MUTED_ON_LIGHT, textDecoration: "none" }}>Terms</a>
        </div>
        <div style={{ fontSize: ".78rem", color: MUTED_ON_LIGHT, marginTop: ".25rem" }}>
          Bursa, Türkiye
        </div>
        <div style={{ fontSize: ".78rem", color: MUTED_ON_LIGHT }}>
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
