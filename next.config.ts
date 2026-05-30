import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  eslint: {
    ignoreDuringBuilds: true, // Add this to bypass ESLint errors
  },
  typescript: {
    ignoreBuildErrors: true, // Add this line to ignore TypeScript errors during build
  },
  experimental: {
    serverComponentsHmrCache: false, // defaults to true
    serverActions: {
      bodySizeLimit: "5.5mb", // default size limit was 1mb for payload
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "nbntehuqjqllmoqcixac.supabase.co",
      },
    ],
  },
};

export default nextConfig;
