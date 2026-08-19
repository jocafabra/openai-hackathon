import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,
  output: "standalone",
  outputFileTracingIncludes: {
    "/*": ["node_modules/.pnpm/@swc+helpers@*/node_modules/@swc/helpers/**/*"],
  },
};

export default nextConfig;
