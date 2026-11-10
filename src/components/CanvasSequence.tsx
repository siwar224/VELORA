"use client";

import { useEffect, useImperativeHandle, useRef, type Ref } from "react";
import { activeFrameSet, frameSrc, type FrameSet } from "@/lib/frames";

/** Frames loaded straight away; the rest stream in when the browser is idle. */
const EAGER = 30;
/** Parallel requests while streaming the rest. */
const CONCURRENCY = 6;

/**
 * Cover fit with a focal point, for a viewport of cw × ch.
 * Scale to fill, then shift so the glass (set.focalX/Y) sits at the viewport
 * centre, but never so far that we reveal past the image edge. On landscape
 * screens the clamp wins and we just crop the empty left side; on portrait the
 * glass is centred.
 */
export function coverRect(cw: number, ch: number, set: FrameSet) {
  const scale = Math.max(cw / set.width, ch / set.height);
  const dw = set.width * scale;
  const dh = set.height * scale;
  const dx = Math.min(0, Math.max(cw - dw, cw / 2 - set.focalX * dw));
  const dy = Math.min(0, Math.max(ch - dh, ch / 2 - set.focalY * dh));
  return { dx, dy, dw, dh };
}

/** Where the glass centre lands on screen, as a fraction of viewport width. */
export function glassScreenX(cw: number, ch: number, set: FrameSet) {
  const { dx, dw } = coverRect(cw, ch, set);
  return (dx + set.focalX * dw) / cw;
}

/** Left and right edges of the glass on screen, in CSS pixels. */
export function glassScreenEdges(cw: number, ch: number, set: FrameSet) {
  const { dx, dw } = coverRect(cw, ch, set);
  return { left: dx + set.glassX[0] * dw, right: dx + set.glassX[1] * dw };
}

export type CanvasSequenceHandle = {
  /** Show a 0-based frame index. Cheap to call every tick: only redraws on change. */
  setFrame: (index: number) => void;
};

type Props = {
  ref?: Ref<CanvasSequenceHandle>;
  className?: string;
  /** Called each time a frame finishes loading (or fails). */
  onProgress?: (loaded: number, total: number) => void;
};

/**
 * Background loading order after the eager frames: every 8th frame first, then
 * every 4th, 2nd, 1st. A fast scroller always has a nearby frame to show early.
 */
function loadOrder(count: number): number[] {
  const seen = new Set<number>();
  const order: number[] = [];
  for (const stride of [8, 4, 2, 1]) {
    for (let i = EAGER; i < count; i += stride) {
      if (!seen.has(i)) {
        seen.add(i);
        order.push(i);
      }
    }
  }
  return order;
}

/** requestIdleCallback where supported (not Safari), otherwise a short timeout. */
const idle = (cb: () => void) => {
  if (typeof window.requestIdleCallback === "function") window.requestIdleCallback(cb, { timeout: 300 });
  else setTimeout(cb, 16);
};

export default function CanvasSequence({ ref, className, onProgress }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wanted = useRef(0); // frame the timeline asked for
  const drawRef = useRef<() => void>(() => {});
  const onProgressRef = useRef(onProgress);
  onProgressRef.current = onProgress;

  useImperativeHandle(ref, () => ({
    setFrame(index) {
      wanted.current = index;
      drawRef.current();
    },
  }));

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d", { alpha: false });
    if (!canvas || !ctx) return;
    // Reduced motion: static poster only, don't download the sequence at all.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const set = activeFrameSet();
    const images: (HTMLImageElement | null)[] = new Array(set.count).fill(null);
    let drawn = -1; // frame currently on the canvas
    let loaded = 0;
    let alive = true;

    /** Closest frame to `i` that has finished loading (search outward). */
    const nearestLoaded = (i: number) => {
      for (let d = 0; d < set.count; d++) {
        if (images[i - d]) return i - d;
        if (images[i + d]) return i + d;
      }
      return -1;
    };

    const draw = (force = false) => {
      const index = nearestLoaded(wanted.current);
      if (index < 0 || (index === drawn && !force)) return;
      const { dx, dy, dw, dh } = coverRect(canvas.width, canvas.height, set);
      ctx.drawImage(images[index]!, dx, dy, dw, dh);
      // The canvas is opaque black until its first draw; the poster image
      // underneath stays visible until then.
      if (drawn < 0) canvas.style.opacity = "1";
      drawn = index;
    };
    drawRef.current = () => draw();

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(canvas.clientWidth * dpr);
      canvas.height = Math.round(canvas.clientHeight * dpr);
      ctx.imageSmoothingQuality = "high"; // reset by resizing the canvas
      draw(true);
    };
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const load = async (i: number) => {
      const img = new Image();
      img.src = frameSrc(i + 1, set);
      try {
        await img.decode(); // decode off the main thread before first draw
        if (!alive) return;
        images[i] = img;
        // Redraw if this frame is closer to the wanted one than what's showing.
        if (drawn < 0 || Math.abs(i - wanted.current) < Math.abs(drawn - wanted.current)) draw();
      } catch {
        // A missing frame just falls back to its neighbours.
      }
      if (alive) onProgressRef.current?.(++loaded, set.count);
    };

    // 1) Eager frames in parallel.  2) The rest, a few at a time, when idle.
    const eager = Array.from({ length: Math.min(EAGER, set.count) }, (_, i) => load(i));
    const queue = loadOrder(set.count);
    const pump = () => {
      if (!alive) return;
      const next = queue.shift();
      if (next === undefined) return;
      load(next).then(() => idle(pump));
    };
    Promise.all(eager).then(() => {
      for (let k = 0; k < CONCURRENCY; k++) idle(pump);
    });

    return () => {
      alive = false;
      ro.disconnect();
      drawRef.current = () => {};
    };
  }, []);

  return <canvas ref={canvasRef} aria-hidden="true" className={className} style={{ opacity: 0 }} />;
}
