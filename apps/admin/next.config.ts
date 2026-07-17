import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@flyfree/ui", "@flyfree/types", "@flyfree/utils"]
};

export default nextConfig;
