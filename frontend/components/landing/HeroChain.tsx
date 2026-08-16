"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { useReducedMotion } from "@/lib/useReducedMotion";
import HashChainStatic from "./HashChainStatic";

const HashChainScene = dynamic(() => import("./HashChainScene"), {
  ssr: false,
  loading: () => <ChainSkeleton />,
});

function ChainSkeleton() {
  return (
    <div
      style={{
        height: 220,
        borderRadius: 12,
        background: "#efe9dd",
        border: "1px solid #e3dccd",
      }}
    />
  );
}

function supportsWebGL(): boolean {
  try {
    const canvas = document.createElement("canvas");
    return !!(
      canvas.getContext("webgl") || canvas.getContext("experimental-webgl")
    );
  } catch {
    return false;
  }
}

export default function HeroChain() {
  const reducedMotion = useReducedMotion();
  const [use3D, setUse3D] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setUse3D(!reducedMotion && window.innerWidth >= 768 && supportsWebGL());
  }, [reducedMotion]);

  if (!mounted) return <ChainSkeleton />;

  return (
    <div style={{ maxWidth: 640, margin: "0 auto", height: 220 }}>
      {use3D ? <HashChainScene /> : <HashChainStatic />}
    </div>
  );
}
