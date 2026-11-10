"use client";

import { useEffect, useRef } from "react";
import { brand } from "@/content/site";
import { onFrameProgress } from "@/lib/preload";

/** Reveal once this share of frames is decoded… */
const THRESHOLD = 0.3;
/** …or after this long at most, so a slow connection is never stuck behind it. */
const MAX_WAIT_MS = 4000;

/**
 * Minimal preloader: wordmark + a thin caramel progress line. Purely visual
 * (aria-hidden); the page underneath is already rendered and accessible.
 * Rendered at page level (not inside the pinned stage) so it always sits above
 * the nav. Progress arrives from CanvasSequence via lib/preload.ts.
 * Hidden without JS (noscript style) and for reduced motion (no frames load).
 */
export default function Preloader() {
  const rootRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const finish = () => {
      if (rootRef.current) rootRef.current.dataset.done = "true";
    };
    const unsubscribe = onFrameProgress((loaded, total) => {
      const p = Math.min(1, loaded / (total * THRESHOLD));
      if (barRef.current) barRef.current.style.transform = `scaleX(${p})`;
      if (p >= 1) finish();
    });
    const id = window.setTimeout(finish, MAX_WAIT_MS);
    return () => {
      unsubscribe();
      window.clearTimeout(id);
    };
  }, []);

  return (
    <div
      ref={rootRef}
      aria-hidden="true"
      data-done="false"
      className="preloader fixed inset-0 z-[60] flex flex-col items-center justify-center gap-8 bg-espresso transition-[opacity,visibility] duration-700 ease-out data-[done=true]:invisible data-[done=true]:opacity-0 motion-reduce:hidden"
    >
      <noscript>
        <style>{".preloader{display:none}"}</style>
      </noscript>
      <p className="font-serif text-3xl tracking-[0.4em] text-cream">
        {brand.name}
        <span className="-ml-[0.3em] text-caramel">.</span>
      </p>
      <div className="h-px w-40 overflow-hidden bg-cream/15">
        <div
          ref={barRef}
          className="h-full origin-left bg-caramel transition-transform duration-300"
          style={{ transform: "scaleX(0)" }}
        />
      </div>
    </div>
  );
}
