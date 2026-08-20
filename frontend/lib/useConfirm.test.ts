import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useConfirm } from "./useConfirm";

beforeEach(() => { vi.useFakeTimers(); });
afterEach(() => { vi.useRealTimers(); });

describe("useConfirm", () => {
  it("starts with no message", () => {
    const { result } = renderHook(() => useConfirm());
    expect(result.current.message).toBeNull();
  });

  it("shows then clears the message after the timeout", () => {
    const { result } = renderHook(() => useConfirm(1000));
    act(() => { result.current.show("Saved"); });
    expect(result.current.message).toBe("Saved");
    act(() => { vi.advanceTimersByTime(1000); });
    expect(result.current.message).toBeNull();
  });

  it("restarts the timer when shown again before it clears", () => {
    const { result } = renderHook(() => useConfirm(1000));
    act(() => { result.current.show("First"); });
    act(() => { vi.advanceTimersByTime(700); });
    act(() => { result.current.show("Second"); });
    act(() => { vi.advanceTimersByTime(700); });
    expect(result.current.message).toBe("Second");
    act(() => { vi.advanceTimersByTime(300); });
    expect(result.current.message).toBeNull();
  });
});
