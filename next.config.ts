import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Remove "standalone" output — Vercel handles this automatically
  // standalone is only needed for self-hosted Docker deployments
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
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
