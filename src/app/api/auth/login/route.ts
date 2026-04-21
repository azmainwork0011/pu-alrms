import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { signToken } from '@/lib/jwt';
import { compare } from 'bcryptjs';

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    const user = await db.user.findUnique({ where: { email: email.trim().toLowerCase() } });

    if (!user) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    // Check account status
    if (user.status === 'BANNED') {
      return NextResponse.json({ error: 'This account has been permanently banned.' }, { status: 403 });
    }
    if (user.status === 'SUSPENDED') {
      return NextResponse.json({ error: 'This account has been suspended. Contact an administrator.' }, { status: 403 });
    }

    let isValid = false;
    try {
      isValid = await compare(password, user.password);
    } catch {
      // bcrypt compare failed (corrupted hash?) — return generic auth error
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    if (!isValid) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    const token = signToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    });

    // Update last login
    await db.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    });

    const { password: _, ...userWithoutPassword } = user;

    return NextResponse.json({ token, user: userWithoutPassword });
  } catch (error) {
    // Log for debugging but never expose internal details to client
    console.error('[Login] Error:', error instanceof Error ? error.message : error);
    return NextResponse.json({ error: 'Login failed. Please try again.' }, { status: 500 });
  }
}
