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
