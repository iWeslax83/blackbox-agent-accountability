"use client";

import { useRef } from "react";
import type { Group, Mesh, MeshStandardMaterial } from "three";
import { useFrame } from "@react-three/fiber";
import { useScroll } from "@react-three/drei";
import { getSceneLocalProgress, SCENE_COUNT, SCENE_DEPTH, TOTAL_PAGES } from "@/lib/sceneProgress";
import { ACCENT_FILL, DARK_SURFACE } from "@/lib/landingTheme";

const NODE_COUNT = 6;
const NODE_POSITIONS: Array<[number, number, number]> = Array.from({ length: NODE_COUNT }, (_, i) => {
  const angle = (i / NODE_COUNT) * Math.PI * 2;
  return [Math.cos(angle) * 2, Math.sin(angle) * 1.2, 0];
});

export default function TribunalScene({ sceneIndex }: { sceneIndex: number }) {
  const groupRef = useRef<Group>(null);
  const meshRefs = useRef<Array<Mesh | null>>([]);
  const scroll = useScroll();
  const worldZ = -sceneIndex * SCENE_DEPTH;

  useFrame(() => {
    const sceneFraction = Math.min(scroll.offset / (SCENE_COUNT / TOTAL_PAGES), 1);
    const local = getSceneLocalProgress(sceneFraction, SCENE_COUNT, sceneIndex);
    // Staggered reveal: each node flips from neutral to accent color one
    // at a time as local progress advances, not all simultaneously.
    meshRefs.current.forEach((mesh, i) => {
      if (!mesh) return;
      const nodeThreshold = (i + 1) / (NODE_COUNT + 1);
      const material = mesh.material as MeshStandardMaterial;
      const isFlagged = local > nodeThreshold;
      material.color.set(isFlagged ? ACCENT_FILL : DARK_SURFACE);
      material.emissiveIntensity = isFlagged ? 0.3 : 0;
    });
  });

  return (
    <group ref={groupRef} position={[0, 0, worldZ]}>
      {NODE_POSITIONS.map((pos, i) => (
        <mesh key={i} position={pos} ref={(el) => { meshRefs.current[i] = el; }}>
          <sphereGeometry args={[0.35, 24, 24]} />
          <meshStandardMaterial color={DARK_SURFACE} emissive={ACCENT_FILL} emissiveIntensity={0} roughness={0.4} />
        </mesh>
      ))}
    </group>
  );
}
