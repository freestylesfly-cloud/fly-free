import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Fly Free",
  description: "Dynamic streetwear and custom apparel storefront."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
