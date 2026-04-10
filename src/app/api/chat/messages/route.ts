import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyToken } from '@/lib/jwt';

/**
 * GET /api/chat/messages?roomId=xxx&limit=50&offset=0
 * Fetch message history for a room (with decryption via encryption key)
 */
export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const roomId = searchParams.get('roomId');
    const limit = Math.min(Number(searchParams.get('limit') || '50'), 200);
    const offset = Number(searchParams.get('offset') || '0');

    if (!roomId) {
      return NextResponse.json({ error: 'roomId is required' }, { status: 400 });
    }

    // Verify user can access this room
    const room = await db.chatRoom.findUnique({ where: { id: roomId } });
    if (!room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }

    const user = await db.user.findUnique({
      where: { id: payload.userId },
      select: { role: true, batch: true, department: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // RBAC check
    const canAccess =
      user.role === 'ADMIN' ||
      user.role === 'TEACHER' ||
      room.type === 'GENERAL' ||
      (room.type === 'BATCH' && room.batch === user.batch) ||
      (room.type === 'DEPARTMENT' && room.department === user.department);

    if (!canAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const messages = await db.chatMessage.findMany({
      where: { roomId },
      take: limit,
      skip: offset,
      orderBy: { createdAt: 'asc' },
      include: {
        user: {
          select: { id: true, name: true, role: true, avatar: true },
        },
      },
    });

    return NextResponse.json({
      messages: messages.map((m) => ({
        id: m.id,
        roomId: m.roomId,
        userId: m.userId,
        username: m.user?.name || 'System',
        content: m.content,
        messageType: m.messageType,
        fileUrl: m.fileUrl,
        fileName: m.fileName,
        timestamp: m.createdAt.toISOString(),
        role: m.user?.role || undefined,
        type: m.messageType === 'SYSTEM' ? 'system' : 'user',
        encrypted: !!m.encryptedContent,
      })),
      hasMore: messages.length === limit,
    });
  } catch (error) {
    console.error('Chat messages API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
