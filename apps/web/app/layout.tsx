import type { Metadata } from "next";
import { ThemeProvider } from "./components/ThemeProvider";
import { Header } from "./components/Header";
import "./globals.css";

export const metadata: Metadata = {
  title: "Fly Free - Streetwear & Custom T-Shirts",
  description: "Dynamic streetwear and custom apparel storefront. Custom t-shirt designer, multiple themes, and secure checkout.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <ThemeProvider>
          <Header />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
