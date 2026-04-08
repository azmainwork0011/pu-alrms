import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { signToken, verifyToken } from '@/lib/jwt';
import { hash } from 'bcryptjs';

export async function POST(req: NextRequest) {
  try {
    const { name, email, password, role } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Name, email, and password are required' }, { status: 400 });
    }

    // Check if user already exists
    const existingUser = await db.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 409 });
    }

    // Determine the role
    let userRole = 'STUDENT';

    if (role && role !== 'STUDENT') {
      // Only ADMIN can create TEACHER accounts
      if (role === 'TEACHER') {
        const authHeader = req.headers.get('authorization');
        const token = authHeader?.replace('Bearer ', '');

        if (!token) {
          return NextResponse.json({ error: 'Only admins can create teacher accounts' }, { status: 403 });
        }

        const payload = verifyToken(token);
        if (!payload || payload.role !== 'ADMIN') {
          return NextResponse.json({ error: 'Only admins can create teacher accounts' }, { status: 403 });
        }

        userRole = 'TEACHER';
      } else if (role === 'ADMIN') {
        return NextResponse.json({ error: 'Cannot create admin accounts directly' }, { status: 403 });
      }
    }

    const hashedPassword = await hash(password, 12);

    const user = await db.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: userRole,
      },
    });

    const jwtToken = signToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    });

    const { password: _, ...userWithoutPassword } = user;

    return NextResponse.json({ token: jwtToken, user: userWithoutPassword }, { status: 201 });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
