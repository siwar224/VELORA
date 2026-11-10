# VELOR — cinematic scroll site

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
| All copy: brand, marquee words, story steps and counters, menu tabs/items/prices, pull quote, newsletter | `src/content/site.ts` |
| Opening hours (drive the "Open now / Closed" badge, Paris time) | `visit.schedule` in `src/content/site.ts` (keep `visit.hours` in sync) |
| Before launch: real contact and order addresses | `visit.contact`, `visit.order` (currently `.example` placeholders) |
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
  frame index, text beats, then a push-in on the glass that flows straight into the
  caramel marquee (the optional colour wipe is off: `timeline.wipe.frames = 0`).
- Page order: stage → marquee → Our Story (dark, sticky column, counters, steps that light
  up at screen centre, parallax crop) → Menu (cream "paper" card, Cold / Espresso / Beans
  tabs, hover preview on mouse, tap to expand on touch) → pull quote (parallax) → Visit.
- The nav has no bar over the frames, becomes frosted glass tinted to the section under it
  (`data-nav-theme`), hides on scroll down, and shows reading progress as a caramel hairline.
- The vignette shows on the stage only; film grain is everywhere.
- Section headings reveal line by line (`data-reveal-heading`, `HeadingReveals.tsx`), set up
  in an idle moment after load so they never block the first paint.
- The preloader is rendered at page level and gets frame progress from `lib/preload.ts`
  (a pinned element would otherwise trap it under the nav).
- The newsletter form is frontend-only: it validates and confirms, sends nothing.
- **Living hero** (all off for reduced motion, paused once the stage scrolls away, mouse
  effects on fine pointers only), layered on wrappers the scroll timeline never touches:
  - `Preloader`: the wordmark glides into the nav logo (FLIP), then `markPreloaderDone()`.
  - `HeroMotion`: intro (media 1.08 + blur 6px → sharp, h1 line reveal), breathing
    1.02 ↔ 1.055 (~18 s), mouse parallax (media ±12 px, text ±6 px, `gsap.quickTo`).
  - `HeroAmbient`: ~50 drifting cream/caramel motes (canvas, 30 fps cap, DPR-aware) and a
    soft-light caramel sweep across the wood (CSS transform animation).
  - `HeroBadge`: rotating SVG text badge (24 s/turn, faster with scroll velocity) placed
    between the text and the glass from the glass's computed position; click → next beat.
  - Setup that isn't needed before the reveal waits for the preloader handover
    (`effectAfter` in `lib/idle.ts`); other section setup runs in idle tasks.
- Nav and hero text share one gutter (`gutter-x`), so the logo lines up with the text at
  every width; from 1440 px the nav links + ORDER AHEAD end at the hero text column over the
  frames (moved with a transform, so no layout shift) and slide back right after the stage.
- Menu photos live in `public/menu/{Cold,Espresso,Beans}`; each item in `site.ts` points to
  its photo, with a focal point and aspect for wide photos. Served as AVIF/WebP.
- The LCP element is a real `<picture>` poster (frame 1), not the canvas.
- **Reduced motion:** no pin, no scrub, no smooth scroll and no frame downloads. The
  finished drink is a static backdrop and the beats stack as normal sections.
- **Portrait frames (later):** add `public/frames/mobile/f_0001.webp …`. The manifest picks
  them up and phones in portrait use them automatically. Set the focal point in
  `src/lib/frames.ts` (assumed 1080×1920, glass centred).

## Admin dashboard (`/admin`, frontend-only demo)

- Sign in at `/admin/login` with the demo credentials shown on the page
  (`demo@velor.example` / `velor-demo`). It's a localStorage flag checked on the
  client: **not real authentication**, clearly labelled as a demo. `/admin` is
  `noindex` and disallowed in robots.txt.
- Route groups: `app/(site)` is the public page; `app/(admin)` has its own root layout
  and stylesheet (`admin.css`, shadcn/ui theme on the brand palette) and never loads
  GSAP, Lenis or the frames (verified in the built bundles).
- Pages: Overview (KPIs vs previous period, revenue 7/30 days, orders by hour, best
  sellers, low stock), Orders (dnd-kit kanban, keyboard moves, "Move to" menu, incoming
  order simulator), Menu (TanStack Table + react-hook-form/zod sheet), Settings (hours,
  "Closed today"). ⌘K / Ctrl+K opens the command palette. Copy: `src/content/admin.ts`.
- Data: `src/lib/data`. Two persisted Zustand stores (catalog: menu + settings; orders),
  read and written only through the async functions in `api.ts`, so a real backend can
  replace that one file. 30 days of history come from a seeded generator (`seed.ts`).
- Live link: `sync.ts` (BroadcastChannel + storage event). The public "Order ahead"
  form creates orders that appear on the Orders board; menu edits, availability and
  opening hours update the public Menu and the "Open now" badge in other tabs.
- To reset the demo data, clear the site's localStorage (`velor:*` keys).

## Checked

- Admin (Playwright, 1440×900 and 768×1024): guard redirect, wrong/correct demo login by
  keyboard, all pages, ⌘K, kanban keyboard move with announcement, menu form errors + add,
  availability toggle, settings; axe (WCAG 2.1 A/AA) found no violations on login,
  overview, orders, menu and settings; no console errors; 44px touch targets (switches
  have an invisible 44px hit area). Cross-tab: admin edits showed live on the public
  menu and badge, and a public "Order ahead" order appeared live on the board.

- Lighthouse desktop, production build (Phase 2): Performance 97–98, Accessibility 100,
  Best Practices 100, SEO 100 (LCP 0.7 s, CLS 0). Scores swing a lot if the machine is
  busy; compare builds back to back under the same load.
- Phase 3 (living hero), checked with Playwright at 1440×900, 1920×1080 and 390×844: logo
  and hero text aligned (0 px), ORDER AHEAD clear of the glass from 1440 px (160–906 px),
  badge clear of glass and text, badge click → frame 80 → 234, everything paused after the
  hero, CLS 0, no console errors, 60 fps idle; scroll ≈ 45–57 fps, the same as Phase 2
  (limited by the frame-sequence drawing, not the new effects).
- Lighthouse on the Phase 3 build, on a development machine running other heavy apps:
  Performance 67–90 (A11y / Best Practices / SEO 100, CLS 0, LCP 0.8 s). Most of the cost
  is one early layout/render task that also appears with the hero effects off and swings
  with machine load. Re-measure with PageSpeed Insights on the Vercel deployment.
- Playwright at 1440×900 and 390×844: every section, menu hover/tabs and tap-to-expand,
  counters reach 4 / 48 / 10, one story step active at a time, badge open/closed at fixed
  Paris times, newsletter error and success, no horizontal scroll, one `<h1>`; hero text
  clear of the glass at 1024, 1100 and 1280 px; reduced motion: static marquee, no pin.

## Deploy (Vercel)

1. Push the repo to GitHub and import it in Vercel. Framework preset: Next.js, no settings needed.
2. The build runs `prebuild`, so the manifest is regenerated from the committed frames.
3. Canonical URL, Open Graph, robots and sitemap use the production domain automatically
   (`VERCEL_PROJECT_PRODUCTION_URL`). For a custom domain, set `NEXT_PUBLIC_SITE_URL`.
4. `/frames/*` is served with `Cache-Control: public, max-age=31536000, immutable`
   (`next.config.ts`). If you ever replace frames, rename them (or the folder) to bust caches.
5. Frames are about 22 MB in the repo; Vercel serves them from its CDN. Menu previews, the
   story crop and the quote background use `next/image`, which counts toward Vercel's
   image-optimization quota (4 source frames).
