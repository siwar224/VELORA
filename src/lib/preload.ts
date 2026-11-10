/**
 * Small pub/sub signals shared across the page:
 * - frame-loading progress: CanvasSequence (inside the pinned stage) -> Preloader
 *   (rendered at page level so no pinned/transformed ancestor traps it under the nav);
 * - "preloader done": Preloader -> HeroLife, which plays the intro reveal.
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

const doneListeners = new Set<() => void>();
let done = false;

/** Called by the Preloader the moment it starts revealing the page. */
export function markPreloaderDone() {
  if (done) return;
  done = true;
  doneListeners.forEach((l) => l());
}

/** Runs `listener` once the preloader is done (immediately if it already is). */
export function onPreloaderDone(listener: () => void) {
  if (done) {
    listener();
    return () => {};
  }
  doneListeners.add(listener);
  return () => doneListeners.delete(listener);
}
