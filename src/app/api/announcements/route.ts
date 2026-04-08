import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyToken } from '@/lib/jwt';

function getTokenPayload(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  const token = authHeader?.replace('Bearer ', '');
  if (!token) return null;
  return verifyToken(token);
}

// GET /api/announcements - List all announcements (newest first)
export async function GET(req: NextRequest) {
  try {
    const payload = getTokenPayload(req);
    if (!payload) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Build the where clause based on user role
    let whereClause: Record<string, unknown> = {};
    if (payload.role === 'STUDENT' || payload.role === 'CR') {
      // Students and CRs can see their own + published (all) announcements
      // All announcements are "published" since there's no draft status
      // They can see all announcements
    }

    const announcements = await db.announcement.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      skip: offset,
      take: limit,
      include: {
        creator: {
          select: { id: true, name: true, role: true },
        },
      },
    });

    return NextResponse.json(announcements);
  } catch (error) {
    console.error('Get announcements error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/announcements - Create announcement (TEACHER, ADMIN only)
export async function POST(req: NextRequest) {
  try {
    const payload = getTokenPayload(req);
    if (!payload) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    if (payload.role !== 'TEACHER' && payload.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Only teachers or admins can create announcements' }, { status: 403 });
    }

    const body = await req.json();
    const { title, message, type, priority } = body;

    if (!title || !message) {
      return NextResponse.json({ error: 'Title and message are required' }, { status: 400 });
    }

    const validTypes = ['GENERAL', 'URGENT', 'ASSIGNMENT', 'EXAM', 'RESULT'];
    const validPriorities = ['NORMAL', 'HIGH', 'CRITICAL'];

    if (type && !validTypes.includes(type)) {
      return NextResponse.json({ error: 'Invalid type. Must be GENERAL, URGENT, ASSIGNMENT, EXAM, or RESULT' }, { status: 400 });
    }

    if (priority && !validPriorities.includes(priority)) {
      return NextResponse.json({ error: 'Invalid priority. Must be NORMAL, HIGH, or CRITICAL' }, { status: 400 });
    }

    const announcement = await db.announcement.create({
      data: {
        title,
        message,
        type: type || 'GENERAL',
        priority: priority || 'NORMAL',
        createdBy: payload.userId,
      },
      include: {
        creator: {
          select: { id: true, name: true, role: true },
        },
      },
    });

    // Create notification for ALL students
    const students = await db.user.findMany({
      where: {
        role: { in: ['STUDENT', 'CR'] },
      },
      select: { id: true },
    });

    if (students.length > 0) {
      await db.notification.createMany({
        data: students.map((student) => ({
          userId: student.id,
          title: `New Announcement: ${announcement.title}`,
          message: announcement.message.length > 100
            ? announcement.message.substring(0, 100) + '...'
            : announcement.message,
          type: 'ANNOUNCEMENT',
        })),
      });
    }

    return NextResponse.json(announcement, { status: 201 });
  } catch (error) {
    console.error('Create announcement error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
