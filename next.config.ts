import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    serverComponentsHmrCache: false, // defaults to true
    serverActions: {
      bodySizeLimit: "5.5mb",// default size limit was 1mb for payload
    },
  },
};

export default nextConfig;
