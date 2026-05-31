import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,

  // Server-only packages — never bundled into client JS.
  // Without this, the bundler may try to bundle Node.js modules
  // into client chunks, causing "module not found" or runtime crashes.
  serverExternalPackages: [
    '@libsql/client',
    '@prisma/adapter-libsql',
    'bcryptjs',
    'jsonwebtoken',
    'openai',
    'sharp',
  ],

  // Production URL: https://pualrms-pu.vercel.app
  allowedDevOrigins: ['*.space.z.ai', '*.z.ai', '*.space-z.ai', '*space-z.ai*', '*space.z.ai*'],

  async headers() {
    return [
      {
        source: '/((?!_next/static|_next/image|favicon.ico|logo.png|sounds).*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(self), microphone=(self), geolocation=()' },
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
        ],
      },
    ];
  },
};

export default nextConfig;
