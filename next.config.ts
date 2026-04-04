import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['@react-pdf/renderer', 'canvas'],
  // Exclude the large card image library from being bundled into serverless functions.
  // These files are served by Vercel's CDN — they don't need to be inside the function zip.
  outputFileTracingExcludes: {
    '*': ['./public/cards/**/*'],
  },
};

export default nextConfig;
