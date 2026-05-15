import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyToken } from '@/lib/jwt';

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

    // Update database: set the field to null (photos stored as base64 in DB)
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
