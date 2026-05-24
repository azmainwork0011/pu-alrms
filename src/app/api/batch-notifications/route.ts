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

// ─── GET: Get notifications for user's batch (paginated) ────
export async function GET(req: NextRequest) {
  try {
    const payload = getTokenPayload(req);
    if (!payload) {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const batch = searchParams.get('batch');
    const type = searchParams.get('type');
    const page = Math.max(parseInt(searchParams.get('page') || '1'), 1);
    const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '20'), 1), 100);
    const skip = (page - 1) * limit;

    // Determine which batch to filter by
    let targetBatch = batch;
    if (!targetBatch) {
      // Use the user's own batch
      const user = await db.user.findUnique({
        where: { id: payload.userId },
        select: { batch: true },
      });
      targetBatch = user?.batch;
    }

    const where: Record<string, unknown> = {};
    if (targetBatch) where.batch = targetBatch;
    if (type) where.type = type;

    // Admin/CR can see all batches if no specific batch given
    if (!targetBatch && ['ADMIN', 'SUPER_ADMIN', 'DEVELOPER'].includes(payload.role)) {
      // No batch filter — show all
    } else if (!targetBatch) {
      return NextResponse.json({
        success: true,
        data: [],
        pagination: { page, limit, total: 0 },
      });
    }

    const [notifications, total] = await Promise.all([
      db.batchNotification.findMany({
        where,
        include: {
          creator: {
            select: { id: true, name: true, avatar: true },
          },
          task: {
            select: {
              id: true,
              subjectName: true,
              subjectCode: true,
              type: true,
              status: true,
              dueDate: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip,
      }),
      db.batchNotification.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: notifications,
      pagination: { page, limit, total },
    });
  } catch (error) {
    console.error('Get batch notifications error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

// ─── POST: Send custom batch notification (CR/Admin) ────────
export async function POST(req: NextRequest) {
  try {
    const payload = getTokenPayload(req);
    if (!payload) {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 });
    }

    // RBAC check
    const permissionGuard = requirePermission('notification:manage');
    const guardResult = permissionGuard(req);
    if (guardResult) return guardResult;

    const body = await req.json();
    const { batch, title, message, type, taskId } = body;

    if (!batch || !title || !message) {
      return NextResponse.json(
        { success: false, error: 'batch, title, and message are required' },
        { status: 400 },
      );
    }

    const validTypes = ['SUBMISSION', 'DEADLINE', 'GENERAL', 'INFO'];
    const notificationType = type || 'GENERAL';
    if (!validTypes.includes(notificationType)) {
      return NextResponse.json(
        { success: false, error: `type must be one of: ${validTypes.join(', ')}` },
        { status: 400 },
      );
    }

    // Create batch notification
    const notification = await db.batchNotification.create({
      data: {
        taskId: taskId || null,
        batch,
        title,
        message,
        type: notificationType,
        sentBy: payload.userId,
      },
      include: {
        creator: {
          select: { id: true, name: true, avatar: true },
        },
        task: taskId
          ? {
              select: {
                id: true,
                subjectName: true,
                subjectCode: true,
                type: true,
                status: true,
              },
            }
          : false,
      },
    });

    // Also create individual notifications for all students in the batch
    const students = await db.user.findMany({
      where: { role: { in: ['STUDENT', 'CR'] }, batch },
      select: { id: true },
    });

    if (students.length > 0) {
      await db.notification.createMany({
        data: students.map((student) => ({
          userId: student.id,
          title,
          message,
          type: notificationType === 'INFO' ? 'INFO' : 'SUBMISSION',
        })),
      });
    }

    return NextResponse.json({ success: true, data: notification }, { status: 201 });
  } catch (error) {
    console.error('Create batch notification error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
