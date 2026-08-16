import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  outputFileTracingRoot: path.join(__dirname, "../.."),
  allowedDevOrigins: ["http://localhost:3002", "http://127.0.0.1:3002"]
};

export default nextConfig;
