import type { Metadata } from "next";
import { Providers } from "./providers";
import { Header } from "./components/Header";
import { Footer } from "./components/Footer";
import "./globals.css";

export const metadata: Metadata = {
  title: "Fly Free - Premium T-Shirts & Streetwear",
  description: "Explore our collection of stylish and comfortable t-shirts with unique designs. Custom t-shirt designer, multiple themes, and secure checkout.",
  manifest: "/manifest.json",
  icons: {
    icon: "/favicon.ico",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#111827",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
      </head>
      <body style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', fontFamily: 'var(--font-family)' }} className="min-h-screen flex flex-col">
        <Providers>
          <Header />
          <main className="flex-1 pb-16 md:pb-0">{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
