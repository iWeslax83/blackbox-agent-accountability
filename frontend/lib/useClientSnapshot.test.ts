import { describe, it, expect } from "vitest";
import { renderHook } from "@testing-library/react";
import { useClientSnapshot } from "./useClientSnapshot";

describe("useClientSnapshot", () => {
  it("returns the client value on render", () => {
    const { result } = renderHook(() => useClientSnapshot(() => "client", "server"));
    expect(result.current).toBe("client");
  });

  it("returns a fresh client value each time getClientValue's underlying data changes and a re-render is forced", () => {
    let value = 1;
    const { result, rerender } = renderHook(() => useClientSnapshot(() => value, 0));
    expect(result.current).toBe(1);
    value = 2;
    rerender();
    expect(result.current).toBe(2);
  });
});
