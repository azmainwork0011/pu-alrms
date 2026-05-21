'use client';

/**
 * NextAuth Session Provider Wrapper
 *
 * Wraps the app with next-auth's SessionProvider to enable useSession() hook.
 * This is required for NextAuth to work in client components.
 */

import { SessionProvider as NextAuthSessionProvider } from 'next-auth/react';
import type { Session } from 'next-auth';

interface NextAuthProviderProps {
  children: React.ReactNode;
  session?: Session | null;
}

export function NextAuthProvider({ children, session }: NextAuthProviderProps) {
  return <NextAuthSessionProvider session={session}>{children}</NextAuthSessionProvider>;
}
