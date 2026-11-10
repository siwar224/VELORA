"use client";

import { useEffect, useRef } from "react";
import { onHeroActive, onIntroDone } from "@/lib/hero";
import { effectAfter } from "@/lib/idle";

const COUNT = 50;
const FPS_CAP = 30;
const COLORS = ["242, 230, 211", "184, 116, 46"]; // cream #F2E6D3, caramel #B8742E

type Particle = { x: number; y: number; r: number; a: number; c: string; vy: number; sway: number; freq: number; phase: number };

const rand = (min: number, max: number) => min + Math.random() * (max - min);

function spawn(w: number, h: number, anywhere: boolean): Particle {
  return {
    x: Math.random() * w,
    y: anywhere ? Math.random() * h : h + 10,
    r: rand(0.5, 1.5), // 1–3 px diameter
    a: rand(0.15, 0.5),
    c: COLORS[Math.random() < 0.65 ? 0 : 1],
    vy: rand(6, 16), // px per second, upward
    sway: rand(4, 14), // px
    freq: rand(0.15, 0.45), // rad per second
    phase: rand(0, Math.PI * 2),
  };
}

/**
 * Hero atmosphere: a soft caramel light sweeping across the wood (pure CSS,
 * `.hero-sweep` in globals.css) and ~50 cream/caramel motes drifting up with a
 * gentle sway on a small canvas. Device-pixel-ratio aware (capped at 2), capped
 * at 30 fps, starts once the hero intro has played, stops while the hero is off screen or
 * the tab is hidden, cleaned up on unmount. Not rendered for reduced motion.
 */
export default function HeroAmbient() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Set up only after the hero intro: keeps the canvas allocation and the loop
  // entirely out of the page-load window.
  useEffect(() => effectAfter(onIntroDone, () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let w = 0;
    let h = 0;
    let particles: Particle[] = [];
    let raf = 0;
    let last = 0; // last simulated time
    let lastDraw = 0;
    let running = false;
    let heroActive = true;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (!particles.length) particles = Array.from({ length: COUNT }, () => spawn(w, h, true));
    };
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      if (now - lastDraw < 1000 / FPS_CAP - 1) return; // 30 fps cap
      lastDraw = now;
      const dt = Math.min(now - last, 100) / 1000; // clamp after a pause / hidden tab
      last = now;
      const t = now / 1000;

      ctx.clearRect(0, 0, w, h);
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.y -= p.vy * dt;
        if (p.y < -10) particles[i] = spawn(w, h, false);
        const x = p.x + Math.sin(t * p.freq + p.phase) * p.sway;
        ctx.fillStyle = `rgba(${p.c}, ${p.a})`;
        ctx.beginPath();
        ctx.arc(x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    const update = () => {
      const shouldRun = heroActive && !document.hidden;
      if (shouldRun && !running) {
        running = true;
        last = lastDraw = performance.now();
        raf = requestAnimationFrame(frame);
      } else if (!shouldRun && running) {
        running = false;
        cancelAnimationFrame(raf);
      }
    };

    canvas.style.opacity = "1";
    const offActive = onHeroActive((a) => {
      heroActive = a;
      update();
    });
    document.addEventListener("visibilitychange", update);

    return () => {
      cancelAnimationFrame(raf);
      running = false;
      ro.disconnect();
      offActive();
      document.removeEventListener("visibilitychange", update);
      particles = [];
    };
  }), []);

  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden motion-reduce:hidden">
      {/* Light sweep: a soft caramel band crossing the wood, soft-light blended. */}
      <div className="hero-sweep absolute inset-y-0 left-0 w-[40%] bg-[linear-gradient(90deg,transparent,rgb(184_116_46/0.5)_50%,transparent)] mix-blend-soft-light will-change-transform" />
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full opacity-0 transition-opacity duration-1000" />
    </div>
  );
}
