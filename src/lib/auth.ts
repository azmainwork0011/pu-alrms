/**
 * NextAuth.js Configuration for PU-ALRMS (Postgres Edition)
 *
 * Implements Google OAuth with full Postgres database integration.
 * Bridges NextAuth sessions with the existing custom JWT system.
 *
 * Key Features:
 * - Google OAuth flow via NextAuth's GoogleProvider
 * - JWT session strategy (not database sessions — works in serverless)
 * - Custom JWT embedded in NextAuth token for seamless Zustand integration
 * - User creation/linking handled in JWT callback
 * - SUPER_ADMIN role assigned via SUPER_ADMIN_EMAIL env var
 * - Existing email/password auth remains untouched
 * - Graceful error handling for database unavailability
 *
 * Role Assignment:
 * - First-time Google sign-up → STUDENT (unless SUPER_ADMIN_EMAIL matches)
 * - SUPER_ADMIN_EMAIL env → grants SUPER_ADMIN role on match
 * - Existing users keep their role
 * - Banned/Suspended users are rejected
 */

import type { NextAuthOptions } from 'next-auth';
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
    error?: string;
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
    email?: string;
    name?: string;
    error?: string;
  }
}

// ─── Helper: Get NEXTAUTH_SECRET ────────────────────────────
// In Vercel, env vars are available at runtime but NOT during build.
// So we only validate/throw at runtime, not at module evaluation time.
function getNextAuthSecret(): string {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) {
    if (!process.env.VERCEL) {
      console.warn('[NextAuth] NEXTAUTH_SECRET not set, using development fallback.');
    }
    // Return a placeholder for build time — real secret available at runtime
    return 'build-time-placeholder-do-not-use-in-production';
  }
  return secret;
}

// ─── Helper: Determine role for new Google users ────────────
function getRoleForNewUser(email: string): string {
  const superAdminEmail = process.env.SUPER_ADMIN_EMAIL?.toLowerCase().trim();
  if (superAdminEmail && email.toLowerCase().trim() === superAdminEmail) {
    console.log(`[NextAuth] Granting SUPER_ADMIN role to: ${email}`);
    return 'SUPER_ADMIN';
  }
  return 'STUDENT';
}

// ─── NextAuth Configuration ─────────────────────────────────
export const authOptions: NextAuthOptions = {
  // ── Providers ──
  providers: (() => {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      if (process.env.NODE_ENV === 'production') {
        console.error(
          '[NextAuth] Google OAuth is disabled: GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET is missing. ' +
          'Google sign-in will NOT be available.'
        );
      } else {
        console.warn(
          '[NextAuth] Google OAuth is disabled: missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET. ' +
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
     * signIn callback — validates the user can sign in.
     * Runs before JWT creation.
     */
    async signIn({ user, account }) {
      // Only allow Google provider
      if (account?.provider !== 'google') return false;

      // Must have an email
      if (!user.email) {
        console.error('[NextAuth] Google account has no email');
        return '/?error=NoEmail';
      }

      // Google OAuth must be configured
      if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
        console.error('[NextAuth] Google OAuth not configured');
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
        const avatar = (profile as Record<string, unknown>).picture as string || user.image || null;

        if (!email) {
          console.error('[NextAuth] No email available from Google profile');
          token.error = 'NO_EMAIL';
          return token;
        }

        try {
          const { db } = await import('./db');
          let dbUser;
          let isNewUser = false;

          // 1. Check if user exists with this Google ID
          dbUser = await db.user.findUnique({ where: { googleId } });

          if (dbUser) {
            // Existing Google user — check status
            if (dbUser.status === 'BANNED') {
              token.error = 'ACCOUNT_BANNED';
              return token;
            }
            if (dbUser.status === 'SUSPENDED') {
              token.error = 'ACCOUNT_SUSPENDED';
              return token;
            }

            // Update last login and avatar if changed
            await db.user.update({
              where: { id: dbUser.id },
              data: {
                lastLogin: new Date(),
                ...(avatar && avatar !== dbUser.avatar ? { avatar } : {}),
              },
            });
          } else {
            // 2. Check if user exists with this email (account linking)
            const existingByEmail = await db.user.findUnique({ where: { email } });

            if (existingByEmail) {
              // Link Google account to existing user
              dbUser = await db.user.update({
                where: { id: existingByEmail.id },
                data: {
                  googleId,
                  authProvider: 'GOOGLE',
                  lastLogin: new Date(),
                  ...(avatar && !existingByEmail.avatar ? { avatar } : {}),
                },
              });
              console.log(`[NextAuth] Linked Google account to existing user: ${email}`);
            } else {
              // 3. Create new user
              isNewUser = true;
              const role = getRoleForNewUser(email);
              dbUser = await db.user.create({
                data: {
                  email,
                  name,
                  password: '', // No password for OAuth users
                  role,
                  authProvider: 'GOOGLE',
                  googleId,
                  avatar: avatar || `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(name)}&backgroundColor=059669`,
                  verified: role === 'SUPER_ADMIN',
                  lastLogin: new Date(),
                },
              });
              console.log(`[NextAuth] Created new Google user: ${email} (${role})`);
            }
          }

          // 4. Create/update NextAuth Account record
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

          // 5. Build custom JWT payload
          const jwtPayload: JWTPayload = {
            userId: dbUser.id,
            email: dbUser.email,
            role: dbUser.role,
            name: dbUser.name,
          };
          const customJwt = signToken(jwtPayload);

          // 6. Embed everything in NextAuth JWT
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

          console.log(`[NextAuth] Google login successful: ${email} (${dbUser.role})`);
        } catch (dbError) {
          console.error('[NextAuth] Database error during Google login:', dbError);
          token.error = 'DATABASE_UNAVAILABLE';
        }
      }

      return token;
    },

    /**
     * Session callback — exposes custom data to the client.
     */
    async session({ session, token }) {
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
    async linkAccount() {
      // Account linking handled in JWT callback — pass through
    },
    async signInError({ error }: { error: string }) {
      const errorMap: Record<string, string> = {
        OAuthSignin: 'Configuration',
        OAuthCallback: 'Callback',
        OAuthCreateAccount: 'CreateAccount',
        OAuthAccountNotLinked: 'AccountNotLinked',
        EmailSignin: 'EmailSignin',
        CredentialsSignin: 'InvalidCredentials',
        SessionRequired: 'SessionRequired',
        Default: 'Unknown',
      };
      return `/?error=${errorMap[error] || 'Unknown'}`;
    },
  } as any,

  // ── Security ──
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
