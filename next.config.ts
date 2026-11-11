import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Verification builds go to their own folder (NEXT_DIST_DIR=.next-verify) so they
  // can never overwrite the files a running `npm run dev` is serving.
  distDir: process.env.NEXT_DIST_DIR || ".next",
  // Menu photos are ~2 MB PNGs: serve AVIF (or WebP) at the displayed size instead.
  images: { formats: ["image/avif", "image/webp"] },
  async headers() {
    return [
      {
        // Frames never change once published: let browsers and the CDN cache them forever.
        source: "/frames/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
      {
        // The mock service worker script must always be revalidated so updates reach browsers.
        source: "/mockServiceWorker.js",
        headers: [{ key: "Cache-Control", value: "no-cache, no-store, must-revalidate" }],
      },
    ];
  },
};

export default nextConfig;
