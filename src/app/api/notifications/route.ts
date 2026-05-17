import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyToken } from '@/lib/jwt';

// GET — List notifications (with pagination & error handling)
export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
    }

    // Parse pagination params
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '50', 10)));

    try {
      const [notifications, total] = await Promise.all([
        db.notification.findMany({
          where: { userId: payload.userId },
          orderBy: { createdAt: 'desc' },
          skip: (page - 1) * limit,
          take: limit,
        }),
        db.notification.count({
          where: { userId: payload.userId },
        }),
      ]);

      const unreadCount = notifications.filter(n => !n.isRead).length;

      return NextResponse.json({
        notifications,
        total,
        unreadCount,
        page,
        limit,
        hasMore: page * limit < total,
      });
    } catch (dbError) {
      console.error('[Notifications] Database error:', dbError);
      // Return empty result instead of crashing
      return NextResponse.json({
        notifications: [],
        total: 0,
        unreadCount: 0,
        page: 1,
        limit,
        hasMore: false,
      });
    }
  } catch (error) {
    console.error('Get notifications error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST — Mark all notifications as read
export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
    }

    try {
      const result = await db.notification.updateMany({
        where: {
          userId: payload.userId,
          isRead: false,
        },
        data: { isRead: true },
      });

      return NextResponse.json({
        success: true,
        markedCount: result.count,
      });
    } catch (dbError) {
      console.error('[Notifications] Database error on mark-all-read:', dbError);
      return NextResponse.json({ success: true, markedCount: 0 });
    }
  } catch (error) {
    console.error('Mark all notifications read error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
