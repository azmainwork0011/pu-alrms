import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyToken } from '@/lib/jwt';
import { unlink, readdir } from 'fs/promises';
import path from 'path';

export async function DELETE(req: NextRequest) {
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

    const body = await req.json();
    const { type } = body;

    if (!type || !['avatar', 'cover'].includes(type)) {
      return NextResponse.json({ error: 'Type must be "avatar" or "cover"' }, { status: 400 });
    }

    // Fetch current user to get the file path
    const user = await db.user.findUnique({
      where: { id: payload.userId },
      select: { avatar: true, coverPhoto: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Try to delete the physical file
    const photoUrl = type === 'avatar' ? user.avatar : user.coverPhoto;
    if (photoUrl) {
      try {
        const filePath = path.join(process.cwd(), 'public', photoUrl);
        await unlink(filePath);
      } catch {
        // File might not exist, that's okay
      }
    }

    // Update database: set the field to null
    const updateData = type === 'avatar' ? { avatar: null } : { coverPhoto: null };
    const updated = await db.user.update({
      where: { id: payload.userId },
      data: updateData,
      select: {
        id: true, name: true, email: true, role: true,
        avatar: true, coverPhoto: true, rollNumber: true,
        batch: true, department: true, phone: true, bio: true,
        createdAt: true, updatedAt: true,
      },
    });

    return NextResponse.json({ success: true, user: updated });
  } catch (error) {
    console.error('Photo delete error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
