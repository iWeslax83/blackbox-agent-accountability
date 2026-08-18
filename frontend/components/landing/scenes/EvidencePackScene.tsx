"use client";

import { useRef } from "react";
import type { Mesh, MeshStandardMaterial } from "three";
import { useFrame } from "@react-three/fiber";
import { useScroll } from "@react-three/drei";
import { getSceneLocalProgress, SCENE_COUNT, SCENE_DEPTH, PIN_FRACTION, TOTAL_PAGES } from "@/lib/sceneProgress";
import { DARK_SURFACE, ACCENT_FILL } from "@/lib/landingTheme";

export default function EvidencePackScene({ sceneIndex }: { sceneIndex: number }) {
  const meshRef = useRef<Mesh>(null);
  const scroll = useScroll();
  const worldZ = -sceneIndex * SCENE_DEPTH;

  useFrame(() => {
    if (!meshRef.current) return;
    const sceneFraction = Math.min(scroll.offset / (SCENE_COUNT / TOTAL_PAGES), 1);
    const local = getSceneLocalProgress(sceneFraction, SCENE_COUNT, sceneIndex);
    // Assembly happens over the first (1 - PIN_FRACTION) of the scene's range;
    // the remaining PIN_FRACTION is the pinned hold, during which the plane
    // stays fully assembled and lit rather than continuing to animate, giving
    // the "camera holds while the report finishes appearing" pause the plan
    // calls for (the actual scroll-position hold is implemented by
    // SceneExperience's HTML section height for this scene, this component
    // only needs to stop animating once assembly completes).
    const assemblyEnd = 1 - PIN_FRACTION;
    const assembly = Math.min(local / assemblyEnd, 1);
    meshRef.current.scale.set(1, assembly, 1);
    const material = meshRef.current.material as MeshStandardMaterial;
    material.emissiveIntensity = 0.15 + assembly * 0.2;
  });

  return (
    <group position={[0, 0, worldZ]}>
      <mesh ref={meshRef} rotation={[-Math.PI / 2.5, 0, 0]}>
        <planeGeometry args={[2.4, 3.2]} />
        <meshStandardMaterial color={DARK_SURFACE} emissive={ACCENT_FILL} emissiveIntensity={0.15} roughness={0.5} side={2} />
      </mesh>
    </group>
  );
}
