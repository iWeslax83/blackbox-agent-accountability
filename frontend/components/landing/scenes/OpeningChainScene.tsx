// frontend/components/landing/scenes/OpeningChainScene.tsx
"use client";

import { useRef } from "react";
import type { Group } from "three";
import { useFrame } from "@react-three/fiber";
import { useScroll } from "@react-three/drei";
import { buildChainBlocks } from "@/lib/chainData";
import { getSceneLocalProgress, SCENE_COUNT, TOTAL_PAGES } from "@/lib/sceneProgress";
import { useReducedMotion } from "@/lib/useReducedMotion";
import ChainBlocksGroup from "./ChainBlocksGroup";

const blocks = buildChainBlocks(6);

export default function OpeningChainScene({ sceneIndex }: { sceneIndex: number }) {
  const groupRef = useRef<Group>(null);
  const scroll = useScroll();
  const reducedMotion = useReducedMotion();

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    const sceneFraction = Math.min(scroll.offset / (SCENE_COUNT / TOTAL_PAGES), 1);
    const local = getSceneLocalProgress(sceneFraction, SCENE_COUNT, sceneIndex);
    // Entrance: fade/scale in over the first 30% of this scene's range.
    // Exit: fade/scale out over the last 30%, per the plan's 150-200ms-equivalent
    // exit-faster-than-enter rule, expressed here as scroll-range fractions
    // since this element's visibility is scroll-driven, not time-driven.
    const enter = Math.min(local / 0.3, 1);
    const exit = local > 0.7 ? 1 - Math.min((local - 0.7) / 0.3, 1) : 1;
    const visibility = Math.min(enter, exit);
    groupRef.current.scale.setScalar(0.9 + visibility * 0.1);
    if (!reducedMotion) {
      groupRef.current.rotation.y += delta * 0.12;
    }
  });

  return (
    <group ref={groupRef} position={[2.5, 0, 0]}>
      <ChainBlocksGroup blocks={blocks} />
    </group>
  );
}
