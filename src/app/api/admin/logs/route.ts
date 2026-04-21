import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/jwt';
import { db } from '@/lib/db';

// ═══════════════════════════════════════════════════════════
// GET — Activity logs: recent login events (SUPER_ADMIN only)
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

    // ── Parse query params ─────────────────────────────────
    const { searchParams } = new URL(req.url);
    const limit = Math.min(200, Math.max(1, parseInt(searchParams.get('limit') || '50', 10) || 50));
    const roleFilter = searchParams.get('role') || undefined;

    const VALID_ROLES = ['SUPER_ADMIN', 'ADMIN', 'DEVELOPER', 'TEACHER', 'STUDENT', 'CR'];

    // Build where clause
    const where: Record<string, unknown> = {
      lastLogin: { not: null },
    };
    if (roleFilter && VALID_ROLES.includes(roleFilter)) {
      where.role = roleFilter;
    }

    // ── Fetch users who have logged in, ordered by most recent ──
    const loginLogs = await db.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        lastLogin: true,
        createdAt: true,
      },
      orderBy: { lastLogin: 'desc' },
      take: limit,
    });

    // Format as activity log entries matching frontend LogEntry type
    const logs = loginLogs.map((user) => ({
      id: user.id,
      userId: user.id,
      userName: user.name,
      userEmail: user.email,
      userRole: user.role,
      action: 'LOGIN',
      timestamp: user.lastLogin?.toISOString() || '',
      status: user.status,
    }));

    return NextResponse.json(logs);
  } catch (error) {
    console.error('Admin logs error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
