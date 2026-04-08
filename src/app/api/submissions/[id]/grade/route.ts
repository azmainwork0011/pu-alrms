import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyToken } from '@/lib/jwt';

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    if (payload.role !== 'TEACHER') {
      return NextResponse.json({ error: 'Only teachers can grade submissions' }, { status: 403 });
    }

    const { id } = await params;
    const { marks, feedback } = await req.json();

    if (marks === undefined || marks === null) {
      return NextResponse.json({ error: 'Marks are required' }, { status: 400 });
    }

    // Check if submission exists
    const existing = await db.submission.findUnique({
      where: { id },
      include: {
        assignment: true,
      },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
    }

    // Verify teacher owns the assignment
    if (existing.assignment.createdBy !== payload.userId) {
      return NextResponse.json({ error: 'You can only grade submissions for your assignments' }, { status: 403 });
    }

    const submission = await db.submission.update({
      where: { id },
      data: {
        marks,
        feedback: feedback || null,
        status: 'GRADED',
        gradedAt: new Date(),
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

    // Create notification for the student about the grade
    await db.notification.create({
      data: {
        userId: existing.studentId,
        title: 'Grade Available',
        message: `Your submission for "${existing.assignment.title}" has been graded. Marks: ${marks}/100${feedback ? '. Feedback: ' + feedback : ''}`,
        type: 'FEEDBACK',
      },
    });

    return NextResponse.json(submission);
  } catch (error) {
    console.error('Grade submission error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
