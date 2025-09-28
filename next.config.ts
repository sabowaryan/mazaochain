import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // PWA configuration
  experimental: {
    ppr: false,
  },
  // Temporarily disable ESLint during build for development
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Enable service worker
  async headers() {
    return [
      {
        source: '/sw.js',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=0, must-revalidate',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
