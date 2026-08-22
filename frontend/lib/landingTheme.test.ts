import { describe, it, expect } from "vitest";
import { meetsWcagAA } from "./contrast";
import { BG, INK, ACCENT, MUTED } from "./landingTheme";

describe("landingTheme contrast", () => {
  it("INK meets AA normal text against BG", () => {
    expect(meetsWcagAA(BG, INK)).toBe(true);
  });

  it("ACCENT meets AA normal text against BG", () => {
    expect(meetsWcagAA(BG, ACCENT)).toBe(true);
  });

  it("MUTED meets AA large text against BG", () => {
    expect(meetsWcagAA(BG, MUTED, true)).toBe(true);
  });
});
