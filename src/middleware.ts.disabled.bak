import { NextRequest, NextResponse } from 'next/server';

/**
 * Next.js Middleware - Security Headers & CORS
 * Runs on every request before it reaches API routes or pages
 */
export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // ── Security Headers (Helmet.js equivalent) ────────────────────
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  response.headers.set('X-DNS-Prefetch-Control', 'on');

  // HSTS - Force HTTPS in production
  if (process.env.NODE_ENV === 'production') {
    response.headers.set(
      'Strict-Transport-Security',
      'max-age=63072000; includeSubDomains; preload'
    );
  }

  // Remove Content-Type override - let Next.js handle it automatically
  // Setting it here for all /api/ routes was causing issues

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|logo.png|sounds).*)',
  ],
};
