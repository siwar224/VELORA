import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Inter } from "next/font/google";
import { brand } from "@/content/site";
import { desktopFrames, frameSrc } from "@/lib/frames";
import { siteUrl } from "@/lib/site-url";
import "./globals.css";

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  style: ["normal", "italic"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const title = `${brand.name} — ${brand.tagline}`;
// Last frame of the sequence that plays: the finished drink.
const shareImage = { url: frameSrc(desktopFrames.count), width: 1920, height: 1080, alt: brand.description };

export const metadata: Metadata = {
  metadataBase: siteUrl,
  title,
  description: brand.description,
  alternates: { canonical: "/" },
  openGraph: { type: "website", title, description: brand.description, siteName: brand.name, images: [shareImage] },
  twitter: { card: "summary_large_image", title, description: brand.description, images: [shareImage.url] },
};

export const viewport: Viewport = {
  themeColor: "#1E120B",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${cormorant.variable} ${inter.variable}`}>
      <body className="bg-espresso font-sans text-cream">
        {/* First tab stop: jump past the nav and the long scroll stage. */}
        <a
          href="#story"
          className="eyebrow fixed top-3 left-3 z-[70] -translate-y-20 bg-cream px-4 py-3 text-espresso transition-transform focus:translate-y-0"
        >
          Skip to content
        </a>
        {children}
      </body>
    </html>
  );
}
