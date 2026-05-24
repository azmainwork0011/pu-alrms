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
    console.warn(`[NextAuth] ${name} is not set. Google OAuth will be disabled.`);
  }
  return value || '';
}

// ─── NextAuth Configuration ─────────────────────────────────
export const authOptions: NextAuthOptions = {
  // ── Providers ──
  providers: [
    GoogleProvider({
      clientId: getEnvVar('GOOGLE_CLIENT_ID'),
      clientSecret: getEnvVar('GOOGLE_CLIENT_SECRET'),
      authorization: {
        params: {
          prompt: 'select_account',
          access_type: 'offline',
          response_type: 'code',
        },
      },
    }),
  ],

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
        return false;
      }

      // Check if Google OAuth is properly configured
      if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
        console.error('[NextAuth] Google OAuth not configured (missing CLIENT_ID or CLIENT_SECRET)');
        return false;
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
        try {
          const { db } = await import('./db');

          const googleId = account.providerAccountId;
          const email = (profile.email || user.email || '').toLowerCase().trim();
          const name = profile.name || user.name || 'Google User';
          const avatar = (profile as any).picture || user.image || null;

          if (!email) {
            console.error('[NextAuth] No email available from Google profile');
            return token;
          }

          let dbUser;
          let isNewUser = false;

          // 1. Check if user exists with this Google ID
          dbUser = await db.user.findUnique({ where: { googleId } });

          if (dbUser) {
            // Check account status
            if (dbUser.status === 'BANNED') {
              console.warn(`[NextAuth] Banned user attempted login: ${email}`);
              token.error = 'ACCOUNT_BANNED';
              return token;
            }
            if (dbUser.status === 'SUSPENDED') {
              console.warn(`[NextAuth] Suspended user attempted login: ${email}`);
              token.error = 'ACCOUNT_SUSPENDED';
              return token;
            }

            // Update last login and avatar
            await db.user.update({
              where: { id: dbUser.id },
              data: {
                lastLogin: new Date(),
                ...(avatar && avatar !== dbUser.avatar ? { avatar } : {}),
              },
            });
          } else {
            // 2. Check if email already exists with a different provider
            const existingByEmail = await db.user.findUnique({ where: { email } });

            if (existingByEmail) {
              // Link Google account to existing email account
              dbUser = await db.user.update({
                where: { id: existingByEmail.id },
                data: {
                  googleId,
                  authProvider: 'GOOGLE',
                  lastLogin: new Date(),
                  ...(avatar ? { avatar } : {}),
                },
              });
            } else {
              // 3. Create new user
              isNewUser = true;
              dbUser = await db.user.create({
                data: {
                  email,
                  name,
                  password: '',
                  role: 'STUDENT',
                  authProvider: 'GOOGLE',
                  googleId,
                  avatar:
                    avatar ||
                    `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(name)}&backgroundColor=059669`,
                  lastLogin: new Date(),
                },
              });
            }
          }

          // Sign our custom JWT (compatible with existing system)
          const jwtPayload: JWTPayload = {
            userId: dbUser.id,
            email: dbUser.email,
            role: dbUser.role,
            name: dbUser.name,
          };
          const customJwt = signToken(jwtPayload);

          // Embed everything in the NextAuth token
          token.customJwt = customJwt;
          token.userId = dbUser.id;
          token.email = dbUser.email;
          token.role = dbUser.role;
          token.name = dbUser.name;
          token.isNewUser = isNewUser || !dbUser.batch;
          token.avatar = dbUser.avatar;
          token.authProvider = 'GOOGLE';
          token.sub = dbUser.id; // NextAuth standard
          token.error = undefined; // Clear any previous errors

          console.log(`[NextAuth] Google login successful: ${email} (${dbUser.role})`);
        } catch (error) {
          console.error('[NextAuth] Error during JWT callback:', error);
          token.error = 'INTERNAL_ERROR';
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
    signIn: '/', // Use our custom AuthPage as the sign-in page
    error: '/',  // Redirect errors to our custom page
  },

  // ── Security ──
  secret: process.env.NEXTAUTH_SECRET || 'pu-alrms-nextauth-secret-fallback',
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
