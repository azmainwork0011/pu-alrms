import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/jwt';
import { db } from '@/lib/db';

// ═══════════════════════════════════════════════════════════
// GET — Lucky Strick usage analytics
// ═══════════════════════════════════════════════════════════
export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    const payload = verifyToken(token);
    if (!payload) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });

    // Total messages & tokens
    const totalMessages = await db.luckyStrickChat.count({
      where: { userId: payload.userId },
    });

    const tokenAgg = await db.luckyStrickChat.aggregate({
      where: { userId: payload.userId },
      _sum: { tokenCount: true },
    });

    // Subject distribution
    const subjectStats = await db.luckyStrickChat.groupBy({
      by: ['subject'],
      where: { userId: payload.userId },
      _count: { id: true },
      _sum: { tokenCount: true },
    });

    // Session count
    const sessions = await db.luckyStrickChat.groupBy({
      by: ['sessionId'],
      where: { userId: payload.userId },
    });

    // Daily activity (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentMessages = await db.luckyStrickChat.findMany({
      where: {
        userId: payload.userId,
        createdAt: { gte: sevenDaysAgo },
      },
      select: { createdAt: true, subject: true, role: true },
    });

    // Group by day
    const dailyActivity: Record<string, number> = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split('T')[0];
      dailyActivity[key] = 0;
    }
    for (const msg of recentMessages) {
      const key = msg.createdAt.toISOString().split('T')[0];
      if (key in dailyActivity) dailyActivity[key]++;
    }

    // Top queries (user messages, most recent 20)
    const topQueries = await db.luckyStrickChat.findMany({
      where: { userId: payload.userId, role: 'user' },
      orderBy: { createdAt: 'desc' },
      take: 20,
      select: { content: true, subject: true, createdAt: true },
    });

    return NextResponse.json({
      totalMessages,
      totalTokens: tokenAgg._sum.tokenCount || 0,
      totalSessions: sessions.length,
      subjectStats: subjectStats.map(s => ({
        subject: s.subject,
        count: s._count.id,
        tokens: s._sum.tokenCount || 0,
      })),
      dailyActivity,
      recentQueries: topQueries.map(q => ({
        preview: q.content.slice(0, 80),
        subject: q.subject,
        date: q.createdAt,
      })),
    });
  } catch (error: any) {
    console.error('[Lucky Strick Stats] Error:', error?.message);
    return NextResponse.json({ error: 'Failed to load stats' }, { status: 500 });
  }
}
