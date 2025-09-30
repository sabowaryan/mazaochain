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
  // Webpack configuration pour corriger les erreurs de source map
  webpack: (config, { dev, isServer }) => {
    if (dev && !isServer) {
      // Désactiver les source maps pour les modules problématiques
      config.module.rules.push({
        test: /\.js$/,
        enforce: 'pre',
        use: ['source-map-loader'],
        exclude: [
          /node_modules\/@walletconnect/,
          /node_modules\/@hashgraph/,
          /wasm:/
        ],
      });
    }
    return config;
  },
  // Configuration des domaines pour les cookies
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
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
