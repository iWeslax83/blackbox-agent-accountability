"use client";

import { RoundedBox, Edges } from "@react-three/drei";
import type { ChainBlock } from "@/lib/chainData";
import { DARK_SURFACE, ACCENT_FILL, BORDER_ON_DARK, TEXT_ON_DARK } from "@/lib/landingTheme";

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
      {blocks.map((block, i) => {
        const isHead = i === blocks.length - 1;
        return (
          <group key={block.id} position={[block.x - offset, block.y, block.z]}>
            <RoundedBox args={[0.9, 0.9, 0.9]} radius={0.06} smoothness={4}>
              <meshStandardMaterial
                color={isHead ? ACCENT_FILL : DARK_SURFACE}
                roughness={0.45}
                metalness={0.15}
                emissive={isHead ? ACCENT_FILL : "#000000"}
                emissiveIntensity={isHead ? 0.25 : 0}
              />
              <Edges color={isHead ? TEXT_ON_DARK : BORDER_ON_DARK} threshold={15} />
            </RoundedBox>
            {/* recessed data-plate on the front face: reads as a hash record, not a plain box */}
            <mesh position={[0, 0, 0.461]}>
              <boxGeometry args={[0.56, 0.32, 0.02]} />
              <meshStandardMaterial
                color={BORDER_ON_DARK}
                roughness={0.7}
                metalness={0.05}
                emissive={isHead ? ACCENT_FILL : "#000000"}
                emissiveIntensity={isHead ? 0.15 : 0}
              />
            </mesh>
            <mesh position={[0, -0.24, 0.461]}>
              <boxGeometry args={[0.62, 0.08, 0.015]} />
              <meshStandardMaterial color={isHead ? TEXT_ON_DARK : BORDER_ON_DARK} roughness={0.6} />
            </mesh>
            {i < blocks.length - 1 && (
              <mesh position={[0.8, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
                <cylinderGeometry args={[0.04, 0.04, 0.7, 8]} />
                <meshStandardMaterial color={BORDER_ON_DARK} />
              </mesh>
            )}
          </group>
        );
      })}
    </group>
  );
}
