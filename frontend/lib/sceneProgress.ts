export const SCENE_COUNT = 5;
export const TOTAL_PAGES = 9;
export const SCENE_DEPTH = 8;
export const PIN_SCENE_INDEX = 4;
export const PIN_FRACTION = 0.4;

export function getActiveSceneIndex(offset: number, sceneCount: number = SCENE_COUNT): number {
  const clamped = Math.min(Math.max(offset, 0), 0.999999);
  return Math.floor(clamped * sceneCount);
}

export function getSceneLocalProgress(offset: number, sceneCount: number, sceneIndex: number): number {
  const sceneSpan = 1 / sceneCount;
  const sceneStart = sceneIndex * sceneSpan;
  const local = (offset - sceneStart) / sceneSpan;
  return Math.min(Math.max(local, 0), 1);
}

// getSceneLocalProgress clamps to [0,1], so a scene that has already been
// scrolled past looks permanently "fully revealed" instead of hidden, and
// the camera's continuous Z travel keeps every other scene's objects inside
// the frustum at once. This computes the *unclamped* local progress so
// callers can hide their root group outside a small buffer around their own
// window, instead of every scene staying visible for the entire page.
export function isSceneActive(offset: number, sceneCount: number, sceneIndex: number, buffer = 0.15): boolean {
  const sceneSpan = 1 / sceneCount;
  const sceneStart = sceneIndex * sceneSpan;
  const rawLocal = (offset - sceneStart) / sceneSpan;
  return rawLocal > -buffer && rawLocal < 1 + buffer;
}
