import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyToken } from '@/lib/jwt';
import { apiCache, CACHE_TTL } from '@/lib/api-cache';

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const payload = verifyToken(token);
    if (!payload) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });

    // Check cache
    const cacheKey = `subjects:${payload.userId}`;
    const cached = apiCache.get(cacheKey);
    if (cached) return NextResponse.json(cached);

    const subjects = await db.subject.findMany({
      include: {
        teacher: {
          select: { id: true, name: true, email: true },
        },
        _count: {
          select: { assignments: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    apiCache.set(cacheKey, subjects, CACHE_TTL.SUBJECTS);
    return NextResponse.json(subjects);
  } catch (error) {
    console.error('Get subjects error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const payload = verifyToken(token);
    if (!payload) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });

    if (!['TEACHER', 'ADMIN', 'CR'].includes(payload.role || '')) {
      return NextResponse.json({ error: 'Only teachers and admins can create subjects' }, { status: 403 });
    }

    const body = await req.json();
    const { name, code, batch } = body;

    if (!name?.trim() || !code?.trim()) {
      return NextResponse.json({ error: 'Subject name and code are required' }, { status: 400 });
    }

    // Check for duplicate code
    const existing = await db.subject.findUnique({ where: { code: code.trim().toUpperCase() } });
    if (existing) {
      return NextResponse.json({ error: 'A subject with this code already exists' }, { status: 409 });
    }

    const subject = await db.subject.create({
      data: {
        name: name.trim(),
        code: code.trim().toUpperCase(),
        teacherId: payload.userId,
        batch: batch?.trim() || null,
      },
      include: {
        teacher: { select: { id: true, name: true, email: true } },
        _count: { select: { assignments: true } },
      },
    });

    return NextResponse.json(subject, { status: 201 });
  } catch (error) {
    console.error('Create subject error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
