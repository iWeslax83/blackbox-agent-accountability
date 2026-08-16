import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "flex-start",
          padding: "80px 96px",
          background: "#f4efe6",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            marginBottom: 40,
          }}
        >
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 14,
              background: "#1a1714",
              color: "#f4efe6",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 34,
              fontWeight: 800,
            }}
          >
            B
          </div>
          <div style={{ fontSize: 40, fontWeight: 800, color: "#1a1714", letterSpacing: "-0.02em" }}>
            BLACKBOX
          </div>
        </div>
        <div
          style={{
            fontSize: 52,
            fontWeight: 900,
            letterSpacing: "-0.03em",
            lineHeight: 1.1,
            color: "#1a1714",
            maxWidth: 900,
            display: "contents",
          }}
        >
          Prove what your <span style={{ color: "#b4451f" }}>AI agents</span> did.
        </div>
        <div
          style={{
            fontSize: 24,
            color: "#8a8275",
            marginTop: 24,
            maxWidth: 800,
          }}
        >
          Tamper-evident flight recorder and autonomous compliance tribunal for AI agents.
        </div>
      </div>
    ),
    { ...size }
  );
}
