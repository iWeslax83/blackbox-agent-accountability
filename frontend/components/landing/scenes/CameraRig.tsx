"use client";

import { useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { useScroll } from "@react-three/drei";
import { SCENE_COUNT, SCENE_DEPTH, TOTAL_PAGES } from "@/lib/sceneProgress";

export default function CameraRig() {
  const scroll = useScroll();
  const { camera } = useThree();
  const targetZ = useRef(0);

  useFrame(() => {
    // scroll.offset covers the whole ScrollControls range (0..1 across all
    // TOTAL_PAGES); only the first SCENE_COUNT/TOTAL_PAGES fraction of that
    // range corresponds to camera travel through the 3D scenes. Past that
    // point the camera holds at its final position while flat HTML content
    // (Pricing, CtaFooter) scrolls past in the Scroll html layer.
    const sceneFraction = Math.min(scroll.offset / (SCENE_COUNT / TOTAL_PAGES), 1);
    targetZ.current = -sceneFraction * SCENE_DEPTH * (SCENE_COUNT - 1);
    camera.position.z = 6 + targetZ.current;
    camera.lookAt(0, 0, targetZ.current);
  });

  return null;
}
