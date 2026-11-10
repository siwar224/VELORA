/**
 * Frame-loading progress, shared between CanvasSequence (inside the pinned
 * stage) and the Preloader (rendered at page level so no pinned/transformed
 * ancestor can trap it under the nav).
 */
type Listener = (loaded: number, total: number) => void;
const listeners = new Set<Listener>();
let last: [number, number] | null = null;

export function reportFrameProgress(loaded: number, total: number) {
  last = [loaded, total];
  listeners.forEach((l) => l(loaded, total));
}

/** Subscribe; immediately replays the latest value. Returns an unsubscribe function. */
export function onFrameProgress(listener: Listener) {
  listeners.add(listener);
  if (last) listener(...last);
  return () => listeners.delete(listener);
}
