"use client";

import { useEffect, useImperativeHandle, useRef, type Ref } from "react";
import { brand } from "@/content/site";

/** Reveal once this share of frames is decoded… */
const THRESHOLD = 0.3;
/** …or after this long at most, so a slow connection is never stuck behind it. */
const MAX_WAIT_MS = 4000;

export type PreloaderHandle = {
  progress: (loaded: number, total: number) => void;
};

/**
 * Minimal preloader: wordmark + a thin caramel progress line. Purely visual
 * (aria-hidden); the page underneath is already rendered and accessible.
 * Hidden without JS (noscript style) and for reduced motion (no frames load).
 */
export default function Preloader({ ref }: { ref?: Ref<PreloaderHandle> }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLDivElement>(null);

  const finish = () => {
    if (rootRef.current) rootRef.current.dataset.done = "true";
  };

  useImperativeHandle(ref, () => ({
    progress(loaded, total) {
      const p = Math.min(1, loaded / (total * THRESHOLD));
      if (barRef.current) barRef.current.style.transform = `scaleX(${p})`;
      if (p >= 1) finish();
    },
  }));

  useEffect(() => {
    const id = window.setTimeout(finish, MAX_WAIT_MS);
    return () => window.clearTimeout(id);
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
      <p className="font-serif text-3xl tracking-[0.4em] text-cream">{brand.name}</p>
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
