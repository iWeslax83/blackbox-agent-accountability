"use client";
import { useSyncExternalStore } from "react";

// One-time (or externally-triggered) client-only reads that have no server
// value and don't need their own change-notification source. Modeled as a
// no-op-subscription external store so the client value is available on the
// very first client render, without the extra render pass a `useEffect` +
// `setState` mount-detection dance would cost.
export function useClientSnapshot<T>(getClientValue: () => T, serverValue: T): T {
  return useSyncExternalStore(
    () => () => {},
    getClientValue,
    () => serverValue,
  );
}
