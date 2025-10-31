import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  
  /* config options here */
  allowedDevOrigins: ['local-origin.dev', '*.local-origin.dev'],
  serverExternalPackages: ['@prisma/client', '@umati/prisma'],
experimental: {
}
};

export default nextConfig;
