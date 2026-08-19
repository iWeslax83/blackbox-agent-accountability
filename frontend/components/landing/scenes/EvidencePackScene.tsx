"use client";

import { useRef } from "react";
import type { Group, Mesh, MeshStandardMaterial } from "three";
import { useFrame } from "@react-three/fiber";
import { useScroll, RoundedBox, Edges } from "@react-three/drei";
import { getSceneLocalProgress, SCENE_COUNT, SCENE_DEPTH, PIN_FRACTION, TOTAL_PAGES } from "@/lib/sceneProgress";
import { DARK_SURFACE, ACCENT_FILL, TEXT_ON_DARK, BORDER_ON_DARK } from "@/lib/landingTheme";

const SHEET_COUNT = 4;

export default function EvidencePackScene({ sceneIndex }: { sceneIndex: number }) {
  const groupRef = useRef<Group>(null);
  const stampRef = useRef<Mesh>(null);
  const stampRingRef = useRef<Mesh>(null);
  const clipRef = useRef<Mesh>(null);
  const worldZ = -sceneIndex * SCENE_DEPTH;
  const scroll = useScroll();

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    const sceneFraction = Math.min(scroll.offset / (SCENE_COUNT / TOTAL_PAGES), 1);
    const local = getSceneLocalProgress(sceneFraction, SCENE_COUNT, sceneIndex);
    // Assembly happens over the first (1 - PIN_FRACTION) of the scene's range;
    // the remaining PIN_FRACTION is the pinned hold, during which the stack
    // stays fully assembled and lit rather than continuing to animate, giving
    // the "camera holds while the report finishes appearing" pause the plan
    // calls for (the actual scroll-position hold is implemented by
    // SceneExperience's HTML section height for this scene, this component
    // only needs to stop animating once assembly completes).
    const assemblyEnd = 1 - PIN_FRACTION;
    const assembly = Math.min(local / assemblyEnd, 1);
    groupRef.current.scale.set(1, assembly, 1);

    // Stamp lands (scale-pop) only once the stack has mostly assembled,
    // reading as "the seal gets applied after the report is complete."
    const stampProgress = Math.max(0, Math.min((assembly - 0.6) / 0.4, 1));
    if (stampRef.current) {
      const pop = stampProgress > 0 ? 0.4 + 0.6 * Math.min(stampProgress * 1.4, 1) : 0;
      stampRef.current.scale.setScalar(pop);
      const material = stampRef.current.material as MeshStandardMaterial;
      material.emissiveIntensity = 0.2 + stampProgress * 0.35;
    }
    if (stampRingRef.current) {
      stampRingRef.current.rotation.z += delta * 0.3;
      const ringMaterial = stampRingRef.current.material as MeshStandardMaterial;
      ringMaterial.opacity = stampProgress * 0.85;
    }
    if (clipRef.current) {
      const clipMaterial = clipRef.current.material as MeshStandardMaterial;
      clipMaterial.emissiveIntensity = 0.1 + assembly * 0.15;
    }
  });

  return (
    <group position={[0, 0, worldZ]}>
      <group ref={groupRef} rotation={[-Math.PI / 2.5, 0, 0]}>
        {/* stacked report sheets: slight offset per sheet reads as a bound
            document, not a single flat card */}
        {Array.from({ length: SHEET_COUNT }, (_, i) => {
          const isTop = i === SHEET_COUNT - 1;
          const z = i * 0.028;
          return (
            <mesh key={i} position={[0.03 * i, -0.02 * i, z]}>
              <planeGeometry args={[2.3 - i * 0.03, 3.1 - i * 0.03]} />
              <meshStandardMaterial
                color={isTop ? DARK_SURFACE : BORDER_ON_DARK}
                emissive={isTop ? ACCENT_FILL : "#000000"}
                emissiveIntensity={isTop ? 0.15 : 0}
                roughness={0.55}
                metalness={0.05}
                side={2}
              />
            </mesh>
          );
        })}

        {/* left binder clip */}
        <mesh ref={clipRef} position={[-1.05, 0.9, SHEET_COUNT * 0.028 + 0.02]}>
          <boxGeometry args={[0.18, 0.5, 0.05]} />
          <meshStandardMaterial color={BORDER_ON_DARK} emissive={ACCENT_FILL} emissiveIntensity={0.1} roughness={0.4} metalness={0.3} />
        </mesh>

        {/* approval stamp: faceted seal that pops in once the pack is assembled */}
        <group position={[0.7, -1, SHEET_COUNT * 0.028 + 0.03]}>
          <mesh ref={stampRef} rotation={[0, 0, Math.PI / 10]}>
            <RoundedBox args={[0.55, 0.55, 0.06]} radius={0.05} smoothness={4}>
              <meshStandardMaterial color={ACCENT_FILL} emissive={ACCENT_FILL} emissiveIntensity={0.2} roughness={0.3} metalness={0.2} />
              <Edges color={TEXT_ON_DARK} threshold={15} />
            </RoundedBox>
          </mesh>
          <mesh ref={stampRingRef} rotation={[0, 0, 0]}>
            <torusGeometry args={[0.42, 0.012, 8, 32]} />
            <meshStandardMaterial color={TEXT_ON_DARK} transparent opacity={0} roughness={0.4} />
          </mesh>
        </group>
      </group>
    </group>
  );
}
