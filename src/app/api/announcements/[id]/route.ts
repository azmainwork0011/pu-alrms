import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyToken } from '@/lib/jwt';

function getTokenPayload(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  const token = authHeader?.replace('Bearer ', '');
  if (!token) return null;
  return verifyToken(token);
}

// GET /api/announcements/[id] - Get single announcement
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const payload = getTokenPayload(req);
    if (!payload) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { id } = await params;

    const announcement = await db.announcement.findUnique({
      where: { id },
      include: {
        creator: {
          select: { id: true, name: true, role: true },
        },
      },
    });

    if (!announcement) {
      return NextResponse.json({ error: 'Announcement not found' }, { status: 404 });
    }

    return NextResponse.json(announcement);
  } catch (error) {
    console.error('Get announcement error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/announcements/[id] - Update announcement (TEACHER, ADMIN, CR only)
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const payload = getTokenPayload(req);
    if (!payload) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    if (payload.role !== 'TEACHER' && payload.role !== 'ADMIN' && payload.role !== 'CR') {
      return NextResponse.json({ error: 'Only teachers, admins, or CRs can update announcements' }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();
    const { title, message, type, priority } = body;

    // Check if announcement exists
    const existing = await db.announcement.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Announcement not found' }, { status: 404 });
    }

    // Teachers can only update their own announcements; admins and CRs can update any
    if (payload.role === 'TEACHER' && existing.createdBy !== payload.userId) {
      return NextResponse.json({ error: 'You can only update your own announcements' }, { status: 403 });
    }

    const validTypes = ['GENERAL', 'URGENT', 'ASSIGNMENT', 'EXAM', 'RESULT'];
    const validPriorities = ['NORMAL', 'HIGH', 'CRITICAL'];

    if (type && !validTypes.includes(type)) {
      return NextResponse.json({ error: 'Invalid type. Must be GENERAL, URGENT, ASSIGNMENT, EXAM, or RESULT' }, { status: 400 });
    }

    if (priority && !validPriorities.includes(priority)) {
      return NextResponse.json({ error: 'Invalid priority. Must be NORMAL, HIGH, or CRITICAL' }, { status: 400 });
    }

    const updateData: Record<string, unknown> = {};
    if (title !== undefined) updateData.title = title;
    if (message !== undefined) updateData.message = message;
    if (type !== undefined) updateData.type = type;
    if (priority !== undefined) updateData.priority = priority;

    const announcement = await db.announcement.update({
      where: { id },
      data: updateData,
      include: {
        creator: {
          select: { id: true, name: true, role: true },
        },
      },
    });

    return NextResponse.json(announcement);
  } catch (error) {
    console.error('Update announcement error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/announcements/[id] - Delete announcement (TEACHER, ADMIN only)
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const payload = getTokenPayload(req);
    if (!payload) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    if (payload.role !== 'TEACHER' && payload.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Only teachers or admins can delete announcements' }, { status: 403 });
    }

    const { id } = await params;

    // Check if announcement exists
    const existing = await db.announcement.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Announcement not found' }, { status: 404 });
    }

    // Teachers can only delete their own announcements
    if (payload.role === 'TEACHER' && existing.createdBy !== payload.userId) {
      return NextResponse.json({ error: 'You can only delete your own announcements' }, { status: 403 });
    }

    await db.announcement.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Announcement deleted successfully' });
  } catch (error) {
    console.error('Delete announcement error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
