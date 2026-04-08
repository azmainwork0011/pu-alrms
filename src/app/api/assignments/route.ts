import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyToken, signToken } from '@/lib/jwt';

function getTokenPayload(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  const token = authHeader?.replace('Bearer ', '');
  if (!token) return null;
  return verifyToken(token);
}

export async function GET(req: NextRequest) {
  try {
    const payload = getTokenPayload(req);
    if (!payload) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type');
    const subjectId = searchParams.get('subjectId');
    const status = searchParams.get('status');

    const where: Record<string, unknown> = {};

    if (type) where.type = type;
    if (subjectId) where.subjectId = subjectId;
    if (status) where.status = status;

    // Role-based filtering
    if (payload.role === 'TEACHER') {
      where.createdBy = payload.userId;
    } else if (payload.role === 'STUDENT' || payload.role === 'CR') {
      where.status = status || 'ACTIVE';
      // Students with a batch should see: batch-specific assignments matching their batch,
      // plus assignments with no batch (open to all)
      const user = await db.user.findUnique({ where: { id: payload.userId }, select: { batch: true } });
      if (user?.batch) {
        where.OR = [
          { batch: user.batch },
          { batch: null },
        ];
      }
    }
    // ADMIN sees everything

    const assignments = await db.assignment.findMany({
      where,
      include: {
        subject: {
          include: {
            teacher: {
              select: { id: true, name: true, email: true },
            },
          },
        },
        creator: {
          select: { id: true, name: true, email: true },
        },
        _count: {
          select: { submissions: true, comments: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(assignments);
  } catch (error) {
    console.error('Get assignments error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const payload = getTokenPayload(req);
    if (!payload) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    if (!['TEACHER', 'ADMIN', 'CR'].includes(payload.role)) {
      return NextResponse.json({ error: 'Only teachers, CRs, and admins can create assignments' }, { status: 403 });
    }

    const { title, description, subjectId, type, deadline, fileUrl, batch } = await req.json();

    if (!title || !description || !subjectId || !type || !deadline) {
      return NextResponse.json(
        { error: 'Title, description, subjectId, type, and deadline are required' },
        { status: 400 }
      );
    }

    // Verify subject exists
    const subject = await db.subject.findUnique({ where: { id: subjectId } });
    if (!subject) {
      return NextResponse.json({ error: 'Subject not found' }, { status: 404 });
    }

    const assignment = await db.assignment.create({
      data: {
        title,
        description,
        subjectId,
        type,
        batch: batch || null,
        deadline: new Date(deadline),
        fileUrl: fileUrl || null,
        status: 'ACTIVE',
        createdBy: payload.userId,
      },
      include: {
        subject: true,
        creator: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    // Create notifications for relevant students
    // If batch is specified, only notify students in that batch; otherwise all
    const studentWhere: Record<string, unknown> = { role: 'STUDENT' };
    if (batch) {
      studentWhere.batch = batch;
    }

    const students = await db.user.findMany({
      where: studentWhere,
      select: { id: true },
    });

    if (students.length > 0) {
      const batchLabel = batch ? ` (Batch: ${batch})` : '';
      await db.notification.createMany({
        data: students.map((student) => ({
          userId: student.id,
          title: 'New Assignment',
          message: `A new ${type.toLowerCase()} "${title}" has been posted for ${subject.name}${batchLabel}. Deadline: ${new Date(deadline).toLocaleDateString()}`,
          type: 'ASSIGNMENT',
        })),
      });
    }

    return NextResponse.json({ assignment }, { status: 201 });
  } catch (error) {
    console.error('Create assignment error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
