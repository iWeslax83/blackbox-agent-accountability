"use client";

import type { ChainBlock } from "@/lib/chainData";
import { DARK_SURFACE, ACCENT_FILL, BORDER_ON_DARK } from "@/lib/landingTheme";

export default function ChainBlocksGroup({
  blocks,
  centerX,
}: {
  blocks: ChainBlock[];
  centerX?: number;
}) {
  const offset = centerX ?? ((blocks.length - 1) * 1.6) / 2;

  return (
    <group>
      {blocks.map((block, i) => (
        <group key={block.id} position={[block.x - offset, block.y, block.z]}>
          <mesh>
            <boxGeometry args={[0.9, 0.9, 0.9]} />
            <meshStandardMaterial
              color={i === blocks.length - 1 ? ACCENT_FILL : DARK_SURFACE}
              roughness={0.45}
              metalness={0.15}
              emissive={i === blocks.length - 1 ? ACCENT_FILL : "#000000"}
              emissiveIntensity={i === blocks.length - 1 ? 0.25 : 0}
            />
          </mesh>
          {i < blocks.length - 1 && (
            <mesh position={[0.8, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.04, 0.04, 0.7, 8]} />
              <meshStandardMaterial color={BORDER_ON_DARK} />
            </mesh>
          )}
        </group>
      ))}
    </group>
  );
}
