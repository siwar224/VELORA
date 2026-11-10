"use client";

import { useEffect, useImperativeHandle, useRef, type Ref } from "react";
import { FRAME_COUNT, frameSrc } from "@/lib/frames";

/** Where the subject sits in the source frames (fraction of width / height). */
const FOCAL_X = 0.74;
const FOCAL_Y = 0.5;
/**
 * Cover fit with a focal point, for a viewport of cw × ch and a source of iw × ih.
 * Scale to fill, then shift so the glass (FOCAL_X) sits at the viewport centre,
 * but never so far that we reveal past the image edge. On landscape screens the
 * clamp wins and we just crop the empty left side; on portrait the glass is centred.
 */
export function coverRect(cw: number, ch: number, iw = 1920, ih = 1080) {
  const scale = Math.max(cw / iw, ch / ih);
  const dw = iw * scale;
  const dh = ih * scale;
  const dx = Math.min(0, Math.max(cw - dw, cw / 2 - FOCAL_X * dw));
  const dy = Math.min(0, Math.max(ch - dh, ch / 2 - FOCAL_Y * dh));
  return { dx, dy, dw, dh };
}

/** Where the glass centre lands on screen, as a fraction of viewport width. */
export function glassScreenX(cw: number, ch: number) {
  const { dx, dw } = coverRect(cw, ch);
  return (dx + FOCAL_X * dw) / cw;
}

/** Frames loaded straight away; the rest stream in when the browser is idle. */
const EAGER = 30;
/** Parallel requests while streaming the rest. */
const CONCURRENCY = 6;

export type CanvasSequenceHandle = {
  /** Show a 0-based frame index. Cheap to call every tick: only redraws on change. */
  setFrame: (index: number) => void;
};

type Props = {
  ref?: Ref<CanvasSequenceHandle>;
  className?: string;
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

export default function CanvasSequence({ ref, className }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const images = useRef<(HTMLImageElement | null)[]>([]);
  const wanted = useRef(0); // frame the timeline asked for
  const drawn = useRef(-1); // frame currently on the canvas
  const drawRef = useRef<(force?: boolean) => void>(() => {});

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

    let alive = true;
    images.current = new Array(FRAME_COUNT).fill(null);

    /** Closest frame to `i` that has finished loading (search outward). */
    const nearestLoaded = (i: number) => {
      for (let d = 0; d < FRAME_COUNT; d++) {
        if (images.current[i - d]) return i - d;
        if (images.current[i + d]) return i + d;
      }
      return -1;
    };

    const draw = (force = false) => {
      const index = nearestLoaded(wanted.current);
      if (index < 0 || (index === drawn.current && !force)) return;
      const img = images.current[index]!;

      const { dx, dy, dw, dh } = coverRect(canvas.width, canvas.height, img.naturalWidth, img.naturalHeight);
      ctx.drawImage(img, dx, dy, dw, dh);
      // The canvas is opaque black until its first draw; the poster <Image>
      // underneath stays visible until then.
      if (drawn.current < 0) canvas.style.opacity = "1";
      drawn.current = index;
    };
    drawRef.current = draw;

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
      img.src = frameSrc(i + 1);
      try {
        await img.decode(); // decode off the main thread before first draw
      } catch {
        return; // a missing frame just falls back to its neighbours
      }
      if (!alive) return;
      images.current[i] = img;
      // Redraw if this frame is closer to the wanted one than what's showing.
      if (Math.abs(i - wanted.current) < Math.abs(drawn.current - wanted.current) || drawn.current < 0) draw();
    };

    // 1) Eager frames in parallel.  2) The rest, a few at a time, when idle.
    const eager = Array.from({ length: Math.min(EAGER, FRAME_COUNT) }, (_, i) => load(i));
    const queue = loadOrder(FRAME_COUNT);
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
