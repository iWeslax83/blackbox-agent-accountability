"use client";

import dynamic from "next/dynamic";
import { useClientSnapshot } from "@/lib/useClientSnapshot";
import { useReducedMotion } from "@/lib/useReducedMotion";
import SceneExperienceStatic from "./SceneExperienceStatic";
import { DARK_BG } from "@/lib/landingTheme";

const SceneExperience = dynamic(() => import("./SceneExperience"), {
  ssr: false,
  loading: () => <SceneSkeleton />,
});

function SceneSkeleton() {
  return <div style={{ minHeight: "100dvh", background: DARK_BG }} />;
}

let cachedWebglSupported: boolean | null = null;

function supportsWebGL(): boolean {
  if (cachedWebglSupported !== null) return cachedWebglSupported;
  try {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
    cachedWebglSupported = !!ctx;
    if (ctx && "getExtension" in ctx) {
      (ctx as WebGLRenderingContext).getExtension("WEBGL_lose_context")?.loseContext();
    }
  } catch {
    cachedWebglSupported = false;
  }
  return cachedWebglSupported;
}

export default function SceneGate() {
  const reducedMotion = useReducedMotion();
  const mounted = useClientSnapshot(() => true, false);
  const webglSupported = useClientSnapshot(() => supportsWebGL(), false);
  const wideViewport = useClientSnapshot(() => window.innerWidth >= 768, false);

  if (!mounted) {
    return <SceneExperienceStatic />;
  }

  const use3D = !reducedMotion && wideViewport && webglSupported;

  return use3D ? <SceneExperience /> : <SceneExperienceStatic />;
}
