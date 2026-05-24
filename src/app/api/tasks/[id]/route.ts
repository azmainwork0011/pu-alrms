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

// ─── GET: Single task detail ────────────────────────────────
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const payload = getTokenPayload(req);
    if (!payload) {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 });
    }

    const { id } = await params;

    const task = await db.submissionTask.findUnique({
      where: { id },
      include: {
        creator: {
          select: { id: true, name: true, email: true, avatar: true },
        },
        _count: {
          select: { responses: true },
        },
      },
    });

    if (!task) {
      return NextResponse.json({ success: false, error: 'Task not found' }, { status: 404 });
    }

    // CR/Admin: include all responses with student info
    if (['CR', 'ADMIN', 'SUPER_ADMIN', 'TEACHER', 'DEVELOPER'].includes(payload.role)) {
      const responses = await db.taskResponse.findMany({
        where: { taskId: id },
        include: {
          student: {
            select: { id: true, name: true, email: true, avatar: true, rollNumber: true },
          },
        },
        orderBy: { submittedAt: 'desc' },
      });
      return NextResponse.json({
        success: true,
        data: { ...task, responses },
      });
    }

    // Student: only include their own response
    const myResponse = await db.taskResponse.findUnique({
      where: {
        taskId_studentId: {
          taskId: id,
          studentId: payload.userId,
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: { ...task, myResponse },
    });
  } catch (error) {
    console.error('Get task detail error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

// ─── PUT: Update task (CR/Admin) ────────────────────────────
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const payload = getTokenPayload(req);
    if (!payload) {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 });
    }

    // RBAC check — only CR+ can edit
    const permissionGuard = requirePermission('submission:create');
    const guardResult = permissionGuard(req);
    if (guardResult) return guardResult;

    const { id } = await params;
    const body = await req.json();

    // Check task exists
    const existingTask = await db.submissionTask.findUnique({
      where: { id },
    });

    if (!existingTask) {
      return NextResponse.json({ success: false, error: 'Task not found' }, { status: 404 });
    }

    // Don't allow editing archived tasks
    if (existingTask.status === 'ARCHIVED') {
      return NextResponse.json({ success: false, error: 'Cannot edit an archived task' }, { status: 400 });
    }

    // Build update data — only allow updating specific fields
    const updateData: Record<string, unknown> = {};
    const allowedFields = ['subjectName', 'subjectCode', 'description', 'dueDate', 'status', 'attachmentUrl', 'attachmentName', 'type'];

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        if (field === 'dueDate') {
          updateData[field] = new Date(body[field]);
        } else if (field === 'status') {
          const validStatuses = ['ACTIVE', 'CLOSED'];
          if (!validStatuses.includes(body[field])) {
            return NextResponse.json(
              { success: false, error: `status must be one of: ${validStatuses.join(', ')}` },
              { status: 400 },
            );
          }
          updateData[field] = body[field];

          // If closing the task, send batch notification
          if (body[field] === 'CLOSED' && existingTask.status !== 'CLOSED') {
            await db.batchNotification.create({
              data: {
                taskId: id,
                batch: existingTask.batch,
                title: `Submission Closed: ${existingTask.subjectName}`,
                message: `The ${existingTask.type.replace('_', ' ').toLowerCase()} for ${existingTask.subjectName} (${existingTask.subjectCode}) has been closed. No further submissions will be accepted.`,
                type: 'DEADLINE',
                sentBy: payload.userId,
              },
            });
          }
        } else {
          updateData[field] = body[field];
        }
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ success: false, error: 'No valid fields to update' }, { status: 400 });
    }

    const updatedTask = await db.submissionTask.update({
      where: { id },
      data: updateData,
      include: {
        creator: {
          select: { id: true, name: true, email: true, avatar: true },
        },
        _count: {
          select: { responses: true },
        },
      },
    });

    // If due date changed and extended, notify batch
    if (body.dueDate && body.dueDate !== existingTask.dueDate.toISOString()) {
      const newDue = new Date(body.dueDate);
      const isExtended = newDue > existingTask.dueDate;
      if (isExtended) {
        await db.batchNotification.create({
          data: {
            taskId: id,
            batch: existingTask.batch,
            title: `Deadline Extended: ${existingTask.subjectName}`,
            message: `The deadline for ${existingTask.subjectName} (${existingTask.subjectCode}) has been extended to ${newDue.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}.`,
            type: 'DEADLINE',
            sentBy: payload.userId,
          },
        });

        // Also notify individual students
        const students = await db.user.findMany({
          where: { role: { in: ['STUDENT', 'CR'] }, batch: existingTask.batch },
          select: { id: true },
        });
        if (students.length > 0) {
          await db.notification.createMany({
            data: students.map((s) => ({
              userId: s.id,
              title: `Deadline Extended: ${existingTask.subjectName}`,
              message: `The deadline for ${existingTask.subjectName} (${existingTask.subjectCode}) has been extended to ${newDue.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}.`,
              type: 'SUBMISSION',
            })),
          });
        }
      }
    }

    return NextResponse.json({ success: true, data: updatedTask });
  } catch (error) {
    console.error('Update task error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

// ─── DELETE: Hard delete the task and its responses (CR/Admin) ──
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const payload = getTokenPayload(req);
    if (!payload) {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 });
    }

    // RBAC check
    const permissionGuard = requirePermission('submission:create');
    const guardResult = permissionGuard(req);
    if (guardResult) return guardResult;

    const { id } = await params;

    const existingTask = await db.submissionTask.findUnique({
      where: { id },
    });

    if (!existingTask) {
      return NextResponse.json({ success: false, error: 'Task not found' }, { status: 404 });
    }

    // Delete all responses first, then batch notifications, then the task
    await db.taskResponse.deleteMany({ where: { taskId: id } });
    await db.batchNotification.deleteMany({ where: { taskId: id } });
    const deletedTask = await db.submissionTask.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, data: deletedTask });
  } catch (error) {
    console.error('Delete task error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
