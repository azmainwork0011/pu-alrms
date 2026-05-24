import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyToken } from '@/lib/jwt';
import { requirePermission } from '@/lib/rbac';

// ─── Auth helper ────────────────────────────────────────────
function getTokenPayload(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  const token = authHeader?.replace('Bearer ', '');
  if (!token) return null;
  return verifyToken(token);
}

// ─── GET: List all responses for a task (CR/Admin) ──────────
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const payload = getTokenPayload(req);
    if (!payload) {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 });
    }

    // Only CR+ can view all responses
    if (!['CR', 'ADMIN', 'SUPER_ADMIN', 'TEACHER', 'DEVELOPER'].includes(payload.role)) {
      return NextResponse.json(
        { success: false, error: 'You do not have permission to view all responses' },
        { status: 403 },
      );
    }

    const { id: taskId } = await params;

    // Verify task exists
    const task = await db.submissionTask.findUnique({
      where: { id: taskId },
      select: { id: true, batch: true },
    });

    if (!task) {
      return NextResponse.json({ success: false, error: 'Task not found' }, { status: 404 });
    }

    const { searchParams } = new URL(req.url);
    const statusFilter = searchParams.get('status');

    const where: Record<string, unknown> = { taskId };
    if (statusFilter) where.status = statusFilter;

    const [responses, total] = await Promise.all([
      db.taskResponse.findMany({
        where,
        include: {
          student: {
            select: {
              id: true,
              name: true,
              email: true,
              avatar: true,
              rollNumber: true,
              batch: true,
            },
          },
        },
        orderBy: { submittedAt: 'desc' },
      }),
      db.taskResponse.count({ where }),
    ]);

    // Summary stats
    const stats = await db.taskResponse.groupBy({
      by: ['status'],
      where: { taskId },
      _count: true,
    });

    const statusCounts: Record<string, number> = {
      PENDING: 0,
      SUBMITTED: 0,
      LATE: 0,
      GRADED: 0,
    };

    for (const s of stats) {
      statusCounts[s.status] = s._count;
    }

    return NextResponse.json({
      success: true,
      data: responses,
      total,
      statusCounts,
    });
  } catch (error) {
    console.error('Get task responses error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

// ─── PUT: Grade a specific response (CR/Admin) ──────────────
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const payload = getTokenPayload(req);
    if (!payload) {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 });
    }

    // Only users with submission:grade permission can grade
    const permissionGuard = requirePermission('submission:grade');
    const guardResult = permissionGuard(req);
    if (guardResult) return guardResult;

    const { id: taskId } = await params;
    const body = await req.json();

    const { responseId, marks, feedback } = body;

    if (!responseId) {
      return NextResponse.json({ success: false, error: 'responseId is required' }, { status: 400 });
    }

    // Verify the response belongs to this task
    const existingResponse = await db.taskResponse.findUnique({
      where: { id: responseId },
    });

    if (!existingResponse) {
      return NextResponse.json({ success: false, error: 'Response not found' }, { status: 404 });
    }

    if (existingResponse.taskId !== taskId) {
      return NextResponse.json(
        { success: false, error: 'Response does not belong to this task' },
        { status: 400 },
      );
    }

    if (existingResponse.status === 'GRADED') {
      // Allow re-grading (update marks/feedback)
    }

    if (existingResponse.status === 'PENDING') {
      return NextResponse.json(
        { success: false, error: 'Cannot grade a pending (not submitted) response' },
        { status: 400 },
      );
    }

    // Validate marks
    if (marks !== undefined && marks !== null) {
      if (typeof marks !== 'number' || marks < 0) {
        return NextResponse.json({ success: false, error: 'marks must be a non-negative number' }, { status: 400 });
      }
    }

    // Update the response
    const gradedResponse = await db.taskResponse.update({
      where: { id: responseId },
      data: {
        ...(marks !== undefined && marks !== null ? { marks } : {}),
        ...(feedback !== undefined ? { feedback } : {}),
        status: 'GRADED',
        gradedAt: new Date(),
      },
      include: {
        student: {
          select: { id: true, name: true, email: true },
        },
        task: {
          select: { subjectName: true, subjectCode: true, type: true },
        },
      },
    });

    // Notify the student about grading
    await db.notification.create({
      data: {
        userId: existingResponse.studentId,
        title: 'Submission Graded',
        message: `Your submission for ${gradedResponse.task.subjectName} (${gradedResponse.task.subjectCode}) has been graded.${marks !== undefined && marks !== null ? ` Marks: ${marks}` : ''}${feedback ? ` Feedback: ${feedback}` : ''}`,
        type: 'SUBMISSION',
      },
    });

    return NextResponse.json({ success: true, data: gradedResponse });
  } catch (error) {
    console.error('Grade response error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
