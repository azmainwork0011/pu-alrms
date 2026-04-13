import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyToken } from '@/lib/jwt';

// GET /api/cq/friends — Get friend list
export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const payload = verifyToken(token);
    if (!payload) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });

    const friends = await db.cQFriend.findMany({
      where: {
        OR: [
          { userId: payload.userId, status: 'ACCEPTED' },
          { friendId: payload.userId, status: 'ACCEPTED' },
        ],
      },
      include: {
        user: { select: { id: true, name: true, avatar: true } },
        friend: { select: { id: true, name: true, avatar: true } },
      },
    });

    const pending = await db.cQFriend.findMany({
      where: {
        friendId: payload.userId,
        status: 'PENDING',
      },
      include: {
        user: { select: { id: true, name: true, avatar: true } },
      },
    });

    const friendList = friends.map(f => {
      const isRequester = f.userId === payload.userId;
      return {
        id: f.id,
        userId: isRequester ? f.friendId : f.userId,
        name: isRequester ? f.friend.name : f.user.name,
        avatar: isRequester ? f.friend.avatar : f.user.avatar,
        online: Math.random() > 0.5, // Simulated
      };
    });

    const pendingRequests = pending.map(f => ({
      id: f.id,
      userId: f.userId,
      name: f.user.name,
      avatar: f.user.avatar,
    }));

    return NextResponse.json({ friends: friendList, pending: pendingRequests });
  } catch (error) {
    console.error('CQ friends GET error:', error);
    return NextResponse.json({ error: 'Failed to load friends' }, { status: 500 });
  }
}

// POST /api/cq/friends — Add friend / Accept request
// Body: { friendId, action?: 'send' | 'accept' | 'remove' }
export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const payload = verifyToken(token);
    if (!payload) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });

    const body = await req.json();
    const { friendId, action = 'send' } = body;

    if (!friendId || friendId === payload.userId) {
      return NextResponse.json({ error: 'Invalid friend ID' }, { status: 400 });
    }

    if (action === 'remove') {
      await db.cQFriend.deleteMany({
        where: {
          OR: [
            { userId: payload.userId, friendId },
            { userId: friendId, friendId: payload.userId },
          ],
        },
      });
      return NextResponse.json({ success: true, action: 'removed' });
    }

    if (action === 'accept') {
      const request = await db.cQFriend.findFirst({
        where: { userId: friendId, friendId: payload.userId, status: 'PENDING' },
      });
      if (!request) return NextResponse.json({ error: 'No pending request' }, { status: 404 });

      await db.cQFriend.update({
        where: { id: request.id },
        data: { status: 'ACCEPTED' },
      });
      return NextResponse.json({ success: true, action: 'accepted' });
    }

    // Send friend request
    const existing = await db.cQFriend.findFirst({
      where: {
        OR: [
          { userId: payload.userId, friendId },
          { userId: friendId, friendId: payload.userId },
        ],
      },
    });

    if (existing) {
      return NextResponse.json({ error: 'Friend request already exists' }, { status: 400 });
    }

    const friend = await db.cQFriend.create({
      data: { userId: payload.userId, friendId, status: 'PENDING' },
    });

    return NextResponse.json({ success: true, action: 'sent', friendId: friend.id });
  } catch (error) {
    console.error('CQ friends POST error:', error);
    return NextResponse.json({ error: 'Failed to process friend request' }, { status: 500 });
  }
}
