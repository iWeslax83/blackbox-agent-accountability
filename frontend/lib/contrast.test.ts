import { describe, it, expect } from "vitest";
import { contrastRatio, meetsWcagAA } from "./contrast";

describe("contrastRatio", () => {
  it("returns 21 for pure black against pure white", () => {
    expect(contrastRatio("#000000", "#ffffff")).toBeCloseTo(21, 0);
  });

  it("returns 1 for a color against itself", () => {
    expect(contrastRatio("#b4451f", "#b4451f")).toBeCloseTo(1, 1);
  });

  it("is symmetric", () => {
    const a = contrastRatio("#0d0c0b", "#f4efe6");
    const b = contrastRatio("#f4efe6", "#0d0c0b");
    expect(a).toBeCloseTo(b, 5);
  });
});

describe("meetsWcagAA", () => {
  it("passes for the near-black background against the off-white text color", () => {
    expect(meetsWcagAA("#0d0c0b", "#f4efe6")).toBe(true);
  });

  it("fails for two near-identical dark grays as normal text", () => {
    expect(meetsWcagAA("#0d0c0b", "#141311")).toBe(false);
  });

  it("allows a lower ratio for large text", () => {
    // a ratio that fails 4.5:1 normal-text but clears 3:1 large-text
    const passesLarge = meetsWcagAA("#0d0c0b", "#8a6a55", true);
    const passesNormal = meetsWcagAA("#0d0c0b", "#8a6a55", false);
    expect(passesLarge).toBe(true);
    expect(passesNormal).toBe(false);
  });
});
