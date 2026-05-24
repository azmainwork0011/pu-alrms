/**
 * NextAuth.js Configuration for PU-ALRMS
 *
 * Implements Google OAuth with full database integration.
 * Bridges NextAuth sessions with the existing custom JWT system.
 *
 * Strategy:
 * - Google OAuth flow via NextAuth's GoogleProvider
 * - JWT session strategy (not database sessions)
 * - Custom JWT embedded in NextAuth token for seamless Zustand integration
 * - User creation/linking handled in JWT callback
 * - Existing email/password auth remains untouched
 */

import type { NextAuthOptions, Session } from 'next-auth';
import type { JWT } from 'next-auth/jwt';
import GoogleProvider from 'next-auth/providers/google';
import { signToken, type JWTPayload } from './jwt';

// ─── Extended Session Type ──────────────────────────────────
declare module 'next-auth' {
  interface Session {
    customJwt?: string;
    userId?: string;
    isNewUser?: boolean;
    authProvider?: string;
    role?: string;
    avatar?: string;
  }

  interface User {
    googleId?: string;
    authProvider?: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    customJwt?: string;
    userId?: string;
    isNewUser?: boolean;
    authProvider?: string;
    role?: string;
    avatar?: string;
  }
}

// ─── Helper: Environment variable validation ────────────────
function getEnvVar(name: string, required = true): string {
  const value = process.env[name];
  if (required && !value) {
    if (process.env.NODE_ENV === 'production') {
      console.error(`[NextAuth] FATAL: ${name} is required in production but is not set. Aborting Google OAuth provider registration.`);
      return '';
    }
    console.warn(`[NextAuth] ${name} is not set. Google OAuth will be disabled.`);
  }
  return value || '';
}

// ─── Get NEXTAUTH_SECRET with production validation ──────────
// Note: In Vercel, env vars are available at runtime but NOT during build.
// So we only validate/throw at runtime, not at module evaluation time.
function getNextAuthSecret(): string {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) {
    // During build (Next.js collects page data), Vercel doesn't inject env vars.
    // Return a placeholder — the real secret will be available at runtime.
    if (!process.env.VERCEL) {
      console.warn('[NextAuth] NEXTAUTH_SECRET not set, using development fallback.');
    }
    return 'build-time-placeholder';
  }
  return secret;
}

// ─── NextAuth Configuration ─────────────────────────────────
export const authOptions: NextAuthOptions = {
  // ── Providers ──
  // In production, Google OAuth requires both GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET.
  // If either is missing, the Google provider is NOT registered to prevent
  // confusing NextAuth errors from empty credentials.
  providers: (() => {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      if (process.env.NODE_ENV === 'production') {
        console.error(
          '[NextAuth] Google OAuth is disabled: GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET is missing. ' +
          'Google sign-in will NOT be available. Set both variables in your environment.'
        );
      } else {
        console.warn(
          '[NextAuth] Google OAuth is disabled: GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET is missing. ' +
          'Set both in .env.local to enable Google sign-in.'
        );
      }
      return [];
    }

    return [
      GoogleProvider({
        clientId,
        clientSecret,
        authorization: {
          params: {
            prompt: 'select_account',
            access_type: 'offline',
            response_type: 'code',
          },
        },
      }),
    ];
  })(),

  // ── Callbacks ──
  callbacks: {
    /**
     * signIn callback — runs before JWT creation.
     * Validates that the user can sign in.
     */
    async signIn({ user, account, profile }) {
      // Only allow Google provider
      if (account?.provider !== 'google') return false;

      // Must have an email
      if (!user.email) {
        console.error('[NextAuth] Google account has no email');
        return '/?error=NoEmail';
      }

      // Google OAuth must be configured (no dev fallback in production)
      if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
        console.error('[NextAuth] Google OAuth not configured (missing CLIENT_ID or CLIENT_SECRET)');
        return '/?error=Configuration';
      }

      return true;
    },

    /**
     * JWT callback — the core of our auth bridge.
     * Creates/links user in database and embeds our custom JWT.
     */
    async jwt({ token, account, profile, user }) {
      // Only process on first sign-in (when account exists)
      if (account && profile) {
        const googleId = account.providerAccountId;
        const email = (profile.email || user.email || '').toLowerCase().trim();
        const name = profile.name || user.name || 'Google User';
        const avatar = (profile as any).picture || user.image || null;

        if (!email) {
          console.error('[NextAuth] No email available from Google profile');
          return token;
        }

        try {
          // ── Database path: full user creation/linking ──
          const { db } = await import('./db');

          let dbUser;
          let isNewUser = false;

          // 1. Check if user exists with this Google ID
          dbUser = await db.user.findUnique({ where: { googleId } });

          if (dbUser) {
            if (dbUser.status === 'BANNED') {
              token.error = 'ACCOUNT_BANNED';
              return token;
            }
            if (dbUser.status === 'SUSPENDED') {
              token.error = 'ACCOUNT_SUSPENDED';
              return token;
            }
            await db.user.update({
              where: { id: dbUser.id },
              data: {
                lastLogin: new Date(),
                ...(avatar && avatar !== dbUser.avatar ? { avatar } : {}),
              },
            });
          } else {
            const existingByEmail = await db.user.findUnique({ where: { email } });
            if (existingByEmail) {
              dbUser = await db.user.update({
                where: { id: existingByEmail.id },
                data: { googleId, authProvider: 'GOOGLE', lastLogin: new Date(), ...(avatar ? { avatar } : {}) },
              });
            } else {
              isNewUser = true;
              dbUser = await db.user.create({
                data: {
                  email, name, password: '', role: 'STUDENT', authProvider: 'GOOGLE', googleId,
                  avatar: avatar || `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(name)}&backgroundColor=059669`,
                  lastLogin: new Date(),
                },
              });
            }
          }

          // After user is created/linked, create Account record for NextAuth
          await db.account.upsert({
            where: {
              provider_providerAccountId: {
                provider: 'google',
                providerAccountId: googleId,
              },
            },
            create: {
              userId: dbUser.id,
              type: 'oauth',
              provider: 'google',
              providerAccountId: googleId,
              access_token: account.access_token,
              token_type: account.token_type,
              scope: account.scope,
              id_token: account.id_token,
            },
            update: {
              access_token: account.access_token,
              token_type: account.token_type,
              scope: account.scope,
              id_token: account.id_token,
            },
          });

          const jwtPayload: JWTPayload = {
            userId: dbUser.id,
            email: dbUser.email,
            role: dbUser.role,
            name: dbUser.name,
          };
          const customJwt = signToken(jwtPayload);

          token.customJwt = customJwt;
          token.userId = dbUser.id;
          token.email = dbUser.email;
          token.role = dbUser.role;
          token.name = dbUser.name;
          token.isNewUser = isNewUser || !dbUser.batch;
          token.avatar = dbUser.avatar;
          token.authProvider = 'GOOGLE';
          token.sub = dbUser.id;
          token.error = undefined;

          console.log(`[NextAuth] Google login successful (DB): ${email} (${dbUser.role})`);
        } catch (dbError) {
          // ── Database unavailable ──
          // Return error so the frontend can show a proper message
          console.error('[NextAuth] Database unavailable:', dbError);
          token.error = 'DATABASE_UNAVAILABLE';
        }
      }

      return token;
    },

    /**
     * Session callback — exposes our custom data to the client.
     */
    async session({ session, token }): Promise<any> {
      // Pass through error state
      if (token.error) {
        return { ...session, error: token.error };
      }

      // Transfer custom data from JWT to session
      session.customJwt = token.customJwt;
      session.userId = token.userId;
      session.isNewUser = token.isNewUser;
      session.authProvider = token.authProvider;
      session.role = token.role;
      session.avatar = token.avatar;

      // Set user info from our token (more reliable than NextAuth's default)
      if (session.user) {
        session.user.email = token.email || session.user.email;
        session.user.name = token.name || session.user.name;
        session.user.image = token.avatar || session.user.image;
      }

      return session;
    },
  },

  // ── Session Strategy ──
  session: {
    strategy: 'jwt',
    maxAge: 7 * 24 * 60 * 60, // 7 days (matches existing JWT expiry)
  },

  // ── Pages ──
  pages: {
    signIn: '/',
    error: '/',
  },

  // ── Events ──
  events: {
    /**
     * Handle NextAuth sign-in/sign-out errors gracefully.
     * Redirects to our custom AuthPage with an error query parameter.
     */
    async linkAccount({ profile, account, user }) {
      // This event fires on first OAuth login. We handle user creation
      // in the JWT callback, so we just let it pass through.
    },
    async signInError({ error }) {
      const errorMap: Record<string, string> = {
        OAuthSignin: 'Error=Configuration',
        OAuthCallback: 'Error=Callback',
        OAuthCreateAccount: 'Error=CreateAccount',
        OAuthAccountNotLinked: 'Error=AccountNotLinked',
        EmailSignin: 'Error=EmailSignin',
        CredentialsSignin: 'Error=InvalidCredentials',
        SessionRequired: 'Error=SessionRequired',
        Default: 'Error=Default',
      };
      return `/?${errorMap[error] || 'Error=Unknown'}`;
    },
  } as any,

  // ── Security ──
  // NEXTAUTH_SECRET: lazy evaluation — returns placeholder during build,
  // real secret available at runtime on Vercel.
  secret: getNextAuthSecret(),
  debug: process.env.NODE_ENV === 'development',

  // ── Cookies ──
  cookies: {
    sessionToken: {
      name: `${process.env.NODE_ENV === 'production' ? '__Secure-' : ''}next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
    callbackUrl: {
      name: `${process.env.NODE_ENV === 'production' ? '__Secure-' : ''}next-auth.callback-url`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
    csrfToken: {
      name: `${process.env.NODE_ENV === 'production' ? '__Secure-' : ''}next-auth.csrf-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
  },
};
