# EMBER — cinematic scroll site

Single-page scrollytelling site for a fictional specialty coffee brand. A pinned canvas
scrubs a WebP frame sequence on scroll (an iced latte: ice drops, splash, condensation),
with real HTML text animating over it on the same GSAP timeline.

Stack: Next.js 15 (App Router) · React 19 · TypeScript strict · Tailwind CSS v4 ·
GSAP + ScrollTrigger + SplitText · Lenis.

## Run

```bash
npm install
npm run dev        # regenerates src/data/frames.json first (predev)
npm run build      # same for prebuild
npm run lint && npm run typecheck
```

Open `http://localhost:3000/?debug` to see the live frame number while scrolling.

## Where to change things

| What | Where |
|---|---|
| All copy, brand name, menu items | `src/content/site.ts` |
| Scroll choreography (which frame each text beat enters/leaves, last frame, scroll length, push-in, wipe) | `src/content/timeline.ts` — positions are frame numbers |
| Colours, fonts, nav glass, poster crop | `src/app/globals.css` |
| Crop focal point of a frame set | `src/lib/frames.ts` |

## How it works

- `scripts/gen-manifest.mjs` counts `public/frames/desktop/f_*.webp` and writes
  `src/data/frames.json`. Nothing hard-codes the frame count.
- `timeline.lastFrame` (267) cuts the sequence: later frames are never downloaded.
- `CanvasSequence` loads the first 30 frames immediately, streams the rest when the
  browser is idle (every 8th frame first, then filling in), and always draws the nearest
  loaded frame. Cover-fit with a focal point keeps the glass in view on any aspect ratio.
- `ScrollStage` builds one scrubbed, pinned timeline where 1 unit of time = 1 frame:
  frame index, text beats, push-in on the glass, then a cream wipe into the Story section.
- The LCP element is a real `<picture>` poster (frame 1), not the canvas.
- **Reduced motion:** no pin, no scrub, no smooth scroll and no frame downloads. The
  finished drink is a static backdrop and the beats stack as normal sections.
- **Portrait frames (later):** add `public/frames/mobile/f_0001.webp …`. The manifest picks
  them up and phones in portrait use them automatically. Set the focal point in
  `src/lib/frames.ts` (assumed 1080×1920, glass centred).

## Checked

- Lighthouse desktop, production build: Performance 94, Accessibility 100,
  Best Practices 100, SEO 100 (LCP 0.7 s, CLS 0).
- Playwright at 1440×900 and 390×844, scroll 0/25/50/75/100 %: correct frame at each
  point, no console errors, no horizontal scroll, one `<h1>`, skip link is the first tab stop.

## Deploy (Vercel)

1. Push the repo to GitHub and import it in Vercel. Framework preset: Next.js, no settings needed.
2. The build runs `prebuild`, so the manifest is regenerated from the committed frames.
3. Canonical URL, Open Graph, robots and sitemap use the production domain automatically
   (`VERCEL_PROJECT_PRODUCTION_URL`). For a custom domain, set `NEXT_PUBLIC_SITE_URL`.
4. `/frames/*` is served with `Cache-Control: public, max-age=31536000, immutable`
   (`next.config.ts`). If you ever replace frames, rename them (or the folder) to bust caches.
5. Frames are about 22 MB in the repo; Vercel serves them from its CDN. The menu cards use
   `next/image`, which counts toward Vercel's image-optimization quota (4 source images).
