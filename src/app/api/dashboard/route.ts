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

    if (payload.role === 'STUDENT') {
      // Student dashboard
      const [pendingAssignments, submittedSubmissions, upcomingAssignments, gradedSubmissions] =
        await Promise.all([
          // Pending assignments count (active, not yet submitted by this student)
          db.assignment.count({
            where: {
              status: 'ACTIVE',
              submissions: {
                none: { studentId: payload.userId },
              },
            },
          }),

          // Submitted count
          db.submission.count({
            where: { studentId: payload.userId },
          }),

          // Upcoming deadlines (next 7 days)
          db.assignment.findMany({
            where: {
              status: 'ACTIVE',
              deadline: {
                gte: new Date(),
                lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
              },
              submissions: {
                none: { studentId: payload.userId },
              },
            },
            include: {
              subject: {
                select: { name: true, code: true },
              },
            },
            orderBy: { deadline: 'asc' },
            take: 10,
          }),

          // Average marks from graded submissions
          db.submission.aggregate({
            where: {
              studentId: payload.userId,
              status: 'GRADED',
              marks: { not: null },
            },
            _avg: { marks: true },
            _count: true,
          }),
        ]);

      return NextResponse.json({
        pendingAssignments: pendingAssignments,
        submittedCount: submittedSubmissions,
        upcomingDeadlines: upcomingAssignments.length,
        averageMarks: gradedSubmissions._avg.marks ? Math.round(gradedSubmissions._avg.marks * 10) / 10 : 0,
        gradedCount: gradedSubmissions._count,
      });
    }

    if (payload.role === 'TEACHER') {
      // Teacher dashboard
      const [createdAssignments, totalSubmissions, pendingGrading, allGraded] = await Promise.all([
        // Created assignments count
        db.assignment.count({
          where: { createdBy: payload.userId },
        }),

        // Total submissions for teacher's assignments
        db.submission.count({
          where: {
            assignment: { createdBy: payload.userId },
          },
        }),

        // Pending grading count
        db.submission.count({
          where: {
            assignment: { createdBy: payload.userId },
            status: { in: ['SUBMITTED', 'LATE'] },
          },
        }),

        // Average student marks across teacher's assignments
        db.submission.aggregate({
          where: {
            assignment: { createdBy: payload.userId },
            status: 'GRADED',
            marks: { not: null },
          },
          _avg: { marks: true },
        }),
      ]);

      return NextResponse.json({
        createdAssignments: createdAssignments,
        totalSubmissions,
        pendingGrading: pendingGrading,
        averageMarks: allGraded._avg.marks ? Math.round(allGraded._avg.marks * 10) / 10 : 0,
      });
    }

    if (payload.role === 'ADMIN') {
      // Admin dashboard
      const [totalUsers, totalAssignments, totalSubmissions, subjects, userByRole] = await Promise.all([
        db.user.count(),
        db.assignment.count(),
        db.submission.count(),
        db.subject.findMany({
          include: {
            teacher: {
              select: { name: true },
            },
            _count: {
              select: { assignments: true },
            },
          },
        }),
        db.user.groupBy({
          by: ['role'],
          _count: { role: true },
        }),
      ]);

      return NextResponse.json({
        totalUsers,
        totalAssignments,
        totalSubmissions,
        activeSubjects: subjects.length,
        subjectStats: subjects.map((s) => ({
          id: s.id,
          name: s.name,
          code: s.code,
          teacherName: s.teacher.name,
          assignmentCount: s._count.assignments,
        })),
        usersByRole: userByRole.map((r) => ({
          role: r.role,
          count: r._count.role,
        })),
      });
    }

    return NextResponse.json({ error: 'Unknown role' }, { status: 400 });
  } catch (error) {
    console.error('Dashboard error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
