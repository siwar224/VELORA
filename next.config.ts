import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Frames never change once published: let browsers and the CDN cache them forever.
  async headers() {
    return [
      {
        source: "/frames/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
    ];
  },
};

export default nextConfig;
