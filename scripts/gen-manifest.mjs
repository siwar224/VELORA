// Counts the frame files in public/frames/<set> and writes src/data/frames.json.
// Runs automatically before `dev` and `build` (see package.json), so the frame
// count is never hard-coded anywhere in the app.
import { readdirSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const FRAME_RE = /^f_(\d+)\.webp$/;

/** Scan one frame set; returns null if the folder does not exist yet. */
function scan(set) {
  const dir = join(root, "public", "frames", set);
  if (!existsSync(dir)) return null;

  const nums = readdirSync(dir)
    .map((f) => FRAME_RE.exec(f))
    .filter(Boolean)
    .map((m) => ({ n: Number(m[1]), pad: m[1].length }))
    .sort((a, b) => a.n - b.n);

  if (nums.length === 0) return null;

  // The renderer assumes f_0001 … f_N with no gaps; fail loudly otherwise.
  nums.forEach(({ n }, i) => {
    if (n !== i + 1) throw new Error(`[gen-manifest] ${set}: expected frame ${i + 1}, found ${n}`);
  });

  return { count: nums.length, pattern: `/frames/${set}/f_{n}.webp`, pad: nums[0].pad };
}

const desktop = scan("desktop");
if (!desktop) throw new Error("[gen-manifest] no frames found in public/frames/desktop");

// The mobile (portrait) set does not exist yet. When it is added to
// public/frames/mobile/, it is picked up here with no code change.
const mobile = scan("mobile");

const manifest = { ...desktop, ...(mobile ? { mobile } : {}) };

const out = join(root, "src", "data", "frames.json");
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, JSON.stringify(manifest, null, 2) + "\n");
console.log(`[gen-manifest] desktop: ${desktop.count} frames${mobile ? `, mobile: ${mobile.count}` : ""}`);
