import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyToken } from '@/lib/jwt';

// GET /api/cq/leaderboard — Get global leaderboard
export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const payload = verifyToken(token);
    if (!payload) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });

    const profiles = await db.cQProfile.findMany({
      orderBy: { totalXP: 'desc' },
      take: 50,
      include: {
        user: {
          select: { id: true, name: true, avatar: true },
        },
      },
    });

    const leaderboard = profiles.map((p, index) => ({
      rank: index + 1,
      userId: p.user.id,
      name: p.user.name,
      avatar: p.avatar || p.user.avatar,
      level: p.level,
      xp: p.totalXP,
      battlesWon: p.battlesWon,
      totalBattles: p.totalBattles,
      accuracy: p.questionsAnswered > 0 ? Math.round((p.correctAnswers / p.questionsAnswered) * 100) : 0,
      isCurrentUser: p.userId === payload.userId,
    }));

    // Find current user rank if not in top 50
    const currentUserRank = profiles.findIndex(p => p.userId === payload.userId);
    const currentUserProfile = currentUserRank === -1
      ? await db.cQProfile.findUnique({
          where: { userId: payload.userId },
          include: { user: { select: { id: true, name: true, avatar: true } } },
        })
      : null;

    let userRank = currentUserRank + 1;
    if (userRank === 0 && currentUserProfile) {
      const count = await db.cQProfile.count({ where: { totalXP: { gt: currentUserProfile.totalXP } } });
      userRank = count + 1;
    }

    return NextResponse.json({
      leaderboard,
      currentUserRank: userRank || null,
    });
  } catch (error) {
    console.error('CQ leaderboard GET error:', error);
    return NextResponse.json({ error: 'Failed to load leaderboard' }, { status: 500 });
  }
}
