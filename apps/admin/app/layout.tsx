import type { Metadata, Viewport } from "next";
import { PwaRegister } from "./components/PwaRegister";
import "./globals.css";

export const metadata: Metadata = {
  title: "Fly Free Admin",
  description: "Commerce operations dashboard for Fly Free.",
  manifest: "/manifest.json",
  // Generated favicon set lives in /public/favicon_io.
  icons: {
    icon: [
      { url: "/favicon_io/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon_io/favicon-16x16.png", sizes: "16x16", type: "image/png" }
    ],
    shortcut: "/favicon_io/favicon.ico",
    apple: "/favicon_io/apple-touch-icon.png"
  }
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#111827"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className="antialiased bg-paper text-ink min-h-screen">
        <PwaRegister />
        {children}
      </body>
    </html>
  );
}
