// frontend/components/landing/scenes/RecorderChainScene.tsx
"use client";

import { useRef } from "react";
import type { Group } from "three";
import { useFrame } from "@react-three/fiber";
import { useScroll } from "@react-three/drei";
import { buildChainBlocks } from "@/lib/chainData";
import { getSceneLocalProgress, SCENE_COUNT, SCENE_DEPTH, TOTAL_PAGES } from "@/lib/sceneProgress";
import ChainBlocksGroup from "./ChainBlocksGroup";

const blocks = buildChainBlocks(12);

export default function RecorderChainScene({ sceneIndex }: { sceneIndex: number }) {
  const groupRef = useRef<Group>(null);
  const scroll = useScroll();
  const worldZ = -sceneIndex * SCENE_DEPTH;

  useFrame(() => {
    if (!groupRef.current) return;
    const sceneFraction = Math.min(scroll.offset / (SCENE_COUNT / TOTAL_PAGES), 1);
    const local = getSceneLocalProgress(sceneFraction, SCENE_COUNT, sceneIndex);
    // Camera travels ALONGSIDE this chain (per the spec): translate the
    // whole group's X as local progress advances, rather than rotating it,
    // so it reads as "the camera moves along the chain."
    groupRef.current.position.x = -6 + local * 6;
    const enter = Math.min(local / 0.25, 1);
    const exit = local > 0.75 ? 1 - Math.min((local - 0.75) / 0.25, 1) : 1;
    groupRef.current.scale.setScalar(Math.max(0.2, Math.min(enter, exit)));
  });

  return (
    <group ref={groupRef} position={[0, 0, worldZ]}>
      <ChainBlocksGroup blocks={blocks} centerX={0} />
    </group>
  );
}
