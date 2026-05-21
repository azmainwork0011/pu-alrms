import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyToken } from '@/lib/jwt';
import { requireMinRole } from '@/lib/rbac';

// ─── Auth helper ────────────────────────────────────────────
function getTokenPayload(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  const token = authHeader?.replace('Bearer ', '');
  if (!token) return null;
  return verifyToken(token);
}

// ─── GET: Analytics for submission tasks (CR/Admin) ─────────
export async function GET(req: NextRequest) {
  try {
    const payload = getTokenPayload(req);
    if (!payload) {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 });
    }

    // Only CR and above can access analytics
    const roleGuard = requireMinRole('CR');
    const guardResult = roleGuard(req);
    if (guardResult) return guardResult;

    const { searchParams } = new URL(req.url);
    const batchFilter = searchParams.get('batch');

    // Determine which batches to analyze
    let targetBatches: string[] | null = null;
    if (batchFilter) {
      targetBatches = [batchFilter];
    } else if (payload.role === 'CR') {
      const user = await db.user.findUnique({
        where: { id: payload.userId },
        select: { batch: true },
      });
      if (user?.batch) {
        targetBatches = [user.batch];
      }
    }

    // ── 1. Submission completion rate per task ───────────────
    const tasks = await db.submissionTask.findMany({
      where: {
        ...(targetBatches ? { batch: { in: targetBatches } } : {}),
        status: { not: 'ARCHIVED' },
      },
      include: {
        _count: { select: { responses: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Get total students per batch for completion rate
    const allBatches = targetBatches || [...new Set(tasks.map((t) => t.batch))];
    const batchStudentCounts: Record<string, number> = {};

    await Promise.all(
      allBatches.map(async (batch) => {
        const count = await db.user.count({
          where: { role: { in: ['STUDENT', 'CR'] }, batch },
        });
        batchStudentCounts[batch] = count;
      }),
    );

    const taskCompletionRates = tasks.map((task) => {
      const totalStudents = batchStudentCounts[task.batch] || 1;
      const submittedCount = task._count.responses;
      return {
        taskId: task.id,
        subjectName: task.subjectName,
        subjectCode: task.subjectCode,
        batch: task.batch,
        type: task.type,
        status: task.status,
        dueDate: task.dueDate,
        totalStudents,
        submittedCount,
        completionRate: Math.round((submittedCount / totalStudents) * 100),
      };
    });

    // ── 2. Pending vs submitted counts ───────────────────────
    const responseStatusCounts = await db.taskResponse.groupBy({
      by: ['status'],
      _count: true,
      where: {
        ...(targetBatches
          ? { task: { batch: { in: targetBatches } } }
          : {}),
      },
    });

    const statusSummary: Record<string, number> = {
      PENDING: 0,
      SUBMITTED: 0,
      LATE: 0,
      GRADED: 0,
    };

    for (const s of responseStatusCounts) {
      statusSummary[s.status] = s._count;
    }

    // ── 3. Overdue tasks (ACTIVE + dueDate < now) ───────────
    const now = new Date();
    const overdueTasks = await db.submissionTask.findMany({
      where: {
        status: 'ACTIVE',
        dueDate: { lt: now },
        ...(targetBatches ? { batch: { in: targetBatches } } : {}),
      },
      include: {
        creator: {
          select: { id: true, name: true },
        },
        _count: { select: { responses: true } },
      },
      orderBy: { dueDate: 'asc' },
    });

    // ── 4. Active tasks per batch ───────────────────────────
    const activeTasksPerBatch = await db.submissionTask.groupBy({
      by: ['batch'],
      where: {
        status: 'ACTIVE',
        ...(targetBatches ? { batch: { in: targetBatches } } : {}),
      },
      _count: true,
    });

    const batchTaskCounts = activeTasksPerBatch.map((item) => ({
      batch: item.batch,
      activeTasks: item._count,
      studentCount: batchStudentCounts[item.batch] || 0,
    }));

    // ── 5. Students' submission rates ────────────────────────
    // Get top students by submission count for each batch
    const studentResponseCounts = await db.taskResponse.groupBy({
      by: ['studentId'],
      where: {
        status: { in: ['SUBMITTED', 'LATE', 'GRADED'] },
        ...(targetBatches
          ? { task: { batch: { in: targetBatches } } }
          : {}),
      },
      _count: true,
      orderBy: { _count: { id: 'desc' } },
      take: 20,
    });

    const studentRates = await Promise.all(
      studentResponseCounts.map(async (item) => {
        const student = await db.user.findUnique({
          where: { id: item.studentId },
          select: { id: true, name: true, email: true, avatar: true, batch: true },
        });

        // Total active tasks for this student's batch
        const totalTasksForBatch = await db.submissionTask.count({
          where: {
            batch: student?.batch,
            status: { not: 'ARCHIVED' },
          },
        });

        return {
          student: student
            ? { id: student.id, name: student.name, email: student.email, avatar: student.avatar, batch: student.batch }
            : null,
          submittedCount: item._count,
          totalTasks: totalTasksForBatch,
          submissionRate: totalTasksForBatch > 0 ? Math.round((item._count / totalTasksForBatch) * 100) : 0,
        };
      }),
    );

    // ── Summary stats ────────────────────────────────────────
    const totalActiveTasks = tasks.filter((t) => t.status === 'ACTIVE').length;
    const totalClosedTasks = tasks.filter((t) => t.status === 'CLOSED').length;
    const totalSubmissions = Object.values(statusSummary).reduce((a, b) => a + b, 0);
    const totalGraded = statusSummary.GRADED;

    return NextResponse.json({
      success: true,
      data: {
        summary: {
          totalTasks: tasks.length,
          activeTasks: totalActiveTasks,
          closedTasks: totalClosedTasks,
          overdueTasks: overdueTasks.length,
          totalSubmissions,
          totalGraded,
        },
        taskCompletionRates,
        statusSummary,
        overdueTasks,
        activeTasksPerBatch: batchTaskCounts,
        studentSubmissionRates: studentRates,
      },
    });
  } catch (error) {
    console.error('Get task analytics error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
