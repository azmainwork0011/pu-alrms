/**
 * Demo Mode Guard — Backend Middleware
 *
 * Blocks write operations (POST, PUT, DELETE, PATCH) for demo users.
 * Demo users are identified by a custom header `X-Demo-Mode: true`.
 * Auth endpoints (login, register, seed, temp-email, google) are always allowed.
 *
 * Usage in API routes:
 *   import { demoGuard } from '@/lib/demo-guard';
 *   export async function POST(request: Request) {
 *     const blocked = demoGuard(request);
 *     if (blocked) return blocked;
 *     // ... your handler
 *   }
 */

import { NextResponse } from 'next/server';

// Endpoints that are always allowed (even for demo users)
const ALLOWED_ENDPOINTS = [
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/seed',
  '/api/auth/temp-email',
  '/api/auth/google',
];

// Write methods that demo users cannot use
const WRITE_METHODS = ['POST', 'PUT', 'DELETE', 'PATCH'];

export function demoGuard(request: Request): NextResponse | null {
  // Only check write methods
  const method = request.method.toUpperCase();
  if (!WRITE_METHODS.includes(method)) {
    return null; // GET requests are always allowed
  }

  // Allow auth endpoints
  const url = new URL(request.url);
  const path = url.pathname;
  if (ALLOWED_ENDPOINTS.some(ep => path.startsWith(ep))) {
    return null;
  }

  // Check for demo mode header
  const isDemo = request.headers.get('X-Demo-Mode') === 'true';
  if (isDemo) {
    return NextResponse.json(
      {
        error: 'Write operations are disabled in demo mode.',
        code: 'DEMO_MODE_BLOCKED',
      },
      { status: 403 }
    );
  }

  return null; // Not a demo user, proceed normally
}
