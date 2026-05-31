import { NextRequest, NextResponse } from 'next/server';

// ═══════════════════════════════════════════════════════════════════
// Security Middleware — Headers + CORS
// ═══════════════════════════════════════════════════════════════════
//
// NOTE: PU-ALRMS uses a single-page app architecture.
// Route guarding is handled client-side via Zustand auth state.
// Middleware only handles security headers and CORS.

export function middleware(request: NextRequest) {
  const response = NextResponse.next();
  const { pathname } = request.nextUrl;

  // ── NextAuth routes: pass through with CORS only ──
  // NextAuth manages its own CSRF + security headers
  if (pathname.startsWith('/api/auth/')) {
    const origin = request.headers.get('origin');
    if (origin) {
      response.headers.set('Access-Control-Allow-Origin', origin);
      response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      response.headers.set('Access-Control-Allow-Credentials', 'true');
    }

    if (request.method === 'OPTIONS') {
      return new NextResponse(null, { status: 204, headers: response.headers });
    }

    return response;
  }

  // ── API routes: add CORS headers ──
  if (pathname.startsWith('/api/')) {
    const origin = request.headers.get('origin');
    if (origin) {
      response.headers.set('Access-Control-Allow-Origin', origin);
      response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      response.headers.set('Access-Control-Allow-Credentials', 'true');
    }

    if (request.method === 'OPTIONS') {
      return new NextResponse(null, { status: 204, headers: response.headers });
    }

    return response;
  }

  // ── Page routes: security headers only ──
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(self), microphone=(self), geolocation=()');
  response.headers.set('X-DNS-Prefetch-Control', 'on');

  if (process.env.NODE_ENV === 'production') {
    response.headers.set(
      'Strict-Transport-Security',
      'max-age=63072000; includeSubDomains; preload'
    );
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|logo.png|sounds).*)',
  ],
};
