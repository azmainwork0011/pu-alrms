import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyToken } from '@/lib/jwt';

// GET /api/quiz/categories — List all quiz categories, optionally filtered by department
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const department = searchParams.get('department');

    const categories = await db.quizCategory.findMany({
      where: {
        ...(department ? { department } : {}),
        isActive: true,
      },
      include: {
        _count: { select: { questions: true } },
      },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({
      categories: categories.map(c => ({
        id: c.id,
        name: c.name,
        department: c.department,
        icon: c.icon,
        description: c.description,
        difficulty: c.difficulty,
        questionCount: c._count.questions,
      })),
    });
  } catch (error) {
    console.error('Quiz categories error:', error);
    return NextResponse.json({ error: 'Failed to load categories' }, { status: 500 });
  }
}

// POST /api/quiz/categories — Create quiz category (TEACHER/ADMIN only)
export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const payload = verifyToken(token);
    if (!payload) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });

    if (payload.role !== 'TEACHER' && payload.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Only teachers and admins can create categories' }, { status: 403 });
    }

    const body = await req.json();
    const { name, department, icon, description, difficulty } = body;

    if (!name || !department) {
      return NextResponse.json({ error: 'Name and department are required' }, { status: 400 });
    }

    const category = await db.quizCategory.create({
      data: {
        name,
        department,
        icon: icon || '📚',
        description: description || null,
        difficulty: difficulty || 'MEDIUM',
      },
    });

    return NextResponse.json({ category }, { status: 201 });
  } catch (error) {
    console.error('Create quiz category error:', error);
    return NextResponse.json({ error: 'Failed to create category' }, { status: 500 });
  }
}
