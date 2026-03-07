import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@umati/prisma", "@umati/env"],

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.icons8.com",
      },
    ],
  },

  /* config options here */
  allowedDevOrigins: ["local-origin.dev", "*.local-origin.dev"],
  serverExternalPackages: ["@prisma/client"],
  experimental: {},
};

export default nextConfig;
