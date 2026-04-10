import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/quiz/leaderboard?department=xxx&limit=50 — Global quiz leaderboard
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const department = searchParams.get('department');
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    // Get best attempt per user
    const bestAttempts = await db.quizAttempt.groupBy({
      by: ['userId'],
      where: department ? {
        category: { department },
      } : {},
      _max: { score: true, accuracy: true },
      _min: { timeTaken: true },
      _count: { id: true },
      orderBy: { _max: { score: 'desc' } },
      take: limit,
    });

    // Get user details for each
    const leaderboard = [];
    for (const attempt of bestAttempts) {
      const user = await db.user.findUnique({
        where: { id: attempt.userId },
        select: { id: true, name: true, avatar: true, batch: true, department: true, role: true },
      });
      if (user) {
        leaderboard.push({
          userId: user.id,
          name: user.name,
          avatar: user.avatar,
          batch: user.batch,
          department: user.department,
          role: user.role,
          bestScore: attempt._max.score || 0,
          bestAccuracy: attempt._max.accuracy || 0,
          fastestTime: attempt._min.timeTaken || 0,
          totalQuizzes: attempt._count.id,
        });
      }
    }

    // Sort by score desc, then accuracy desc, then time asc
    leaderboard.sort((a, b) => {
      if (b.bestScore !== a.bestScore) return b.bestScore - a.bestScore;
      if (b.bestAccuracy !== a.bestAccuracy) return b.bestAccuracy - a.bestAccuracy;
      return a.fastestTime - b.fastestTime;
    });

    return NextResponse.json({ leaderboard });
  } catch (error) {
    console.error('Quiz leaderboard error:', error);
    return NextResponse.json({ error: 'Failed to load leaderboard' }, { status: 500 });
  }
}
