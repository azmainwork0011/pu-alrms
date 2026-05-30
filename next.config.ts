import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,

  // Server-only packages — never bundled into client JS.
  // Without this, Turbopack may try to bundle Node.js modules
  // (like @libsql/client, bcryptjs, jsonwebtoken) into client chunks,
  // causing "module not found" or runtime crashes in the browser.
  serverExternalPackages: [
    '@libsql/client',
    'bcryptjs',
    'jsonwebtoken',
  ],

  // Turbopack config (Next.js 16 default bundler for dev and build).
  // resolveAlias ensures Turbopack doesn't try to bundle .md files as JS.
  turbopack: {
    resolveAlias: {
      // Ignore README.md files from @libsql/isomorphic-fetch
      '@libsql/isomorphic-fetch/README.md': '',
    },
  },

  // Webpack fallback config (used when building with --webpack flag).
  webpack: (config, { isServer }) => {
    // Skip .md files on client side to prevent bundling them as JS
    if (!isServer) {
      config.resolve = config.resolve || {};
      config.resolve.alias = {
        ...config.resolve.alias,
        '@libsql/isomorphic-fetch/README.md': false,
      };
    }
    // Handle .md files as empty assets to prevent parse errors
    config.module.rules.push({
      test: /\.md$/,
      type: 'asset/resource',
      use: 'null-loader',
    });
    return config;
  },

  allowedDevOrigins: ['*.space.z.ai', '*.z.ai', '*.space-z.ai', '*space-z.ai*', '*space.z.ai*'],

  async headers() {
    return [
      {
        source: '/((?!_next/static|_next/image|favicon.ico|logo.png|sounds).*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
        ],
      },
    ];
  },
};

export default nextConfig;
