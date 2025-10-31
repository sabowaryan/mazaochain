/** @type {import('next').NextConfig} */
const nextConfig = {
  // PWA configuration
  experimental: {
    ppr: false,
  },
  // Turbopack configuration (Next.js 15+)
  turbopack: {
    resolveAlias: {
      // Polyfills pour les modules Node.js côté client
      crypto: "crypto-browserify",
      stream: "stream-browserify",
      buffer: "buffer",
    },
    resolveExtensions: [".mdx", ".tsx", ".ts", ".jsx", ".js", ".mjs", ".json"],
  },
  // Temporarily disable ESLint during build for development
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Webpack configuration (utilisé uniquement pour les builds de production)
  webpack: (config: { externals: string[]; resolve: { fallback: any; }; plugins: any[]; }, { isServer }: { isServer: boolean }) => {
    // Externaliser les modules problématiques (recommandation Reown Appkit)
    config.externals.push("pino-pretty", "lokijs", "encoding");
    
    // Externaliser @hashgraph/sdk côté serveur pour éviter les erreurs Buffer.constants
    if (isServer) {
      config.externals.push('@hashgraph/sdk');
    }

    // Ajouter le plugin ProvidePlugin pour buffer (nécessaire pour @hashgraph/sdk côté client uniquement)
    if (!isServer) {
      const webpack = require('webpack');
      config.plugins.push(
        new webpack.ProvidePlugin({
          Buffer: ['buffer', 'Buffer'],
          process: 'process/browser',
        })
      );

      // Ajouter les constantes Buffer nécessaires pour Hedera SDK côté client
      config.plugins.push(
        new webpack.DefinePlugin({
          'Buffer.constants': JSON.stringify({
            MAX_LENGTH: 2147483647,
            MAX_STRING_LENGTH: 536870888
          })
        })
      );
    }

    // Fallback pour les modules Node.js non disponibles côté client
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: require.resolve("crypto-browserify"),
        stream: require.resolve("stream-browserify"),
        buffer: require.resolve("buffer"),
        process: require.resolve("process/browser"),
      };
    }

    return config;
  },
  // Configuration des domaines pour les cookies
  async headers() {
    return [
      {
        source: "/sw.js",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=0, must-revalidate",
          },
        ],
      },
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "origin-when-cross-origin",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
