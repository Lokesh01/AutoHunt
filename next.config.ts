import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
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
        hostname: "ndfwohusrgytsjmrgaqg.supabase.co",
      },
    ],
  },
  async headers() {
    return [
      {
        source: "/embed",
        headers: [
          {
            key: "Content-Security-Policy",
            value: "frame-src 'self' https://roadsidecoder.created.app;",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
