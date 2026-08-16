import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  outputFileTracingRoot: path.join(__dirname, "../.."),
  allowedDevOrigins: ["localhost", "127.0.0.1"]
};

export default nextConfig;
