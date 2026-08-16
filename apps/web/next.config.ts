import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  outputFileTracingRoot: path.join(__dirname, "../.."),
  allowedDevOrigins: ["localhost", "127.0.0.1"],
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
