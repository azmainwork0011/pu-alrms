import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyToken } from '@/lib/jwt';

// POST /api/quiz/attempt — Submit a quiz attempt
// Body: { categoryId, score, totalPoints, correctCount, totalQuestions, accuracy, timeTaken }
export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const payload = verifyToken(token);
    if (!payload) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });

    const body = await req.json();
    const { categoryId, score = 0, totalPoints = 0, correctCount = 0, totalQuestions = 0, accuracy = 0, timeTaken = 0 } = body;

    if (!categoryId) {
      return NextResponse.json({ error: 'categoryId is required' }, { status: 400 });
    }

    // Verify category exists
    const category = await db.quizCategory.findUnique({
      where: { id: categoryId },
    });
    if (!category) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }

    const attempt = await db.quizAttempt.create({
      data: {
        userId: payload.userId,
        categoryId,
        score,
        totalPoints,
        correctCount,
        totalQuestions,
        accuracy,
        timeTaken,
      },
      include: {
        category: {
          select: { id: true, name: true },
        },
      },
    });

    return NextResponse.json({ attempt }, { status: 201 });
  } catch (error) {
    console.error('Quiz attempt POST error:', error);
    return NextResponse.json({ error: 'Failed to submit attempt' }, { status: 500 });
  }
}
