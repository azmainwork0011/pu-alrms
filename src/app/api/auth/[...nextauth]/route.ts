/**
 * NextAuth API Route Handler
 *
 * Handles all NextAuth endpoints:
 * - GET/POST /api/auth/signin
 * - GET/POST /api/auth/signout
 * - GET/POST /api/auth/callback/:provider
 * - GET  /api/auth/session
 * - GET  /api/auth/csrf
 *
 * This coexists with the existing /api/auth/google, /api/auth/login, etc.
 * Next.js App Router handles the dynamic [...nextauth] segment separately.
 */

import NextAuth from 'next-auth';
import { authOptions } from '@/lib/auth';

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
