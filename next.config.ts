import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['@react-pdf/renderer', 'canvas'],
  // Exclude the large card image library from being bundled into serverless functions.
  // These files are served by Vercel's CDN — they don't need to be inside the function zip.
  outputFileTracingExcludes: {
    '*': ['./public/cards/**/*'],
  },
  // Disable client-side Router Cache for dynamic pages so navigating between
  // different card slugs always loads fresh data (fixes "wrong card" bug).
  experimental: {
    staleTimes: {
      dynamic: 0,
    },
  },
};

export default nextConfig;
