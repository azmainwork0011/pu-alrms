import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyToken } from '@/lib/jwt';
import bcrypt from 'bcryptjs';

/**
 * GET /api/chat/rooms — List all rooms the authenticated user can access
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

    const user = await db.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, role: true, batch: true, department: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const rooms = await db.chatRoom.findMany({
      orderBy: { lastActivity: 'desc' },
      include: {
        _count: {
          select: { messages: true },
        },
      },
    });

    // Filter rooms by RBAC
    const accessible = rooms.filter((room) => {
      if (user.role === 'ADMIN' || user.role === 'TEACHER') return true;
      if (room.status === 'LOCKED' || room.status === 'ARCHIVED') return false;
      if (room.type === 'GENERAL') return true;
      if (room.type === 'BATCH' && room.batch) return user.batch === room.batch;
      if (room.type === 'DEPARTMENT' && room.department) return user.department === room.department;
      return false;
    });

    return NextResponse.json({
      rooms: accessible.map((r) => ({
        id: r.id,
        name: r.name,
        type: r.type,
        batch: r.batch,
        department: r.department,
        isPrivate: r.isPrivate,
        status: r.status,
        maxMembers: r.maxMembers,
        allowFiles: r.allowFiles,
        description: r.description,
        hasPassword: !!r.roomPassword,
        lastActivity: r.lastActivity.toISOString(),
        messageCount: r._count.messages,
        // Only send encryption key for rooms user has accessed
        encryptionKey: (r.type === 'GENERAL') ? r.encryptionKey : undefined,
      })),
    });
  } catch (error) {
    console.error('Chat rooms API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/chat/rooms — Create a new chat room (TEACHER/ADMIN only)
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
      select: { id: true, role: true },
    });

    if (!user || (user.role !== 'TEACHER' && user.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Only teachers and admins can create rooms' }, { status: 403 });
    }

    const body = await req.json();
    const {
      name,
      type = 'GENERAL',
      batch,
      department,
      roomPassword,
      description,
      maxMembers = 100,
      allowFiles = true,
    } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Room name is required' }, { status: 400 });
    }

    const roomId = type === 'BATCH' && batch
      ? `batch-${batch.toLowerCase().replace(/[^a-z0-9]/g, '-')}`
      : type === 'DEPARTMENT' && department
        ? `dept-${department.toLowerCase().replace(/[^a-z0-9]/g, '-')}`
        : `room-${Date.now().toString(36)}`;

    const existing = await db.chatRoom.findUnique({ where: { id: roomId } });
    if (existing) {
      return NextResponse.json({ error: 'Room already exists' }, { status: 409 });
    }

    // Generate AES-256 encryption key
    const { randomBytes } = await import('crypto');
    const encryptionKey = randomBytes(32).toString('hex');

    // Hash room password if provided (only ADMIN can set password)
    let hashedPassword: string | undefined;
    if (roomPassword) {
      if (user.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Only admins can set room passwords' }, { status: 403 });
      }
      hashedPassword = await bcrypt.hash(roomPassword, 12);
    }

    const room = await db.chatRoom.create({
      data: {
        id: roomId,
        name: name.trim(),
        type,
        batch: batch || undefined,
        department: department || undefined,
        encryptionKey,
        isPrivate: type !== 'GENERAL',
        roomPassword: hashedPassword,
        description: description || undefined,
        maxMembers,
        allowFiles,
        createdBy: user.id,
      },
    });

    return NextResponse.json({
      room: {
        id: room.id,
        name: room.name,
        type: room.type,
        batch: room.batch,
        department: room.department,
        isPrivate: room.isPrivate,
        status: room.status,
        maxMembers: room.maxMembers,
        allowFiles: room.allowFiles,
        description: room.description,
        hasPassword: !!room.roomPassword,
        encryptionKey: room.encryptionKey,
      },
    });
  } catch (error) {
    console.error('Create room API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * PUT /api/chat/rooms — Update a chat room (ADMIN/TEACHER only)
 */
export async function PUT(req: NextRequest) {
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
      select: { id: true, role: true },
    });

    if (!user || (user.role !== 'TEACHER' && user.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Only teachers and admins can update rooms' }, { status: 403 });
    }

    const body = await req.json();
    const {
      roomId,
      name,
      description,
      roomPassword,
      status,
      maxMembers,
      allowFiles,
    } = body;

    if (!roomId) {
      return NextResponse.json({ error: 'Room ID is required' }, { status: 400 });
    }

    const room = await db.chatRoom.findUnique({ where: { id: roomId } });
    if (!room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }

    // Build update data
    const updateData: Record<string, unknown> = {};

    if (name !== undefined) {
      if (!name.trim()) {
        return NextResponse.json({ error: 'Room name cannot be empty' }, { status: 400 });
      }
      updateData.name = name.trim();
    }

    if (description !== undefined) {
      updateData.description = description || null;
    }

    if (maxMembers !== undefined) {
      if (typeof maxMembers !== 'number' || maxMembers < 1 || maxMembers > 10000) {
        return NextResponse.json({ error: 'maxMembers must be between 1 and 10000' }, { status: 400 });
      }
      updateData.maxMembers = maxMembers;
    }

    if (allowFiles !== undefined) {
      updateData.allowFiles = Boolean(allowFiles);
    }

    // Only ADMIN can change status
    if (status !== undefined) {
      if (user.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Only admins can change room status' }, { status: 403 });
      }
      if (!['ACTIVE', 'LOCKED', 'ARCHIVED'].includes(status)) {
        return NextResponse.json({ error: 'Invalid status. Must be ACTIVE, LOCKED, or ARCHIVED' }, { status: 400 });
      }
      updateData.status = status;
    }

    // Only ADMIN can set/remove room password
    if (roomPassword !== undefined) {
      if (user.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Only admins can set room passwords' }, { status: 403 });
      }
      if (roomPassword === '' || roomPassword === null) {
        // Remove password
        updateData.roomPassword = null;
      } else {
        // Set new password (hash it)
        updateData.roomPassword = await bcrypt.hash(roomPassword, 12);
      }
    }

    const updatedRoom = await db.chatRoom.update({
      where: { id: roomId },
      data: updateData,
    });

    return NextResponse.json({
      room: {
        id: updatedRoom.id,
        name: updatedRoom.name,
        type: updatedRoom.type,
        batch: updatedRoom.batch,
        department: updatedRoom.department,
        isPrivate: updatedRoom.isPrivate,
        status: updatedRoom.status,
        maxMembers: updatedRoom.maxMembers,
        allowFiles: updatedRoom.allowFiles,
        description: updatedRoom.description,
        hasPassword: !!updatedRoom.roomPassword,
        lastActivity: updatedRoom.lastActivity.toISOString(),
      },
    });
  } catch (error) {
    console.error('Update room API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * DELETE /api/chat/rooms?roomId=xxx — Delete a chat room and all its messages (ADMIN only)
 */
export async function DELETE(req: NextRequest) {
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
      select: { id: true, role: true },
    });

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Only admins can delete rooms' }, { status: 403 });
    }

    const roomId = req.nextUrl.searchParams.get('roomId');
    if (!roomId) {
      return NextResponse.json({ error: 'Room ID is required' }, { status: 400 });
    }

    const room = await db.chatRoom.findUnique({
      where: { id: roomId },
      select: { id: true, name: true },
    });

    if (!room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }

    // Delete all messages in the room first
    await db.chatMessage.deleteMany({
      where: { roomId },
    });

    // Delete the room
    await db.chatRoom.delete({
      where: { id: roomId },
    });

    return NextResponse.json({
      success: true,
      message: `Room "${room.name}" and all its messages have been deleted`,
    });
  } catch (error) {
    console.error('Delete room API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
