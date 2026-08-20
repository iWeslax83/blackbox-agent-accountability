import { DARK_BG, DARK_SURFACE, BORDER_ON_DARK, ACCENT_TEXT, TEXT_ON_DARK, MUTED_ON_DARK } from "@/lib/landingTheme";

const MONO_STACK = "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace";

const events = [
  { id: "4469", type: "llm_call", action: "invoke_model", hash: "7a10e4...2f9c", prev: "e651ab...c003" },
  { id: "4470", type: "tool_call", action: "read_customer_record", hash: "3c02de...771a", prev: "7a10e4...2f9c" },
  { id: "4471", type: "tool_call", action: "send_email", hash: "9f2a1c...e08b", prev: "3c02de...771a" },
];

export default function EvidenceLogCard({ size = "md" }: { size?: "md" | "lg" }) {
  const scale = size === "lg" ? 1.15 : 1;
  return (
    <div style={{
      background: DARK_SURFACE,
      border: `1px solid ${BORDER_ON_DARK}`,
      borderRadius: 10,
      overflow: "hidden",
      fontFamily: MONO_STACK,
      width: "100%",
      maxWidth: size === "lg" ? 480 : 420,
    }}>
      <div style={{
        display: "flex", alignItems: "center", gap: ".4rem",
        padding: `${0.6 * scale}rem ${0.9 * scale}rem`,
        borderBottom: `1px solid ${BORDER_ON_DARK}`,
        background: DARK_BG,
      }}>
        <span style={{ width: 7, height: 7, borderRadius: "50%", border: `1px solid ${BORDER_ON_DARK}` }} />
        <span style={{ width: 7, height: 7, borderRadius: "50%", border: `1px solid ${BORDER_ON_DARK}` }} />
        <span style={{ width: 7, height: 7, borderRadius: "50%", border: `1px solid ${BORDER_ON_DARK}` }} />
        <span style={{ fontSize: `${0.72 * scale}rem`, color: MUTED_ON_DARK, marginLeft: ".4rem" }}>agent_log.chain</span>
      </div>
      <div style={{ padding: `${0.9 * scale}rem ${1.1 * scale}rem`, fontSize: `${0.8 * scale}rem`, lineHeight: 1.65 }}>
        {events.map((e, i) => (
          <div key={e.id} style={{ marginBottom: i === events.length - 1 ? 0 : `${0.85 * scale}rem`, paddingBottom: i === events.length - 1 ? 0 : `${0.85 * scale}rem`, borderBottom: i === events.length - 1 ? "none" : `1px solid ${BORDER_ON_DARK}` }}>
            <div style={{ color: MUTED_ON_DARK, marginBottom: ".25rem" }}>event #{e.id} &middot; {e.type}</div>
            <div style={{ color: TEXT_ON_DARK }}>
              action: <span style={{ color: ACCENT_TEXT }}>{e.action}</span>
            </div>
            <div style={{ color: TEXT_ON_DARK }}>
              hash: <span style={{ color: MUTED_ON_DARK }}>{e.hash}</span>
            </div>
            {i === events.length - 1 && (
              <div style={{ color: TEXT_ON_DARK, marginTop: ".25rem" }}>
                chain: <span style={{ color: ACCENT_TEXT, fontWeight: 700 }}>INTACT</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
