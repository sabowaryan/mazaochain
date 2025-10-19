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
      buffer: "buffer/",
    },
    resolveExtensions: [".mdx", ".tsx", ".ts", ".jsx", ".js", ".mjs", ".json"],
  },
  // Temporarily disable ESLint during build for development
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Webpack configuration (utilisé uniquement pour les builds de production)
  webpack: (config: { externals: string[]; resolve: { fallback: any; }; }, { isServer }: any) => {
    // Externaliser les modules problématiques (recommandation Reown Appkit)
    config.externals.push("pino-pretty", "lokijs", "encoding");

    // Fallback pour les modules Node.js non disponibles côté client
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: require.resolve("crypto-browserify"),
        stream: require.resolve("stream-browserify"),
        buffer: require.resolve("buffer/"),
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
