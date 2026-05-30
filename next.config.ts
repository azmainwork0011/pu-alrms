import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,

  // Turbopack is default in Next.js 16+. Empty config = accept defaults.
  // This silences the "webpack config without turbopack config" error.
  turbopack: {},

  // Webpack fallback: fixes @libsql isomorphic-fetch README.md parsed as JS.
  // Turbopack handles .md files correctly — this rule only applies when
  // building with `--webpack` flag or if Turbopack falls back to webpack.
  webpack: (config) => {
    config.module.rules.push({
      test: /\.md$/,
      type: 'asset/resource',
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
