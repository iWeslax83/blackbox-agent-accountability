// Shared inline style objects for the legal pages (terms, privacy, accessibility) — they
// all use the same section/heading/body treatment, kept in one place instead of copied
// three times so a future type or spacing change only happens once.
import type { CSSProperties } from "react";

export const sectionStyle: CSSProperties = { marginBottom: "2rem" };
export const headingStyle: CSSProperties = { fontSize: "1.15rem", fontWeight: 700, marginBottom: ".6rem" };
export const bodyStyle: CSSProperties = { color: "#4a4540", lineHeight: 1.65 };
