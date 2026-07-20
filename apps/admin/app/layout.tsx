import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Fly Free Admin",
  description: "Commerce operations dashboard for Fly Free.",
  icons: {
    icon: "/logo.png"
  },
  viewport: "width=device-width, initial-scale=1, maximum-scale=5"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className="antialiased bg-paper text-ink min-h-screen">
        {children}
      </body>
    </html>
  );
}
