import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  turbopack: {
    root: process.cwd(),
  },
  // Suppress hydration warnings in development
  reactStrictMode: true,
  // Suppress hydration warnings for browser extensions
  experimental: {
    suppressHydrationWarning: true,
  },
};

export default nextConfig;
