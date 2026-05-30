'use client';

/**
 * NextAuth Session Provider Wrapper
 *
 * Wraps the app with next-auth's SessionProvider to enable useSession() hook.
 * Uses dynamic import to handle potential compatibility issues.
 */

import type { ReactNode } from 'react';

interface NextAuthProviderProps {
  children: ReactNode;
}

// Dynamic import SessionProvider to avoid SSR issues
export function NextAuthProvider({ children }: NextAuthProviderProps) {
  // We'll import SessionProvider in a client component wrapper
  return <NextAuthSessionWrapper>{children}</NextAuthSessionWrapper>;
}

// This must be a separate component to use dynamic import at module level
import { SessionProvider } from 'next-auth/react';

function NextAuthSessionWrapper({ children }: { children: ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>;
}
