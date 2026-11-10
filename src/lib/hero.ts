/**
 * "Is the hero on screen?" — published by HeroMotion (one ScrollTrigger covering
 * the whole pinned stage), consumed by every looping hero effect so they all
 * pause together once the stage has scrolled away.
 */
type Listener = (active: boolean) => void;
const listeners = new Set<Listener>();
let active = true;

export function setHeroActive(next: boolean) {
  if (next === active) return;
  active = next;
  listeners.forEach((l) => l(active));
}

/** Subscribe; called immediately with the current state. Returns an unsubscribe function. */
export function onHeroActive(listener: Listener) {
  listeners.add(listener);
  listener(active);
  return () => listeners.delete(listener);
}

const introListeners = new Set<() => void>();
let introDone = false;

/** Called by HeroMotion when the intro reveal has finished. */
export function markIntroDone() {
  if (introDone) return;
  introDone = true;
  introListeners.forEach((l) => l());
}

/** Runs `listener` once the hero intro has finished (immediately if it already has). */
export function onIntroDone(listener: () => void) {
  if (introDone) {
    listener();
    return () => {};
  }
  introListeners.add(listener);
  return () => introListeners.delete(listener);
}

/**
 * The element right after the stage: the hero is off screen once it reaches the top.
 * Returned as an element (not a selector) so it resolves from document level even
 * inside scoped gsap contexts.
 */
export const afterHero = () => document.querySelector<HTMLElement>(".marquee") ?? undefined;
