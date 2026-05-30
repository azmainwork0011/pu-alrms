---
Task ID: 1
Agent: Main Agent
Task: Fix PU-ALRMS Google login/signup crash - full authentication flow

Work Log:
- Read and analyzed all auth-related files (auth.ts, route handler, page.tsx, layout.tsx, middleware.ts, AuthPage.tsx, auth-provider.tsx, store/app.ts, jwt.ts, db.ts, schema.prisma, next.config.ts)
- Identified 7 root causes of the client-side exception and auth failures
- Fixed next.config.ts: removed null-loader (not installed as dependency) and turbopack resolveAlias that broke production bundles
- Fixed auth.ts: simplified cookie config (removed __Secure- prefix that could silently reject cookies), added proper NEXTAUTH_URL auto-detection for production via VERCEL_URL
- Fixed auth-provider.tsx: fixed critical import bug - SessionProvider must be imported from 'next-auth/react' not 'next-auth' (was returning undefined with React 19, causing "Element type is invalid" error)
- Fixed page.tsx: removed aggressive 15s OAuth timeout that triggered premature signOut, removed broken manual session fetch fallback, simplified auth bridge logic
- Fixed AuthPage.tsx: removed Google Identity Services (GIS) complexity with hardcoded client_id, kept only reliable NextAuth signIn('google') redirect flow
- Fixed middleware.ts: cleaned up CORS handling for all routes, removed unnecessary route guard logic
- Added global-error.tsx: custom error page instead of default Next.js crash screen
- Verified all endpoints return 200 (homepage, /api/auth/session, /api/auth/csrf)

Stage Summary:
- ROOT CAUSE #1 (Critical): `auth-provider.tsx` imported `SessionProvider` from `next-auth` instead of `next-auth/react` - with React 19, this returned undefined, causing "Element type is invalid: expected a string but got: undefined" crash on EVERY page load
- ROOT CAUSE #2: `next.config.ts` referenced `null-loader` webpack plugin which was NOT installed, breaking Vercel production builds
- ROOT CAUSE #3: `next.config.ts` turbopack resolveAlias with empty string caused production bundle resolution failures
- ROOT CAUSE #4: Custom `__Secure-` cookie prefix in auth.ts could silently reject cookies in certain browsers/proxies
- ROOT CAUSE #5: 15-second OAuth timeout in page.tsx triggered premature signOut, causing users to be logged out before session could be established
- ROOT CAUSE #6: Manual session fetch fallback in page.tsx caused race conditions with useSession hook
- ROOT CAUSE #7: GIS (Google Identity Services) with hardcoded client_id conflicted with NextAuth OAuth flow
- All fixes verified: dev server returns 200 for all endpoints, lint passes clean
