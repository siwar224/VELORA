/**
 * Absolute site URL for metadata, robots and sitemap. On Vercel this comes
 * from the production domain automatically; set NEXT_PUBLIC_SITE_URL to override.
 */
export const siteUrl = new URL(
  process.env.NEXT_PUBLIC_SITE_URL ??
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : "http://localhost:3000"),
);
