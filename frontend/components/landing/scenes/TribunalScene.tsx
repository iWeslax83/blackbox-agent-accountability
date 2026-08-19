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
  const ringRefs = useRef<Array<Mesh | null>>([]);
  const scroll = useScroll();
  const worldZ = -sceneIndex * SCENE_DEPTH;

  useFrame((_, delta) => {
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
      material.emissiveIntensity = isFlagged ? 0.5 : 0;
      mesh.rotation.x += delta * 0.15;
      mesh.rotation.y += delta * 0.2;
      const ring = ringRefs.current[i];
      if (ring) {
        const ringMaterial = ring.material as MeshStandardMaterial;
        ringMaterial.opacity = isFlagged ? 0.9 : 0.25;
        ring.rotation.z += delta * (isFlagged ? 0.4 : 0.1);
      }
    });
  });

  return (
    <group ref={groupRef} position={[0, 0, worldZ]}>
      {NODE_POSITIONS.map((pos, i) => (
        <group key={i} position={pos}>
          {/* judgment node: faceted polyhedron reads as a "verdict crystal" rather than a plain ball */}
          <mesh ref={(el) => { meshRefs.current[i] = el; }}>
            <icosahedronGeometry args={[0.34, 1]} />
            <meshStandardMaterial
              color={DARK_SURFACE}
              emissive={ACCENT_FILL}
              emissiveIntensity={0}
              roughness={0.25}
              metalness={0.35}
              flatShading
            />
          </mesh>
          <mesh ref={(el) => { ringRefs.current[i] = el; }} rotation={[Math.PI / 2.4, 0, 0]}>
            <torusGeometry args={[0.48, 0.015, 8, 32]} />
            <meshStandardMaterial color={ACCENT_FILL} transparent opacity={0.25} roughness={0.4} />
          </mesh>
        </group>
      ))}
    </group>
  );
}
