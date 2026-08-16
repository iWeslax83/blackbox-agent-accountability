export interface ChainBlock {
  id: number;
  shortHash: string;
  x: number;
  y: number;
  z: number;
}

// Deterministic pseudo-hash: not cryptographic, purely visual filler
// text for the 3D/SVG chain blocks (mirrors the product's real
// SHA-256 hash-chain concept without pretending to compute one).
function pseudoHash(seed: number): string {
  const hex = Math.abs(Math.sin(seed * 999.77) * 0xffffffff)
    .toString(16)
    .padEnd(8, "0");
  return hex.slice(0, 8);
}

export function buildChainBlocks(count: number): ChainBlock[] {
  const blocks: ChainBlock[] = [];
  const spacing = 1.6;
  for (let i = 0; i < count; i++) {
    blocks.push({
      id: i,
      shortHash: pseudoHash(i + 1),
      x: i * spacing,
      y: i % 2 === 0 ? 0 : 0.35,
      z: 0,
    });
  }
  return blocks;
}
