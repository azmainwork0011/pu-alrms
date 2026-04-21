import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyToken } from '@/lib/jwt';

export async function GET(req: NextRequest) {
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

    if (payload.role === 'STUDENT' || payload.role === 'CR') {
      // ─── Student Dashboard ────────────────────────────
      const [
        pendingAssignments,
        submittedSubmissions,
        upcomingAssignments,
        gradedSubmissions,
        recentSubmissions,
        recentNotifications,
        recentAnnouncements,
        allAssignments,
        allSubjects,
      ] = await Promise.all([
        // Pending assignments count
        db.assignment.count({
          where: {
            status: 'ACTIVE',
            submissions: { none: { studentId: payload.userId } },
          },
        }),

        // Submitted count
        db.submission.count({ where: { studentId: payload.userId } }),

        // Upcoming deadlines (next 14 days)
        db.assignment.findMany({
          where: {
            status: 'ACTIVE',
            deadline: { gte: new Date(), lte: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) },
            submissions: { none: { studentId: payload.userId } },
          },
          include: { subject: { select: { name: true, code: true } } },
          orderBy: { deadline: 'asc' },
          take: 6,
        }),

        // Average marks
        db.submission.aggregate({
          where: { studentId: payload.userId, status: 'GRADED', marks: { not: null } },
          _avg: { marks: true },
          _count: true,
          _max: { marks: true },
          _min: { marks: true },
        }),

        // Recent submissions (last 5)
        db.submission.findMany({
          where: { studentId: payload.userId },
          include: { assignment: { include: { subject: { select: { name: true, code: true } } } } },
          orderBy: { submittedAt: 'desc' },
          take: 5,
        }),

        // Recent notifications (unread)
        db.notification.findMany({
          where: { userId: payload.userId, isRead: false },
          orderBy: { createdAt: 'desc' },
          take: 5,
        }),

        // Recent announcements
        db.announcement.findMany({
          orderBy: { createdAt: 'desc' },
          take: 3,
          include: { creator: { select: { name: true } } },
        }),

        // All active assignments for completion tracking
        db.assignment.findMany({
          where: { status: 'ACTIVE' },
          include: { subject: { select: { name: true, code: true } } },
        }),

        // All subjects
        db.subject.findMany({
          include: {
            _count: { select: { assignments: true } },
            teacher: { select: { name: true } },
          },
        }),
      ]);

      // Submission rate per subject
      const submittedAssignmentIds = (await db.submission.findMany({
        where: { studentId: payload.userId },
        select: { assignmentId: true },
      })).map(s => s.assignmentId);

      // Weekly performance data (last 6 weeks)
      const sixWeeksAgo = new Date(Date.now() - 6 * 7 * 24 * 60 * 60 * 1000);
      const weeklySubs = await db.submission.findMany({
        where: {
          studentId: payload.userId,
          submittedAt: { gte: sixWeeksAgo },
          status: 'GRADED',
          marks: { not: null },
        },
        select: { marks: true, submittedAt: true },
        orderBy: { submittedAt: 'asc' },
      });

      // Group by week
      const weeklyData: { week: string; avgMarks: number; count: number }[] = [];
      for (let i = 5; i >= 0; i--) {
        const weekStart = new Date(Date.now() - (i + 1) * 7 * 24 * 60 * 60 * 1000);
        const weekEnd = new Date(Date.now() - i * 7 * 24 * 60 * 60 * 1000);
        const weekSubs = weeklySubs.filter(s => {
          const d = new Date(s.submittedAt);
          return d >= weekStart && d < weekEnd;
        });
        const weekLabel = `W${6 - i}`;
        weeklyData.push({
          week: weekLabel,
          avgMarks: weekSubs.length > 0 ? Math.round(weekSubs.reduce((a, b) => a + (b.marks || 0), 0) / weekSubs.length * 10) / 10 : 0,
          count: weekSubs.length,
        });
      }

      // Subject performance breakdown
      const subjectPerf = await Promise.all(
        allSubjects.map(async (subj) => {
          const subjAssignments = allAssignments.filter(a => a.subjectId === subj.id && a.status === 'ACTIVE');
          const total = subjAssignments.length;
          const submitted = subjAssignments.filter(a => submittedAssignmentIds.includes(a.id)).length;
          const gradedSubs = await db.submission.findMany({
            where: { studentId: payload.userId, assignment: { subjectId: subj.id }, status: 'GRADED', marks: { not: null } },
            select: { marks: true },
          });
          const avg = gradedSubs.length > 0 ? Math.round(gradedSubs.reduce((a, b) => a + (b.marks || 0), 0) / gradedSubs.length * 10) / 10 : 0;
          return { id: subj.id, name: subj.name, code: subj.code, teacher: subj.teacher.name, total, submitted, avg };
        })
      );

      return NextResponse.json({
        pendingAssignments,
        submittedCount: submittedSubmissions,
        upcomingDeadlines: upcomingAssignments,
        averageMarks: gradedSubmissions._avg.marks ? Math.round(gradedSubmissions._avg.marks * 10) / 10 : 0,
        gradedCount: gradedSubmissions._count,
        maxMarks: gradedSubmissions._max.marks || 0,
        minMarks: gradedSubmissions._min.marks || 0,
        recentSubmissions,
        recentNotifications,
        recentAnnouncements,
        weeklyPerformance: weeklyData,
        subjectPerformance: subjectPerf,
        totalSubjects: allSubjects.length,
        completionRate: allAssignments.length > 0
          ? Math.round(submittedAssignmentIds.length / allAssignments.length * 100)
          : 0,
      });
    }

    if (payload.role === 'TEACHER') {
      // ─── Teacher Dashboard ─────────────────────────────
      const [
        createdAssignments,
        totalSubmissions,
        pendingGrading,
        allGraded,
        recentSubmissions,
        recentAssignments,
        recentAnnouncements,
        mySubjects,
        submissionTrend,
      ] = await Promise.all([
        db.assignment.count({ where: { createdBy: payload.userId } }),

        db.submission.count({ where: { assignment: { createdBy: payload.userId } } }),

        db.submission.count({
          where: { assignment: { createdBy: payload.userId }, status: { in: ['SUBMITTED', 'LATE'] } },
        }),

        db.submission.aggregate({
          where: { assignment: { createdBy: payload.userId }, status: 'GRADED', marks: { not: null } },
          _avg: { marks: true },
          _count: true,
          _max: { marks: true },
        }),

        // Recent ungraded submissions
        db.submission.findMany({
          where: { assignment: { createdBy: payload.userId }, status: { in: ['SUBMITTED', 'LATE'] } },
          include: {
            student: { select: { name: true, email: true, batch: true } },
            assignment: { select: { title: true, subject: { select: { name: true, code: true } } } },
          },
          orderBy: { submittedAt: 'desc' },
          take: 5,
        }),

        // Recent assignments created
        db.assignment.findMany({
          where: { createdBy: payload.userId },
          include: { subject: { select: { name: true, code: true } }, _count: { select: { submissions: true } } },
          orderBy: { createdAt: 'desc' },
          take: 5,
        }),

        db.announcement.findMany({
          orderBy: { createdAt: 'desc' },
          take: 3,
          include: { creator: { select: { name: true } } },
        }),

        // Teacher's subjects
        db.subject.findMany({
          where: { teacherId: payload.userId },
          include: { _count: { select: { assignments: true } } },
        }),

        // Submission trend (last 6 weeks)
        db.submission.findMany({
          where: { assignment: { createdBy: payload.userId }, submittedAt: { gte: new Date(Date.now() - 6 * 7 * 24 * 60 * 60 * 1000) } },
          select: { submittedAt: true, status: true },
          orderBy: { submittedAt: 'asc' },
        }),
      ]);

      // Weekly submission trend
      const weeklyData: { week: string; submitted: number; graded: number }[] = [];
      for (let i = 5; i >= 0; i--) {
        const weekStart = new Date(Date.now() - (i + 1) * 7 * 24 * 60 * 60 * 1000);
        const weekEnd = new Date(Date.now() - i * 7 * 24 * 60 * 60 * 1000);
        const weekSubs = submissionTrend.filter(s => {
          const d = new Date(s.submittedAt);
          return d >= weekStart && d < weekEnd;
        });
        weeklyData.push({
          week: `W${6 - i}`,
          submitted: weekSubs.length,
          graded: weekSubs.filter(s => s.status === 'GRADED').length,
        });
      }

      return NextResponse.json({
        createdAssignments,
        totalSubmissions,
        pendingGrading,
        averageMarks: allGraded._avg.marks ? Math.round(allGraded._avg.marks * 10) / 10 : 0,
        maxMarks: allGraded._max.marks || 0,
        recentSubmissions,
        recentAssignments,
        recentAnnouncements,
        subjects: mySubjects,
        weeklyTrend: weeklyData,
      });
    }

    if (payload.role === 'ADMIN' || payload.role === 'SUPER_ADMIN' || payload.role === 'DEVELOPER') {
      // ─── Admin Dashboard ───────────────────────────────
      const [
        totalUsers,
        totalAssignments,
        totalSubmissions,
        subjects,
        userByRole,
        recentAnnouncements,
        recentSubmissions,
        submissionTrend,
        topStudents,
        ungradedCount,
      ] = await Promise.all([
        db.user.count(),
        db.assignment.count(),
        db.submission.count(),
        db.subject.findMany({
          include: { teacher: { select: { name: true } }, _count: { select: { assignments: true } } },
        }),
        db.user.groupBy({ by: ['role'], _count: { role: true } }),
        db.announcement.findMany({
          orderBy: { createdAt: 'desc' },
          take: 4,
          include: { creator: { select: { name: true } } },
        }),
        db.submission.findMany({
          include: {
            student: { select: { name: true, batch: true } },
            assignment: { select: { title: true, subject: { select: { name: true, code: true } } } },
          },
          orderBy: { submittedAt: 'desc' },
          take: 5,
        }),
        db.submission.findMany({
          where: { submittedAt: { gte: new Date(Date.now() - 6 * 7 * 24 * 60 * 60 * 1000) } },
          select: { submittedAt: true, status: true },
          orderBy: { submittedAt: 'asc' },
        }),
        // Top 5 students by average grade
        db.user.findMany({
          where: { role: 'STUDENT' },
          take: 30,
          include: {
            submissions: { where: { status: 'GRADED', marks: { not: null } }, select: { marks: true } },
          },
        }).then(users =>
          users
            .map(u => ({
              id: u.id,
              name: u.name,
              batch: u.batch,
              avgMarks: u.submissions.length > 0
                ? Math.round(u.submissions.reduce((a, s) => a + (s.marks || 0), 0) / u.submissions.length * 10) / 10
                : 0,
              totalSubs: u.submissions.length,
            }))
            .filter(u => u.totalSubs > 0)
            .sort((a, b) => b.avgMarks - a.avgMarks)
            .slice(0, 5)
        ),
        db.submission.count({ where: { status: { in: ['SUBMITTED', 'LATE'] } } }),
      ]);

      // Weekly trend
      const weeklyData: { week: string; total: number; graded: number }[] = [];
      for (let i = 5; i >= 0; i--) {
        const weekStart = new Date(Date.now() - (i + 1) * 7 * 24 * 60 * 60 * 1000);
        const weekEnd = new Date(Date.now() - i * 7 * 24 * 60 * 60 * 1000);
        const weekSubs = submissionTrend.filter(s => {
          const d = new Date(s.submittedAt);
          return d >= weekStart && d < weekEnd;
        });
        weeklyData.push({
          week: `W${6 - i}`,
          total: weekSubs.length,
          graded: weekSubs.filter(s => s.status === 'GRADED').length,
        });
      }

      return NextResponse.json({
        totalUsers,
        totalAssignments,
        totalSubmissions,
        activeSubjects: subjects,
        usersByRole: userByRole.map(r => ({ role: r.role, count: r._count.role })),
        recentAnnouncements,
        recentSubmissions,
        weeklyTrend: weeklyData,
        topStudents,
        ungradedCount,
      });
    }

    return NextResponse.json({ error: 'Unknown role' }, { status: 400 });
  } catch (error) {
    console.error('Dashboard error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
