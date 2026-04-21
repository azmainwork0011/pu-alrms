import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/jwt';
import { db } from '@/lib/db';

// ─── Valid role and status values ─────────────────────────
const VALID_ROLES = ['SUPER_ADMIN', 'ADMIN', 'DEVELOPER', 'TEACHER', 'STUDENT', 'CR'] as const;
const VALID_STATUSES = ['ACTIVE', 'SUSPENDED', 'BANNED'] as const;

// ─── Shared auth guard for SUPER_ADMIN only ──────────────
async function requireSuperAdmin(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '');
  if (!token) {
    return { error: NextResponse.json({ error: 'Authentication required' }, { status: 401 }) };
  }
  const payload = verifyToken(token);
  if (!payload) {
    return { error: NextResponse.json({ error: 'Invalid token' }, { status: 401 }) };
  }
  if (payload.role !== 'SUPER_ADMIN') {
    return { error: NextResponse.json({ error: 'Super Admin access required' }, { status: 403 }) };
  }
  return { payload };
}

// ═══════════════════════════════════════════════════════════
// GET — List all users with optional filters & pagination
// ═══════════════════════════════════════════════════════════
export async function GET(req: NextRequest) {
  try {
    const auth = await requireSuperAdmin(req);
    if ('error' in auth) return auth.error;

    const { searchParams } = new URL(req.url);
    const role = searchParams.get('role') || undefined;
    const status = searchParams.get('status') || undefined;
    const search = searchParams.get('search') || undefined;
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10) || 20));

    // Build where clause with filters
    const where: Record<string, unknown> = {};
    if (role && VALID_ROLES.includes(role as typeof VALID_ROLES[number])) {
      where.role = role;
    }
    if (status && VALID_STATUSES.includes(status as typeof VALID_STATUSES[number])) {
      where.status = status;
    }
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { email: { contains: search } },
      ];
    }

    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      db.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          verified: true,
          status: true,
          avatar: true,
          batch: true,
          department: true,
          lastLogin: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      db.user.count({ where }),
    ]);

    return NextResponse.json({
      users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Admin users list error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ═══════════════════════════════════════════════════════════
// PUT — Update user (role, verified, status, name)
// ═══════════════════════════════════════════════════════════
export async function PUT(req: NextRequest) {
  try {
    const auth = await requireSuperAdmin(req);
    if ('error' in auth) return auth.error;

    const body = await req.json();
    const { userId, role, verified, status, name } = body;

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Cannot modify own role
    if (userId === auth.payload.userId && role !== undefined) {
      return NextResponse.json({ error: 'Cannot change your own role' }, { status: 403 });
    }

    // Validate role value if provided
    if (role !== undefined && !VALID_ROLES.includes(role)) {
      return NextResponse.json(
        { error: `Invalid role. Must be one of: ${VALID_ROLES.join(', ')}` },
        { status: 400 },
      );
    }

    // Validate status value if provided
    if (status !== undefined && !VALID_STATUSES.includes(status)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}` },
        { status: 400 },
      );
    }

    // Validate verified value if provided
    if (verified !== undefined && typeof verified !== 'boolean') {
      return NextResponse.json({ error: 'Verified must be a boolean' }, { status: 400 });
    }

    // Validate name if provided
    if (name !== undefined && (typeof name !== 'string' || name.trim().length === 0)) {
      return NextResponse.json({ error: 'Name must be a non-empty string' }, { status: 400 });
    }

    // Build update data
    const updateData: Record<string, unknown> = {};
    if (role !== undefined) updateData.role = role;
    if (verified !== undefined) updateData.verified = verified;
    if (status !== undefined) updateData.status = status;
    if (name !== undefined) updateData.name = name.trim();

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    // Check user exists
    const existingUser = await db.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });

    if (!existingUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const updatedUser = await db.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        verified: true,
        status: true,
        avatar: true,
        batch: true,
        department: true,
        lastLogin: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({ user: updatedUser });
  } catch (error) {
    console.error('Admin user update error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
