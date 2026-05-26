import { NextRequest, NextResponse } from 'next/server';

/**
 * Google OAuth Login (Production)
 *
 * Accepts a Google ID token (from Google Identity Services) in the POST body.
 * Field: `credential` (from GIS) or `idToken` (backward compatible).
 * Verifies the token via Google's tokeninfo endpoint, then creates/links the user.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    // Accept both `credential` (GIS) and `idToken` (legacy) field names
    const idToken = body.credential || body.idToken;

    // ── Production: Only accept real Google ID tokens ──
    if (!idToken) {
      return NextResponse.json(
        { error: 'Google ID token (credential) is required. Please use the Google sign-in button.' },
        { status: 400 },
      );
    }

    if (!process.env.GOOGLE_CLIENT_ID) {
      return NextResponse.json(
        { error: 'Google OAuth is not configured.' },
        { status: 503 },
      );
    }

    // Verify the Google ID token by fetching Google's tokeninfo endpoint
    let userGoogleId: string;
    let userEmail: string;
    let userName: string;
    let userAvatar: string | null;

    try {
      const response = await fetch(
        `https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`,
      );
      if (!response.ok) {
        return NextResponse.json(
          { error: 'Google token verification failed.' },
          { status: 401 },
        );
      }
      const payload = await response.json();

      // Verify audience matches our client ID
      if (payload.aud !== process.env.GOOGLE_CLIENT_ID && !payload.aud?.includes(process.env.GOOGLE_CLIENT_ID)) {
        return NextResponse.json(
          { error: 'Google token audience mismatch.' },
          { status: 401 },
        );
      }

      if (!payload.email || !payload.sub) {
        return NextResponse.json(
          { error: 'Google account must have an email address.' },
          { status: 400 },
        );
      }

      userGoogleId = payload.sub;
      userEmail = payload.email.trim().toLowerCase();
      userName = payload.name || payload.given_name || 'Google User';
      userAvatar = payload.picture || null;
    } catch (err) {
      console.error('[Google Auth] Token verification failed:', err instanceof Error ? err.message : err);
      return NextResponse.json(
        { error: 'Google token verification failed. Please try again.' },
        { status: 401 },
      );
    }

    const normalizedEmail = userEmail;

    const { db } = await import('@/lib/db');

    // Check if user already exists with this Google ID
    let user = await db.user.findUnique({ where: { googleId: userGoogleId } });
    let isNewUser = false;

    if (user) {
      if (user.status === 'BANNED') {
        return NextResponse.json({ error: 'Account has been banned. Contact support.' }, { status: 403 });
      }
      if (user.status === 'SUSPENDED') {
        return NextResponse.json({ error: 'Account is suspended. Contact an administrator.' }, { status: 403 });
      }
      await db.user.update({
        where: { id: user.id },
        data: { lastLogin: new Date(), ...(userAvatar ? { avatar: userAvatar } : {}) },
      });
    } else {
      // Check if email already exists with a different provider
      const existingByEmail = await db.user.findUnique({ where: { email: normalizedEmail } });
      if (existingByEmail) {
        if (existingByEmail.authProvider === 'GOOGLE') {
          // Same email, same provider — link the Google ID
          user = await db.user.update({
            where: { id: existingByEmail.id },
            data: { googleId: userGoogleId, lastLogin: new Date(), ...(userAvatar ? { avatar: userAvatar } : {}) },
          });
        } else {
          return NextResponse.json({
            error: 'An account with this email already exists. Please sign in with your password.',
            code: 'ACCOUNT_EXISTS',
          }, { status: 409 });
        }
      } else {
        // Create new user from Google
        isNewUser = true;
        user = await db.user.create({
          data: {
            email: normalizedEmail,
            name: userName,
            password: '',
            role: 'STUDENT',
            authProvider: 'GOOGLE',
            googleId: userGoogleId,
            avatar: userAvatar || `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(userName)}&backgroundColor=059669`,
            lastLogin: new Date(),
          },
        });
      }
    }

    // Generate JWT
    let token: string;
    try {
      const { signToken } = await import('@/lib/jwt');
      token = signToken({
        userId: user.id,
        email: user.email,
        role: user.role,
        name: user.name,
      });
    } catch {
      // Emergency fallback — should never happen with proper JWT_SECRET
      const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
      const payload = btoa(JSON.stringify({
        userId: user.id, email: user.email, role: user.role, name: user.name,
        iat: Math.floor(Date.now() / 1000), exp: Math.floor(Date.now() / 1000) + 86400 * 7,
      }));
      let sig = 0;
      const secret = process.env.JWT_SECRET || 'pu-alrms-secret-2024';
      const combined = header + '.' + payload + '.' + secret;
      for (let i = 0; i < combined.length; i++) sig = ((sig << 5) - sig + combined.charCodeAt(i)) | 0;
      token = header + '.' + payload + '.' + btoa(String(Math.abs(sig)));
    }

    const now = new Date().toISOString();
    return NextResponse.json({
      token,
      isNewUser,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        verified: user.verified,
        status: user.status || 'ACTIVE',
        avatar: user.avatar || null,
        coverPhoto: user.coverPhoto || null,
        rollNumber: user.rollNumber || null,
        batch: user.batch || null,
        department: user.department || null,
        phone: user.phone || null,
        bio: user.bio || null,
        authProvider: user.authProvider,
        lastLogin: now,
        createdAt: user.createdAt ? new Date(user.createdAt).toISOString() : now,
        updatedAt: user.updatedAt ? new Date(user.updatedAt).toISOString() : now,
      },
    });
  } catch (error) {
    console.error('[Google Auth] Error:', error instanceof Error ? error.message : error);
    return NextResponse.json({ error: 'Google login failed. Please try again.' }, { status: 500 });
  }
}
