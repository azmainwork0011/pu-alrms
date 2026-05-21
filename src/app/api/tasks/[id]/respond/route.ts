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

// ─── POST: Student submits a response to a task ─────────────
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const payload = getTokenPayload(req);
    if (!payload) {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 });
    }

    // RBAC check — students can submit
    const permissionGuard = requirePermission('submission:create');
    const guardResult = permissionGuard(req);
    if (guardResult) return guardResult;

    const { id: taskId } = await params;

    // Get the task
    const task = await db.submissionTask.findUnique({
      where: { id: taskId },
      include: {
        creator: {
          select: { id: true, name: true },
        },
      },
    });

    if (!task) {
      return NextResponse.json({ success: false, error: 'Task not found' }, { status: 404 });
    }

    if (task.status !== 'ACTIVE') {
      return NextResponse.json({ success: false, error: 'This task is no longer accepting submissions' }, { status: 400 });
    }

    // Check if student is in the correct batch
    const student = await db.user.findUnique({
      where: { id: payload.userId },
      select: { batch: true, name: true },
    });

    if (!student || student.batch !== task.batch) {
      return NextResponse.json(
        { success: false, error: 'You are not in the batch assigned to this task' },
        { status: 403 },
      );
    }

    const body = await req.json();
    const { fileName, fileUrl, fileSize } = body;

    if (!fileName) {
      return NextResponse.json({ success: false, error: 'fileName is required' }, { status: 400 });
    }

    // Check if already submitted
    const existingResponse = await db.taskResponse.findUnique({
      where: {
        taskId_studentId: {
          taskId,
          studentId: payload.userId,
        },
      },
    });

    if (existingResponse) {
      if (existingResponse.status === 'GRADED') {
        return NextResponse.json(
          { success: false, error: 'This response has already been graded and cannot be resubmitted' },
          { status: 409 },
        );
      }

      // Allow resubmit if PENDING, SUBMITTED, or LATE — update existing record
      const isLate = new Date() > new Date(task.dueDate);
      const updatedResponse = await db.taskResponse.update({
        where: {
          taskId_studentId: {
            taskId,
            studentId: payload.userId,
          },
        },
        data: {
          fileName,
          fileUrl: fileUrl || null,
          fileSize: fileSize || null,
          status: isLate ? 'LATE' : 'SUBMITTED',
          submittedAt: new Date(),
        },
      });

      // Notify CR about resubmission
      await db.notification.create({
        data: {
          userId: task.createdBy,
          title: 'Resubmission Received',
          message: `${student.name} resubmitted "${fileName}" for ${task.subjectName} (${task.subjectCode})${isLate ? ' (LATE)' : ''}.`,
          type: 'SUBMISSION',
        },
      });

      return NextResponse.json({ success: true, data: updatedResponse });
    }

    // First submission — check due date for late marking
    const isLate = new Date() > new Date(task.dueDate);

    const response = await db.taskResponse.create({
      data: {
        taskId,
        studentId: payload.userId,
        fileName,
        fileUrl: fileUrl || null,
        fileSize: fileSize || null,
        status: isLate ? 'LATE' : 'SUBMITTED',
        submittedAt: new Date(),
      },
    });

    // Notify CR who created the task
    await db.notification.create({
      data: {
        userId: task.createdBy,
        title: 'New Submission',
        message: `${student.name} submitted "${fileName}" for ${task.subjectName} (${task.subjectCode})${isLate ? ' (LATE)' : ''}.`,
        type: 'SUBMISSION',
      },
    });

    return NextResponse.json({ success: true, data: response }, { status: 201 });
  } catch (error) {
    console.error('Submit response error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
