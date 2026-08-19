"use client";

import { Text } from "@react-three/drei";
import { useScroll } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import type { Group } from "three";
import { getSceneLocalProgress, isSceneActive, SCENE_COUNT, SCENE_DEPTH, TOTAL_PAGES } from "@/lib/sceneProgress";
import { ACCENT_TEXT, TEXT_ON_DARK } from "@/lib/landingTheme";

const STATS = [
  { num: "€35M", start: 0.0 },
  { num: "2026", start: 0.25 },
  { num: "0", start: 0.5 },
  { num: "Art.15", start: 0.75 },
];
const STAT_SPAN = 0.25;

function statOpacity(local: number, start: number): number {
  const local0 = (local - start) / STAT_SPAN;
  if (local0 < 0 || local0 > 1) return 0;
  const enter = Math.min(local0 / 0.3, 1);
  const exit = local0 > 0.7 ? 1 - Math.min((local0 - 0.7) / 0.3, 1) : 1;
  return Math.max(0.2, Math.min(enter, exit));
}

export default function ProblemStatsScene({ sceneIndex }: { sceneIndex: number }) {
  const groupRef = useRef<Group>(null);
  const scroll = useScroll();

  useFrame(() => {
    const sceneFraction = Math.min(scroll.offset / (SCENE_COUNT / TOTAL_PAGES), 1);
    const local = getSceneLocalProgress(sceneFraction, SCENE_COUNT, sceneIndex);
    if (groupRef.current) {
      groupRef.current.visible = isSceneActive(sceneFraction, SCENE_COUNT, sceneIndex);
      groupRef.current.children.forEach((child, i) => {
        const stat = STATS[i];
        if (!stat) return;
        const opacity = statOpacity(local, stat.start);
        child.traverse((node) => {
          const material = (node as unknown as { material?: { opacity: number; transparent: boolean } }).material;
          if (material) {
            material.transparent = true;
            material.opacity = opacity;
          }
        });
      });
    }
  });

  const worldZ = -sceneIndex * SCENE_DEPTH;

  return (
    <group ref={groupRef} position={[0, 0, worldZ]}>
      {STATS.map((stat, i) => (
        <Text
          key={stat.num}
          position={[0, 0.4 - i * 0.02, 0.01 * i]}
          fontSize={1.6}
          color={i === 0 ? ACCENT_TEXT : TEXT_ON_DARK}
          anchorX="center"
          anchorY="middle"
        >
          {stat.num}
        </Text>
      ))}
    </group>
  );
}
