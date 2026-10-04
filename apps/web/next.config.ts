import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  outputFileTracingRoot: path.join(__dirname, "../.."),
  allowedDevOrigins: ["localhost", "127.0.0.1"],
  devIndicators: false,
  experimental: {
    devtoolSegmentExplorer: false
  },
  images: {
    // Media lives on Cloudinary. Routing it through the Next optimizer means
    // Cloudinary is read once per image and width, then Vercel's CDN serves every
    // visitor — Supabase was restricted for egress when this was skipped.
    // The Supabase pattern stays only so any link not yet migrated still renders.
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        pathname: "/nkruger4/**"
      },
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**"
      }
    ],
    formats: ["image/webp"],
    // Source paths embed a timestamp and are never reused, so an optimized
    // variant stays valid forever. A replaced image gets a brand-new URL.
    minimumCacheTTL: 31536000,
    // The optimizer rejects any width not listed here, so these must stay in
    // sync with the widths passed to storageImage() in app/lib/image.ts.
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384]
  },
  async rewrites() {
    return {
      beforeFiles: [
        {
          source: "/api/:path*",
          destination: `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/api/:path*`
        }
      ]
    };
  }
};

export default nextConfig;
