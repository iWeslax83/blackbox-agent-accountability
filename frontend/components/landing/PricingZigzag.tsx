import { DARK_SURFACE, BORDER_ON_DARK, ACCENT_FILL, ACCENT_TEXT, TEXT_ON_DARK, MUTED_ON_DARK } from "@/lib/landingTheme";

function Tier({
  eyebrow, price, priceSuffix, description, features, ctaLabel, ctaHref, emphasized, align,
}: {
  eyebrow: string; price: string; priceSuffix?: string; description: string;
  features: string[]; ctaLabel: string; ctaHref: string; emphasized?: boolean;
  align: "left" | "right";
}) {
  return (
    <div style={{
      maxWidth: 460,
      marginLeft: align === "right" ? "auto" : 0,
      marginRight: align === "left" ? "auto" : 0,
      background: DARK_SURFACE,
      border: `1px solid ${emphasized ? ACCENT_FILL : BORDER_ON_DARK}`,
      borderRadius: 12,
      padding: "2rem",
      marginBottom: "3rem",
    }}>
      <div style={{ fontSize: ".78rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".07em", color: MUTED_ON_DARK, marginBottom: ".5rem" }}>
        {eyebrow}
      </div>
      <div style={{ fontSize: "2.4rem", fontWeight: 900, letterSpacing: "-.03em", color: TEXT_ON_DARK }}>
        {price}
        {priceSuffix && <sub style={{ fontSize: "1rem", fontWeight: 500, color: MUTED_ON_DARK }}>{priceSuffix}</sub>}
      </div>
      <p style={{ fontSize: ".9rem", color: MUTED_ON_DARK, margin: ".6rem 0 1.4rem" }}>{description}</p>
      <ul style={{ listStyle: "none", padding: 0, marginBottom: "1.6rem" }}>
        {features.map((f) => (
          <li key={f} style={{ fontSize: ".875rem", padding: ".35rem 0", borderBottom: `1px solid ${BORDER_ON_DARK}`, display: "flex", gap: ".5rem", color: TEXT_ON_DARK }}>
            <span style={{ color: ACCENT_TEXT, fontWeight: 700 }}>&#10003;</span>{f}
          </li>
        ))}
      </ul>
      <a href={ctaHref} target={ctaHref.startsWith("http") ? "_blank" : undefined} rel={ctaHref.startsWith("http") ? "noopener" : undefined} className="landing-btn" style={{
        display: "block", textAlign: "center", padding: ".7rem 1rem", borderRadius: 7,
        fontSize: ".9rem", fontWeight: 600, textDecoration: "none",
        background: emphasized ? ACCENT_FILL : "transparent",
        color: emphasized ? "#fff" : TEXT_ON_DARK,
        border: emphasized ? "none" : `1.5px solid ${BORDER_ON_DARK}`,
      }}>
        {ctaLabel}
      </a>
    </div>
  );
}

export default function PricingZigzag() {
  return (
    <div>
      <div style={{ fontSize: ".78rem", fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", color: ACCENT_TEXT, marginBottom: ".6rem" }}>
        Pricing
      </div>
      <h2 style={{ fontSize: "2rem", fontWeight: 800, letterSpacing: "-.02em", marginBottom: "2.5rem", color: TEXT_ON_DARK }}>
        Start free. Scale with confidence.
      </h2>

      <Tier
        align="left"
        eyebrow="Free / Open Source"
        price="$0"
        description="Self-host on your own infrastructure. MIT licensed."
        features={["Unlimited agents (self-hosted)", "SHA-256 hash-chained recorder", "EU AI Act policy pack (YAML)", "Tribunal audit CLI", "Evidence pack export (HTML)", "Community support (GitHub)"]}
        ctaLabel="View on GitHub"
        ctaHref="https://github.com/iWeslax83/blackbox-agent-accountability"
      />
      <Tier
        align="right"
        emphasized
        eyebrow="Pro"
        price="$49"
        priceSuffix="/mo"
        description="Managed cloud. Everything you need for a production AI team."
        features={["Up to 10 agents managed", "Hosted dashboard and real-time log", "Automated tribunal runs on schedule", "PDF + HTML evidence pack exports", "Custom policy rules", "Priority email support"]}
        ctaLabel="Get started free"
        ctaHref="/login"
      />
      <Tier
        align="left"
        eyebrow="Enterprise"
        price="Custom"
        description="For regulated industries, large deployments, on-prem needs."
        features={["Unlimited agents", "SSO / SAML integration", "On-premises deployment", "Custom policy packs and mapping", "Dedicated SLA and support", "Regulator liaison assistance"]}
        ctaLabel="Contact us"
        ctaHref="/login"
      />
    </div>
  );
}
