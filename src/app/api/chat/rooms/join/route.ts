import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyToken } from '@/lib/jwt';
import bcrypt from 'bcryptjs';

/**
 * POST /api/chat/rooms/join — Verify room access (RBAC + password)
 * Returns encryption key if user has valid access
 */
export async function POST(req: NextRequest) {
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

    const user = await db.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, role: true, batch: true, department: true, name: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const body = await req.json();
    const { roomId, password } = body;

    if (!roomId) {
      return NextResponse.json({ error: 'Room ID is required' }, { status: 400 });
    }

    const room = await db.chatRoom.findUnique({ where: { id: roomId } });

    if (!room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }

    // Check room status — LOCKED rooms only accessible by ADMIN/TEACHER
    if (room.status === 'LOCKED' && user.role !== 'ADMIN' && user.role !== 'TEACHER') {
      return NextResponse.json({ error: 'This room is currently locked' }, { status: 403 });
    }

    if (room.status === 'ARCHIVED') {
      return NextResponse.json({ error: 'This room has been archived' }, { status: 403 });
    }

    // RBAC check
    const canAccess =
      user.role === 'ADMIN' ||
      user.role === 'TEACHER' ||
      room.type === 'GENERAL' ||
      (room.type === 'BATCH' && room.batch && user.batch === room.batch) ||
      (room.type === 'DEPARTMENT' && room.department && user.department === room.department);

    if (!canAccess) {
      return NextResponse.json({ error: 'Access denied. You do not have permission to join this room.' }, { status: 403 });
    }

    // Password check — if room has a password, verify it
    if (room.roomPassword) {
      if (!password) {
        return NextResponse.json({
          requiresPassword: true,
          roomId: room.id,
          roomName: room.name,
          error: 'This room requires a password to join',
        }, { status: 403 });
      }

      const isMatch = await bcrypt.compare(password, room.roomPassword);
      if (!isMatch) {
        return NextResponse.json({
          requiresPassword: true,
          roomId: room.id,
          roomName: room.name,
          error: 'Incorrect room password',
        }, { status: 403 });
      }
    }

    // Success — return room info with encryption key
    return NextResponse.json({
      success: true,
      room: {
        id: room.id,
        name: room.name,
        type: room.type,
        batch: room.batch,
        department: room.department,
        status: room.status,
        maxMembers: room.maxMembers,
        allowFiles: room.allowFiles,
        description: room.description,
        hasPassword: !!room.roomPassword,
        encryptionKey: room.encryptionKey,
      },
    });
  } catch (error) {
    console.error('Join room API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
