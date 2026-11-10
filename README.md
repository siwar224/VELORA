# EMBER — cinematic scroll site

Single-page scrollytelling site for a fictional specialty coffee brand. A pinned canvas
scrubs a 326-frame WebP sequence on scroll, with real HTML text animating over it.

Stack: Next.js 15 (App Router) · TypeScript strict · Tailwind CSS v4 · GSAP + ScrollTrigger · Lenis.

## Run

```bash
npm install
npm run dev        # regenerates src/data/frames.json first (predev)
npm run build      # same for prebuild
npm run lint && npm run typecheck
```

## Where things live

- `public/frames/desktop/` — the frame sequence (`f_0001.webp` …). Do not edit or rename.
- `scripts/gen-manifest.mjs` — counts the frames and writes `src/data/frames.json`.
  Add `public/frames/mobile/` later and it is picked up automatically.
- `src/content/site.ts` — every piece of copy, including the brand name.
- `src/components/` — `Nav`, `ScrollStage` (pinned stage), `Story`, `Menu`, `Visit`, `GrainOverlay`.
