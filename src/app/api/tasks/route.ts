import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyToken } from '@/lib/jwt';
import { requirePermission } from '@/lib/rbac';

// ─── Auth helper (follows existing pattern) ─────────────────
function getTokenPayload(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  const token = authHeader?.replace('Bearer ', '');
  if (!token) return null;
  return verifyToken(token);
}

// ─── GET: List submission tasks with role-based filtering ───
export async function GET(req: NextRequest) {
  try {
    const payload = getTokenPayload(req);
    if (!payload) {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const batch = searchParams.get('batch');
    const type = searchParams.get('type');
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const page = Math.max(parseInt(searchParams.get('page') || '1'), 1);
    const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '20'), 1), 100);
    const skip = (page - 1) * limit;

    // Build where clause based on role
    const where: Record<string, unknown> = {};

    if (payload.role === 'STUDENT') {
      // Students only see tasks for their batch (non-archived)
      const user = await db.user.findUnique({
        where: { id: payload.userId },
        select: { batch: true },
      });
      if (!user?.batch) {
        return NextResponse.json({ success: true, data: [], pagination: { page, limit, total: 0 } });
      }
      where.batch = user.batch;
      // Don't show archived tasks to students
      if (!status) {
        where.status = { in: ['ACTIVE', 'CLOSED'] };
      }
    } else if (payload.role === 'CR') {
      // CR sees tasks for their batch
      const user = await db.user.findUnique({
        where: { id: payload.userId },
        select: { batch: true },
      });
      if (user?.batch) {
        where.batch = user.batch;
      }
    }
    // Admin/Teacher see all

    // Apply filters
    if (batch) where.batch = batch;
    if (type) where.type = type;
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { subjectName: { contains: search } },
        { subjectCode: { contains: search } },
      ];
    }

    const [tasks, total] = await Promise.all([
      db.submissionTask.findMany({
        where,
        include: {
          creator: {
            select: { id: true, name: true, email: true, avatar: true },
          },
          _count: {
            select: { responses: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip,
      }),
      db.submissionTask.count({ where }),
    ]);

    // For students, attach their own response to each task
    let enrichedTasks = tasks;
    if (payload.role === 'STUDENT') {
      enrichedTasks = await Promise.all(
        tasks.map(async (task) => {
          const myResponse = await db.taskResponse.findUnique({
            where: {
              taskId_studentId: {
                taskId: task.id,
                studentId: payload.userId,
              },
            },
          });
          return {
            ...task,
            myResponse: myResponse || null,
          };
        }),
      );
    }

    return NextResponse.json({
      success: true,
      data: enrichedTasks,
      pagination: { page, limit, total },
    });
  } catch (error) {
    console.error('Get tasks error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

// ─── POST: Create new submission task (CR/Admin) ────────────
export async function POST(req: NextRequest) {
  try {
    const payload = getTokenPayload(req);
    if (!payload) {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 });
    }

    // RBAC check
    const permissionGuard = requirePermission('submission:create');
    const guardResult = permissionGuard(req);
    if (guardResult) return guardResult;

    const body = await req.json();
    const { subjectName, subjectCode, batch, type, description, dueDate, attachmentUrl, attachmentName } = body;

    // Validate required fields
    if (!subjectName || !subjectCode || !batch || !dueDate) {
      return NextResponse.json(
        { success: false, error: 'subjectName, subjectCode, batch, and dueDate are required' },
        { status: 400 },
      );
    }

    const validTypes = ['ASSIGNMENT', 'LAB_REPORT', 'PRESENTATION'];
    const taskType = type || 'ASSIGNMENT';
    if (!validTypes.includes(taskType)) {
      return NextResponse.json(
        { success: false, error: `type must be one of: ${validTypes.join(', ')}` },
        { status: 400 },
      );
    }

    // Validate dueDate is a valid future date
    const dueDateParsed = new Date(dueDate);
    if (isNaN(dueDateParsed.getTime())) {
      return NextResponse.json({ success: false, error: 'Invalid dueDate format' }, { status: 400 });
    }

    // Create the task
    const task = await db.submissionTask.create({
      data: {
        subjectName,
        subjectCode,
        batch,
        type: taskType,
        description: description || '',
        dueDate: dueDateParsed,
        attachmentUrl: attachmentUrl || null,
        attachmentName: attachmentName || null,
        status: 'ACTIVE',
        createdBy: payload.userId,
      },
      include: {
        creator: {
          select: { id: true, name: true, email: true, avatar: true },
        },
        _count: {
          select: { responses: true },
        },
      },
    });

    // Auto-generate BatchNotification for the batch
    await db.batchNotification.create({
      data: {
        taskId: task.id,
        batch,
        title: `New ${taskType.replace('_', ' ')}: ${subjectName}`,
        message: `A new ${taskType.replace('_', ' ').toLowerCase()} has been posted for ${subjectName} (${subjectCode}). Due: ${dueDateParsed.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}.`,
        type: 'SUBMISSION',
        sentBy: payload.userId,
      },
    });

    // Create individual Notification records for ALL students in that batch
    const students = await db.user.findMany({
      where: {
        role: { in: ['STUDENT', 'CR'] },
        batch,
      },
      select: { id: true },
    });

    if (students.length > 0) {
      await db.notification.createMany({
        data: students.map((student) => ({
          userId: student.id,
          title: `New ${taskType.replace('_', ' ')}: ${subjectName}`,
          message: `A new ${taskType.replace('_', ' ').toLowerCase()} for ${subjectName} (${subjectCode}) has been posted. Due: ${dueDateParsed.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}.`,
          type: 'SUBMISSION',
        })),
      });
    }

    return NextResponse.json({ success: true, data: task }, { status: 201 });
  } catch (error) {
    console.error('Create task error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
