import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyToken } from '@/lib/jwt';

// GET /api/quiz/attempts — Get quiz attempts for the authenticated user
// Query: ?category=<categoryId>
export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const payload = verifyToken(token);
    if (!payload) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const categoryId = searchParams.get('category');

    const where: Record<string, unknown> = { userId: payload.userId };
    if (categoryId) {
      where.categoryId = categoryId;
    }

    const attempts = await db.quizAttempt.findMany({
      where,
      include: {
        category: {
          select: { id: true, name: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return NextResponse.json({ attempts });
  } catch (error) {
    console.error('Quiz attempts GET error:', error);
    return NextResponse.json({ error: 'Failed to load attempts' }, { status: 500 });
  }
}
