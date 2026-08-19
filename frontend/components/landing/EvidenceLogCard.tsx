import { DARK_SURFACE, BORDER_ON_DARK, ACCENT_TEXT, TEXT_ON_DARK, MUTED_ON_DARK } from "@/lib/landingTheme";

const MONO_STACK = "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace";

export default function EvidenceLogCard() {
  return (
    <div style={{
      background: DARK_SURFACE,
      border: `1px solid ${BORDER_ON_DARK}`,
      borderRadius: 8,
      padding: "1rem 1.2rem",
      fontFamily: MONO_STACK,
      fontSize: ".82rem",
      lineHeight: 1.7,
      maxWidth: 420,
    }}>
      <div style={{ color: MUTED_ON_DARK, marginBottom: ".3rem" }}>event #4471 &middot; tool_call</div>
      <div style={{ color: TEXT_ON_DARK }}>
        action: <span style={{ color: ACCENT_TEXT }}>send_email</span>
      </div>
      <div style={{ color: TEXT_ON_DARK }}>
        hash: <span style={{ color: MUTED_ON_DARK }}>9f2a1c...e08b</span>
      </div>
      <div style={{ color: TEXT_ON_DARK }}>
        prev_hash: <span style={{ color: MUTED_ON_DARK }}>3c02de...771a</span>
      </div>
      <div style={{ color: TEXT_ON_DARK }}>
        chain: <span style={{ color: ACCENT_TEXT, fontWeight: 700 }}>INTACT</span>
      </div>
    </div>
  );
}
