import { describe, it, expect } from "vitest";
import { getActiveSceneIndex, getSceneLocalProgress, SCENE_COUNT, TOTAL_PAGES } from "./sceneProgress";

describe("constants", () => {
  it("defines 5 3D scenes across 9 total scroll pages", () => {
    expect(SCENE_COUNT).toBe(5);
    expect(TOTAL_PAGES).toBe(9);
  });
});

describe("getActiveSceneIndex", () => {
  it("returns 0 at the very start", () => {
    expect(getActiveSceneIndex(0, 5)).toBe(0);
  });

  it("returns the last scene index near the end of the 3D range", () => {
    expect(getActiveSceneIndex(0.99, 5)).toBe(4);
  });

  it("returns 1 partway into the second scene's range", () => {
    expect(getActiveSceneIndex(0.21, 5)).toBe(1);
  });

  it("clamps offsets above 1 to the last scene", () => {
    expect(getActiveSceneIndex(1.5, 5)).toBe(4);
  });

  it("clamps negative offsets to the first scene", () => {
    expect(getActiveSceneIndex(-0.2, 5)).toBe(0);
  });
});

describe("getSceneLocalProgress", () => {
  it("is 0 at the exact start of a scene's range", () => {
    expect(getSceneLocalProgress(0.2, 5, 1)).toBeCloseTo(0, 5);
  });

  it("is 1 at the exact end of a scene's range", () => {
    expect(getSceneLocalProgress(0.4, 5, 1)).toBeCloseTo(1, 5);
  });

  it("is 0.5 halfway through a scene's range", () => {
    expect(getSceneLocalProgress(0.1, 5, 0)).toBeCloseTo(0.5, 5);
  });

  it("clamps below 0 for offsets before the scene starts", () => {
    expect(getSceneLocalProgress(0.05, 5, 1)).toBe(0);
  });

  it("clamps above 1 for offsets after the scene ends", () => {
    expect(getSceneLocalProgress(0.9, 5, 1)).toBe(1);
  });
});
