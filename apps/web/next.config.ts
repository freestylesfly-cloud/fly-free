import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@flyfree/ui", "@flyfree/types", "@flyfree/utils"],
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
