import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { signToken } from '@/lib/jwt';
import { hash } from 'bcryptjs';
import crypto from 'crypto';

/**
 * Temp email login:
 * - Generates a random temporary email
 * - Creates a new account (or logs into existing if email is taken)
 * - Returns JWT + user
 * - No password required
 */
export async function POST(req: NextRequest) {
  try {
    const { name } = await req.json();

    // Generate temp email
    const randomId = crypto.randomBytes(4).toString('hex');
    const timestamp = Date.now().toString(36);
    const tempEmail = `temp.${randomId}${timestamp}@student.pu.edu`;

    // Generate display name
    const displayName = name || `Student-${randomId.toUpperCase()}`;

    // Check if this exact email somehow exists (very unlikely)
    const existingUser = await db.user.findUnique({ where: { email: tempEmail } });

    if (existingUser) {
      const token = signToken({
        userId: existingUser.id,
        email: existingUser.email,
        role: existingUser.role,
        name: existingUser.name,
      });
      const { password: _, ...userWithoutPassword } = existingUser;
      return NextResponse.json({ token, user: userWithoutPassword, tempEmail });
    }

    // Create new temp account
    const randomPassword = crypto.randomBytes(32).toString('hex');
    const hashedPassword = await hash(randomPassword, 12);

    const user = await db.user.create({
      data: {
        name: displayName,
        email: tempEmail,
        password: hashedPassword,
        role: 'STUDENT',
        avatar: `https://api.dicebear.com/9.x/identicon/svg?seed=${randomId}&backgroundColor=059669`,
        batch: null,
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
      tempEmail,
    });
  } catch (error) {
    console.error('Temp email auth error:', error);
    return NextResponse.json({ error: 'Temp login failed' }, { status: 500 });
  }
}
