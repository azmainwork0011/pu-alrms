import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/jwt';
import { db } from '@/lib/db';

// ═══════════════════════════════════════════════════════════
// GET — System statistics (SUPER_ADMIN only)
// ═══════════════════════════════════════════════════════════
export async function GET(req: NextRequest) {
  try {
    // ── Auth check ─────────────────────────────────────────
    const token = req.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
    if (payload.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Super Admin access required' }, { status: 403 });
    }

    // ── Run all queries in parallel for speed ──────────────
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - 7);
    weekStart.setHours(0, 0, 0, 0);

    const [
      totalUsers,
      usersByRole,
      activeToday,
      newThisWeek,
      bannedUsers,
      totalAssignments,
      totalSubmissions,
    ] = await Promise.all([
      // Total user count
      db.user.count(),

      // Users grouped by role
      db.user.groupBy({
        by: ['role'],
        _count: { role: true },
      }),

      // Users active today (lastLogin >= today midnight)
      db.user.count({
        where: {
          lastLogin: { gte: todayStart },
        },
      }),

      // New users this week (createdAt >= 7 days ago)
      db.user.count({
        where: {
          createdAt: { gte: weekStart },
        },
      }),

      // Banned users
      db.user.count({
        where: {
          status: 'BANNED',
        },
      }),

      // Total assignments
      db.assignment.count(),

      // Total submissions
      db.submission.count(),
    ]);

    // Format usersByRole into roleDistribution array for frontend
    const roleDistribution = usersByRole.map((item) => ({
      role: item.role,
      count: item._count.role,
    }));

    // System uptime: time since the first user was created (proxy for system launch)
    const firstUser = await db.user.findFirst({
      select: { createdAt: true },
      orderBy: { createdAt: 'asc' },
    });

    const systemUptimeMs = firstUser
      ? Date.now() - firstUser.createdAt.getTime()
      : Math.floor(process.uptime() * 1000);

    const uptimeSeconds = Math.floor(systemUptimeMs / 1000);
    const uptimeDays = Math.floor(uptimeSeconds / 86400);
    const uptimeHours = Math.floor((uptimeSeconds % 86400) / 3600);
    const uptimeMinutes = Math.floor((uptimeSeconds % 3600) / 60);

    return NextResponse.json({
      totalUsers,
      roleDistribution,
      activeToday,
      newThisWeek,
      bannedUsers,
      totalAssignments,
      totalSubmissions,
      systemUptime: {
        milliseconds: systemUptimeMs,
        display: `${uptimeDays}d ${uptimeHours}h ${uptimeMinutes}m`,
      },
    });
  } catch (error) {
    console.error('Admin stats error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
