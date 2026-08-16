"use client";

import { Component, useSyncExternalStore, type ReactNode } from "react";
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

let cachedWebglSupported: boolean | null = null;

function supportsWebGL(): boolean {
  if (cachedWebglSupported !== null) return cachedWebglSupported;
  try {
    const canvas = document.createElement("canvas");
    const ctx =
      canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
    cachedWebglSupported = !!ctx;
    if (ctx && "getExtension" in ctx) {
      (ctx as WebGLRenderingContext).getExtension("WEBGL_lose_context")?.loseContext();
    }
  } catch {
    cachedWebglSupported = false;
  }
  return cachedWebglSupported;
}

// One-time client-only reads (mount state, WebGL support, viewport width) that have
// no server value and don't change during the component's lifetime. Modeled as a
// no-op-subscription external store so the client value is available on the very
// first client render, without the extra render pass a `useEffect` + `setState`
// mount-detection dance would cost.
function useClientSnapshot<T>(getClientValue: () => T, serverValue: T): T {
  return useSyncExternalStore(
    () => () => {},
    getClientValue,
    () => serverValue,
  );
}

class ChainErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) return <HashChainStatic />;
    return this.props.children;
  }
}

export default function HeroChain() {
  const reducedMotion = useReducedMotion();
  const mounted = useClientSnapshot(() => true, false);
  const webglSupported = useClientSnapshot(() => supportsWebGL(), false);
  const wideViewport = useClientSnapshot(() => window.innerWidth >= 768, false);

  if (!mounted) {
    return (
      <div style={{ maxWidth: 640, margin: "0 auto", height: 220 }}>
        <HashChainStatic />
      </div>
    );
  }

  const use3D = !reducedMotion && wideViewport && webglSupported;

  return (
    <div style={{ maxWidth: 640, margin: "0 auto", height: 220 }}>
      {use3D ? (
        <ChainErrorBoundary>
          <HashChainScene />
        </ChainErrorBoundary>
      ) : (
        <HashChainStatic />
      )}
    </div>
  );
}
