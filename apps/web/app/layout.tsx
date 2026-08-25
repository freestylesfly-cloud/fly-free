import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Providers } from "./providers";
import { Header } from "./components/Header";
import { Footer } from "./components/Footer";
import { ContentProtection } from "./components/ContentProtection";
import { StyleAssistant } from "./components/StyleAssistant";
import { Toaster } from "sonner";
import { BRAND, designTokensCss } from "./lib/design";
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "./lib/site";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Fly Free | Northeast India T-Shirts, Streetwear & Custom Apparel",
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  keywords: [
    "Fly Free",
    "Northeast India t-shirt brand",
    "custom t-shirt design India",
    "Assam streetwear",
    "oversized t-shirts India",
    "anime t-shirts India",
    "custom apparel Northeast India",
    "printed t-shirts India",
    "polo t-shirts India",
    "jersey t-shirts India"
  ],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    url: SITE_URL,
    siteName: SITE_NAME,
    title: "Fly Free | Northeast India T-Shirts, Streetwear & Custom Apparel",
    description: SITE_DESCRIPTION,
    images: [{ url: "/brand/logo.png", width: 512, height: 512, alt: "Fly Free logo" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Fly Free | Northeast India T-Shirts, Streetwear & Custom Apparel",
    description: SITE_DESCRIPTION,
    images: ["/brand/logo.png"],
  },
  manifest: "/manifest.json",
  // Generated favicon set lives in /public/favicon_io.
  icons: {
    icon: [
      { url: "/favicon_io/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon_io/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon_io/android-chrome-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/favicon_io/android-chrome-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    shortcut: "/favicon_io/favicon.ico",
    apple: "/favicon_io/apple-touch-icon.png",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#201e1d",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        {/* Brand tokens come from app/lib/design.ts — edit that file, not the DB. */}
        <style id="design-tokens" dangerouslySetInnerHTML={{ __html: designTokensCss() }} />
      </head>
      <body
        data-campaign-motion={BRAND.motion}
        style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', fontFamily: BRAND.fonts.body }}
        className="min-h-screen flex flex-col"
      >
        <Providers>
          <ContentProtection />
          <Header />
          <main className="flex-1 pb-28 md:pb-0">{children}</main>
          <StyleAssistant />
          <Footer />
          <Toaster richColors position="top-right" closeButton duration={2800} />
          <Analytics />
          <SpeedInsights />
        </Providers>
        <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
      </body>
    </html>
  );
}
