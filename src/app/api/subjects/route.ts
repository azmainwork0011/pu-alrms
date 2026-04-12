import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyToken } from '@/lib/jwt';

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const payload = verifyToken(token);
    if (!payload) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });

    const subjects = await db.subject.findMany({
      include: {
        teacher: {
          select: { id: true, name: true, email: true },
        },
        _count: {
          select: { assignments: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json(subjects);
  } catch (error) {
    console.error('Get subjects error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
