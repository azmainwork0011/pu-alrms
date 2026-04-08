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

    // Get all graded submissions grouped by student
    const gradedSubmissions = await db.submission.findMany({
      where: {
        status: 'GRADED',
        marks: { not: null },
      },
      include: {
        student: {
          select: { id: true, name: true, email: true, avatar: true },
        },
      },
    });

    // Calculate average marks per student
    const studentStats = new Map<string, {
      student: (typeof gradedSubmissions)[0]['student'];
      totalSubmissions: number;
      totalMarks: number;
      gradedCount: number;
    }>();

    for (const sub of gradedSubmissions) {
      const existing = studentStats.get(sub.studentId);
      if (existing) {
        existing.totalSubmissions += 1;
        existing.totalMarks += sub.marks!;
        existing.gradedCount += 1;
      } else {
        studentStats.set(sub.studentId, {
          student: sub.student,
          totalSubmissions: 1,
          totalMarks: sub.marks!,
          gradedCount: 1,
        });
      }
    }

    // Also count total submissions (including non-graded) per student
    const allSubmissions = await db.submission.groupBy({
      by: ['studentId'],
      _count: { id: true },
    });

    const totalSubMap = new Map(allSubmissions.map((s) => [s.studentId, s._count.id]));

    // Build leaderboard
    const leaderboard = Array.from(studentStats.entries())
      .map(([studentId, stats]) => ({
        id: studentId,
        name: stats.student.name,
        email: stats.student.email,
        avatar: stats.student.avatar,
        totalSubmissions: totalSubMap.get(studentId) || stats.totalSubmissions,
        averageMarks: Math.round((stats.totalMarks / stats.gradedCount) * 100) / 100,
      }))
      .sort((a, b) => b.averageMarks - a.averageMarks);

    return NextResponse.json(leaderboard);
  } catch (error) {
    console.error('Leaderboard error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
