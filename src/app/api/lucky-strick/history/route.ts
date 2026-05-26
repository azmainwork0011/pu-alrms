import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/jwt';
import { db } from '@/lib/db';

// ═══════════════════════════════════════════════════════════
// GET — Fetch chat sessions list for current user
// ═══════════════════════════════════════════════════════════
export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    const payload = verifyToken(token);
    if (!payload) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get('sessionId');
    const limit = parseInt(searchParams.get('limit') || '50');
    const subject = searchParams.get('subject');

    // If sessionId provided, return messages for that session
    if (sessionId) {
      const messages = await db.luckyStrickChat.findMany({
        where: { userId: payload.userId, sessionId },
        orderBy: { createdAt: 'asc' },
      });
      return NextResponse.json({ messages, sessionId });
    }

    // Otherwise, return session list with preview
    const whereClause: any = { userId: payload.userId };
    if (subject) whereClause.subject = subject;

    const allMessages = await db.luckyStrickChat.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      take: limit * 10, // Get more to aggregate
      select: {
        id: true,
        sessionId: true,
        role: true,
        content: true,
        subject: true,
        model: true,
        createdAt: true,
      },
    });

    // Group by sessionId
    const sessionMap = new Map<string, {
      sessionId: string;
      subject: string;
      preview: string;
      messageCount: number;
      lastMessageAt: string;
      totalTokens: number;
    }>();

    for (const msg of allMessages) {
      const existing = sessionMap.get(msg.sessionId);
      if (existing) {
        existing.messageCount++;
        if (!existing.preview && msg.role === 'user') {
          existing.preview = msg.content.slice(0, 100);
        }
        if (new Date(msg.createdAt) > new Date(existing.lastMessageAt)) {
          existing.lastMessageAt = new Date(msg.createdAt).toISOString();
        }
      } else {
        sessionMap.set(msg.sessionId, {
          sessionId: msg.sessionId,
          subject: msg.subject,
          preview: msg.role === 'user' ? msg.content.slice(0, 100) : '',
          messageCount: 1,
          lastMessageAt: new Date(msg.createdAt).toISOString(),
          totalTokens: 0,
        });
      }
    }

    // Sort sessions by last activity
    const sessions = [...sessionMap.values()]
      .sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime())
      .slice(0, limit);

    // Get subject distribution stats
    const subjectStats = await db.luckyStrickChat.groupBy({
      by: ['subject'],
      where: { userId: payload.userId },
      _count: { id: true },
      _sum: { tokenCount: true },
    });

    const totalMessages = await db.luckyStrickChat.count({
      where: { userId: payload.userId },
    });

    return NextResponse.json({
      sessions,
      subjectStats: subjectStats.map(s => ({
        subject: s.subject,
        count: s._count.id,
        tokens: s._sum.tokenCount || 0,
      })),
      totalMessages,
    });
  } catch (error: any) {
    console.error('[Lucky Strick History] Error:', error?.message);
    return NextResponse.json({ error: 'Failed to load history' }, { status: 500 });
  }
}

// ═══════════════════════════════════════════════════════════
// DELETE — Clear chat history
// ═══════════════════════════════════════════════════════════
export async function DELETE(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    const payload = verifyToken(token);
    if (!payload) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get('sessionId');

    if (sessionId) {
      // Delete specific session
      await db.luckyStrickChat.deleteMany({
        where: { userId: payload.userId, sessionId },
      });
      return NextResponse.json({ success: true, deleted: 'session' });
    }

    // Delete all history for user
    const result = await db.luckyStrickChat.deleteMany({
      where: { userId: payload.userId },
    });
    return NextResponse.json({ success: true, deleted: 'all', count: result.count });
  } catch (error: any) {
    console.error('[Lucky Strick History] Delete error:', error?.message);
    return NextResponse.json({ error: 'Failed to delete history' }, { status: 500 });
  }
}
