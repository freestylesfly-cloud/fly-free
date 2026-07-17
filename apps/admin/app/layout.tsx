import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Fly Free Admin",
  description: "Commerce operations dashboard for Fly Free."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
