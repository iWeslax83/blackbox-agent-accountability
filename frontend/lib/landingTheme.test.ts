import { describe, it, expect } from "vitest";
import { meetsWcagAA } from "./contrast";
import { DARK_BG, TEXT_ON_DARK, ACCENT_TEXT, MUTED_ON_DARK } from "./landingTheme";

describe("landingTheme contrast", () => {
  it("TEXT_ON_DARK meets AA normal text against DARK_BG", () => {
    expect(meetsWcagAA(DARK_BG, TEXT_ON_DARK)).toBe(true);
  });

  it("ACCENT_TEXT meets AA normal text against DARK_BG", () => {
    expect(meetsWcagAA(DARK_BG, ACCENT_TEXT)).toBe(true);
  });

  it("MUTED_ON_DARK meets AA large text against DARK_BG", () => {
    expect(meetsWcagAA(DARK_BG, MUTED_ON_DARK, true)).toBe(true);
  });
});
