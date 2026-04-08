import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { signToken } from '@/lib/jwt';
import { hash } from 'bcryptjs';
import crypto from 'crypto';

/**
 * Google-style OAuth flow:
 * - Accepts { name, email, avatar, role } from client
 * - If user exists, logs them in
 * - If not, creates a new account with Google OAuth marker
 * - Returns JWT + user
 */
export async function POST(req: NextRequest) {
  try {
    const { name, email, avatar, role } = await req.json();

    if (!name || !email) {
      return NextResponse.json({ error: 'Name and email are required' }, { status: 400 });
    }

    // Basic email validation
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
    }

    // Check if user already exists
    const existingUser = await db.user.findUnique({ where: { email } });

    if (existingUser) {
      // Login existing user
      const token = signToken({
        userId: existingUser.id,
        email: existingUser.email,
        role: existingUser.role,
        name: existingUser.name,
      });

      const { password: _, ...userWithoutPassword } = existingUser;
      return NextResponse.json({
        token,
        user: userWithoutPassword,
        isExisting: true,
      });
    }

    // Create new account
    // Use a random secure password since they're signing in via Google
    const randomPassword = crypto.randomBytes(32).toString('hex');
    const hashedPassword = await hash(randomPassword, 12);

    let userRole = 'STUDENT';
    if (role === 'TEACHER') userRole = 'TEACHER';

    const user = await db.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: userRole,
        avatar: avatar || `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(name)}&backgroundColor=059669`,
      },
    });

    const token = signToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    });

    const { password: _, ...userWithoutPassword } = user;

    return NextResponse.json({
      token,
      user: userWithoutPassword,
      isExisting: false,
    });
  } catch (error) {
    console.error('Google auth error:', error);
    return NextResponse.json({ error: 'Authentication failed' }, { status: 500 });
  }
}
