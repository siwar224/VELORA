import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Inter } from "next/font/google";
import { TooltipProvider } from "@/components/ui/tooltip";
import { admin } from "@/content/admin";
import "./admin.css";

// Root layout of the (admin) route group. It never imports GSAP, Lenis, the
// frame sequence or the public site's stylesheet.

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
});
const inter = Inter({ variable: "--font-inter", subsets: ["latin"], display: "swap" });

export const metadata: Metadata = {
  title: { default: admin.meta.title, template: `%s · ${admin.meta.title}` },
  description: admin.meta.description,
  // Private dashboard: keep it out of search engines.
  robots: { index: false, follow: false, nocache: true, googleBot: { index: false, follow: false } },
};

export const viewport: Viewport = { themeColor: "#1E120B" };

export default function AdminRootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${cormorant.variable} ${inter.variable}`}>
      <body>
        <TooltipProvider delayDuration={300}>{children}</TooltipProvider>
      </body>
    </html>
  );
}
