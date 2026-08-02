import type { Metadata } from "next";
import { Providers } from "./providers";
import { Header } from "./components/Header";
import { Footer } from "./components/Footer";
import "./globals.css";

export const metadata: Metadata = {
  title: "Fly Free - Premium T-Shirts & Streetwear",
  description: "Explore our collection of stylish and comfortable t-shirts with unique designs. Custom t-shirt designer, multiple themes, and secure checkout.",
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
      </head>
      <body style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', fontFamily: "'Times New Roman', Georgia, serif" }} className="min-h-screen flex flex-col">
        <Providers>
          <Header />
          <main className="flex-1 pb-28 md:pb-0">{children}</main>
          <Footer />
        </Providers>
        <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
      </body>
    </html>
  );
}
