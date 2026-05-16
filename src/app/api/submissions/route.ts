import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyToken } from '@/lib/jwt';

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
    const assignmentId = searchParams.get('assignmentId');
    const studentId = searchParams.get('studentId');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');

    const where: Record<string, unknown> = {};

    if (payload.role === 'STUDENT') {
      where.studentId = payload.userId;
    }

    if (assignmentId) where.assignmentId = assignmentId;
    if (studentId && (payload.role === 'TEACHER' || payload.role === 'ADMIN')) {
      where.studentId = studentId;
    }

    const [submissions, total] = await Promise.all([
      db.submission.findMany({
        where,
        include: {
          assignment: {
            include: {
              subject: {
                select: { id: true, name: true, code: true },
              },
            },
          },
          student: {
            select: { id: true, name: true, email: true, avatar: true },
          },
        },
        orderBy: { submittedAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      db.submission.count({ where }),
    ]);

    return NextResponse.json({ submissions, total });
  } catch (error) {
    console.error('Get submissions error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const payload = getTokenPayload(req);
    if (!payload) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    if (payload.role !== 'STUDENT') {
      return NextResponse.json({ error: 'Only students can submit assignments' }, { status: 403 });
    }

    const { assignmentId, fileName, fileUrl } = await req.json();

    if (!assignmentId || !fileName) {
      return NextResponse.json({ error: 'Assignment ID and file name are required' }, { status: 400 });
    }

    const assignment = await db.assignment.findUnique({
      where: { id: assignmentId },
    });

    if (!assignment) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 });
    }

    if (assignment.status !== 'ACTIVE') {
      return NextResponse.json({ error: 'Assignment is no longer accepting submissions' }, { status: 400 });
    }

    const existingSubmission = await db.submission.findFirst({
      where: {
        assignmentId,
        studentId: payload.userId,
      },
    });

    if (existingSubmission) {
      return NextResponse.json({ error: 'You have already submitted this assignment' }, { status: 409 });
    }

    const isLate = new Date() > new Date(assignment.deadline);

    const submission = await db.submission.create({
      data: {
        assignmentId,
        studentId: payload.userId,
        fileName,
        fileUrl: fileUrl || null,
        status: isLate ? 'LATE' : 'SUBMITTED',
      },
      include: {
        assignment: {
          include: {
            subject: {
              select: { id: true, name: true, code: true },
            },
          },
        },
        student: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    await db.notification.create({
      data: {
        userId: assignment.createdBy,
        title: 'New Submission',
        message: `${payload.name} submitted "${fileName}" for ${assignment.title}${isLate ? ' (LATE)' : ''}`,
        type: 'ASSIGNMENT',
      },
    });

    return NextResponse.json({ submission }, { status: 201 });
  } catch (error) {
    console.error('Create submission error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
