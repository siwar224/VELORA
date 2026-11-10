/**
 * Run `cb` in its own task when the browser is idle (or after `timeout` ms at the
 * latest). Used to split component setup out of React's hydration task: each
 * section's GSAP/ScrollTrigger setup becomes a small separate task instead of
 * one long one, which keeps Total Blocking Time down. Returns a cancel function.
 */
export function onIdle(cb: () => void, timeout = 1200): () => void {
  if (typeof window.requestIdleCallback === "function") {
    const id = window.requestIdleCallback(cb, { timeout });
    return () => window.cancelIdleCallback(id);
  }
  const id = window.setTimeout(cb, 1);
  return () => window.clearTimeout(id);
}

/**
 * useEffect helper: runs `setup` in an idle task and returns the cleanup React
 * expects (cancels the pending setup, or undoes it if it already ran).
 *   useEffect(() => idleEffect(() => { …; return () => …; }), []);
 */
export function idleEffect(setup: () => void | (() => void)): () => void {
  let cleanup: void | (() => void);
  const cancel = onIdle(() => {
    cleanup = setup();
  });
  return () => {
    cancel();
    cleanup?.();
  };
}
