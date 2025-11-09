import type { NextConfig } from "next";

const nextConfig: NextConfig = {

  images: {
    remotePatterns: [{
      protocol: 'https',
      hostname: "**.icons8.com"
    }]
  },
  
  /* config options here */
  allowedDevOrigins: ['local-origin.dev', '*.local-origin.dev'],
  serverExternalPackages: ['@prisma/client', '@umati/prisma'],
experimental: {
}
};

export default nextConfig;
