import { describe, it, expect } from "vitest";
import { buildChainBlocks } from "./chainData";

describe("buildChainBlocks", () => {
  it("returns the requested number of blocks", () => {
    expect(buildChainBlocks(6)).toHaveLength(6);
  });

  it("gives each block a unique sequential id starting at 0", () => {
    const blocks = buildChainBlocks(4);
    expect(blocks.map((b) => b.id)).toEqual([0, 1, 2, 3]);
  });

  it("produces deterministic output for the same count", () => {
    expect(buildChainBlocks(5)).toEqual(buildChainBlocks(5));
  });

  it("gives each block an 8-character hex shortHash", () => {
    const blocks = buildChainBlocks(3);
    for (const block of blocks) {
      expect(block.shortHash).toMatch(/^[0-9a-f]{8}$/);
    }
  });

  it("spaces blocks apart along x so the chain reads left to right", () => {
    const blocks = buildChainBlocks(4);
    for (let i = 1; i < blocks.length; i++) {
      expect(blocks[i].x).toBeGreaterThan(blocks[i - 1].x);
    }
  });

  it("returns an empty array for count 0", () => {
    expect(buildChainBlocks(0)).toEqual([]);
  });
});
