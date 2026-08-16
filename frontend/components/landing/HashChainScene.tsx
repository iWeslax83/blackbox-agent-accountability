"use client";

import { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import type { Group } from "three";
import { buildChainBlocks } from "@/lib/chainData";
import { useReducedMotion } from "@/lib/useReducedMotion";

const RUST = "#b4451f";
const INK = "#1a1714";

function ChainGroup() {
  const groupRef = useRef<Group>(null);
  const reducedMotion = useReducedMotion();
  const blocks = buildChainBlocks(6);
  const centerX = ((blocks.length - 1) * 1.6) / 2;

  useFrame((_, delta) => {
    if (reducedMotion || !groupRef.current) return;
    groupRef.current.rotation.y += delta * 0.12;
  });

  return (
    <group ref={groupRef}>
      {blocks.map((block, i) => (
        <group key={block.id} position={[block.x - centerX, block.y, block.z]}>
          <mesh>
            <boxGeometry args={[0.9, 0.9, 0.9]} />
            <meshStandardMaterial
              color={i === blocks.length - 1 ? RUST : INK}
              roughness={0.45}
              metalness={0.1}
            />
          </mesh>
          {i < blocks.length - 1 && (
            <mesh position={[0.8, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.04, 0.04, 0.7, 8]} />
              <meshStandardMaterial color="#8a8275" />
            </mesh>
          )}
        </group>
      ))}
    </group>
  );
}

export default function HashChainScene() {
  return (
    <Canvas
      camera={{ position: [0, 1.4, 6], fov: 42 }}
      dpr={[1, 1.5]}
      gl={{ antialias: true, alpha: true }}
    >
      <ambientLight intensity={0.7} />
      <directionalLight position={[3, 4, 5]} intensity={0.9} />
      <ChainGroup />
    </Canvas>
  );
}
