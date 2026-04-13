import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyToken } from '@/lib/jwt';

// POST /api/cq/battle — Save battle result
// Body: { language, player1HP, player2HP, player1Score, player2Score, totalRounds, won }
export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const payload = verifyToken(token);
    if (!payload) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });

    const body = await req.json();
    const { language, player1HP, player2HP, player1Score, player2Score, totalRounds, won } = body;

    // Create battle session
    const session = await db.cQBattleSession.create({
      data: {
        player1Id: payload.userId,
        language: language || null,
        status: 'COMPLETED',
        totalRounds: totalRounds || 10,
        timePerRound: 12,
        player1HP: player1HP ?? 0,
        player2HP: player2HP ?? 0,
        player1Score: player1Score ?? 0,
        player2Score: player2Score ?? 0,
        currentRound: totalRounds || 10,
        winnerId: won ? payload.userId : null,
        completedAt: new Date(),
      },
    });

    // Update profile
    const existing = await db.cQProfile.findUnique({ where: { userId: payload.userId } });
    const xpGained = won ? 50 + (player1Score || 0) : 10 + (player1Score || 0);

    if (existing) {
      await db.cQProfile.update({
        where: { userId: payload.userId },
        data: {
          totalXP: existing.totalXP + xpGained,
          battlesWon: existing.battlesWon + (won ? 1 : 0),
          battlesLost: existing.battlesLost + (won ? 0 : 1),
          totalBattles: existing.totalBattles + 1,
          lastActiveDate: new Date().toISOString().split('T')[0],
        },
      });
    } else {
      await db.cQProfile.create({
        data: {
          userId: payload.userId,
          totalXP: xpGained,
          battlesWon: won ? 1 : 0,
          battlesLost: won ? 0 : 1,
          totalBattles: 1,
          lastActiveDate: new Date().toISOString().split('T')[0],
        },
      });
    }

    return NextResponse.json({
      session,
      xpGained,
      result: won ? 'VICTORY' : 'DEFEAT',
    });
  } catch (error) {
    console.error('CQ battle POST error:', error);
    return NextResponse.json({ error: 'Failed to save battle' }, { status: 500 });
  }
}

// GET /api/cq/battle — Get battle history
export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const payload = verifyToken(token);
    if (!payload) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });

    const sessions = await db.cQBattleSession.findMany({
      where: { player1Id: payload.userId },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    return NextResponse.json({ sessions });
  } catch (error) {
    console.error('CQ battle GET error:', error);
    return NextResponse.json({ error: 'Failed to load battles' }, { status: 500 });
  }
}
