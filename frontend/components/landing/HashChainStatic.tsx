// frontend/components/landing/HashChainStatic.tsx
import { buildChainBlocks } from "@/lib/chainData";

const RUST = "#b4451f";
const INK = "#1a1714";
const LINE = "#c9bfaf";

export default function HashChainStatic() {
  const blocks = buildChainBlocks(6);
  const blockSize = 64;
  const gapX = 96;
  const width = blocks.length * gapX + blockSize;
  const height = 160;
  const centerY = height / 2;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width="100%"
      role="img"
      aria-label="Six linked hash-chain blocks, the last one highlighted, representing BLACKBOX's tamper-evident log chain"
    >
      {blocks.slice(0, -1).map((block, i) => (
        <line
          key={`line-${block.id}`}
          x1={i * gapX + blockSize}
          y1={centerY + (block.y === 0 ? 0 : -16)}
          x2={(i + 1) * gapX}
          y2={centerY + (blocks[i + 1].y === 0 ? 0 : -16)}
          stroke={LINE}
          strokeWidth={3}
        />
      ))}
      {blocks.map((block, i) => (
        <g key={block.id} transform={`translate(${block.x === 0 ? 0 : i * gapX}, ${centerY - blockSize / 2 + (block.y === 0 ? 0 : -16)})`}>
          <rect
            width={blockSize}
            height={blockSize}
            rx={6}
            fill={i === blocks.length - 1 ? RUST : INK}
          />
          <text
            x={blockSize / 2}
            y={blockSize / 2 + 4}
            textAnchor="middle"
            fontFamily="ui-monospace, monospace"
            fontSize={10}
            fill="#f4efe6"
          >
            {block.shortHash.slice(0, 6)}
          </text>
        </g>
      ))}
    </svg>
  );
}
