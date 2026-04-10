import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyToken } from '@/lib/jwt';

// GET /api/quiz/questions?categoryId=xxx&count=10 — Get random questions for a quiz
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const categoryId = searchParams.get('categoryId');
    const count = parseInt(searchParams.get('count') || '10', 10);

    if (!categoryId) {
      return NextResponse.json({ error: 'Category ID is required' }, { status: 400 });
    }

    // Get all questions for this category, then randomize
    const allQuestions = await db.quizQuestion.findMany({
      where: { categoryId },
    });

    if (allQuestions.length === 0) {
      return NextResponse.json({ error: 'No questions available for this category' }, { status: 404 });
    }

    // Shuffle and take the requested count
    const shuffled = allQuestions.sort(() => Math.random() - 0.5);
    const questions = shuffled.slice(0, Math.min(count, shuffled.length));

    // Increment timesPlayed
    await db.quizQuestion.updateMany({
      where: { id: { in: questions.map(q => q.id) } },
      data: { timesPlayed: { increment: 1 } },
    });

    // Include correctOption so the client can show correct/wrong feedback
    const safeQuestions = questions.map(q => ({
      id: q.id,
      question: q.question,
      optionA: q.optionA,
      optionB: q.optionB,
      optionC: q.optionC,
      optionD: q.optionD,
      correctOption: q.correctOption,
      difficulty: q.difficulty,
      points: q.points,
    }));

    return NextResponse.json({
      questions: safeQuestions,
      total: allQuestions.length,
      selected: safeQuestions.length,
    });
  } catch (error) {
    console.error('Quiz questions error:', error);
    return NextResponse.json({ error: 'Failed to load questions' }, { status: 500 });
  }
}

// POST /api/quiz/questions — Submit quiz answers (TEACHER/ADMIN: create; STUDENT: submit)
export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const payload = verifyToken(token);
    if (!payload) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });

    const body = await req.json();
    const { action } = body;

    // ── Action: submit (student submits quiz answers) ──────────────
    if (action === 'submit') {
      const { categoryId, answers, timeTaken } = body;

      if (!categoryId || !answers || !Array.isArray(answers)) {
        return NextResponse.json({ error: 'Invalid submission data' }, { status: 400 });
      }

      // Get all questions with correct answers
      const questions = await db.quizQuestion.findMany({
        where: { id: { in: answers.map((a: any) => a.questionId) } },
      });

      const questionMap = new Map(questions.map(q => [q.id, q]));

      let correctCount = 0;
      let totalPoints = 0;
      const gradedAnswers = answers.map((a: any) => {
        const q = questionMap.get(a.questionId);
        const isCorrect = q && a.selectedOption === q.correctOption;
        if (isCorrect) {
          correctCount++;
          totalPoints += q?.points || 10;
          // Increment timesCorrect
          if (q) {
            db.quizQuestion.update({
              where: { id: q.id },
              data: { timesCorrect: { increment: 1 } },
            }).catch(() => {});
          }
        }
        return {
          questionId: a.questionId,
          selectedOption: a.selectedOption,
          isCorrect,
        };
      });

      const accuracy = answers.length > 0 ? (correctCount / answers.length) * 100 : 0;
      const maxPossible = questions.reduce((sum, q) => sum + q.points, 0);

      // Save attempt
      const attempt = await db.quizAttempt.create({
        data: {
          userId: payload.userId,
          categoryId,
          score: totalPoints,
          totalPoints: maxPossible,
          correctCount,
          totalQuestions: answers.length,
          timeTaken: timeTaken || 0,
          accuracy: Math.round(accuracy * 100) / 100,
          answers: JSON.stringify(gradedAnswers),
        },
      });

      return NextResponse.json({
        attempt: {
          id: attempt.id,
          score: totalPoints,
          totalPoints: maxPossible,
          correctCount,
          totalQuestions: answers.length,
          accuracy: attempt.accuracy,
          timeTaken: attempt.timeTaken,
        },
        answers: gradedAnswers,
      });
    }

    // ── Action: create (teacher/admin creates questions) ───────────
    if (payload.role !== 'TEACHER' && payload.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Only teachers and admins can create questions' }, { status: 403 });
    }

    const { categoryId, question, optionA, optionB, optionC, optionD, correctOption, explanation, difficulty, points } = body;

    if (!categoryId || !question || !optionA || !optionB || !optionC || !optionD || !correctOption) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
    }

    const q = await db.quizQuestion.create({
      data: {
        categoryId,
        question,
        optionA,
        optionB,
        optionC,
        optionD,
        correctOption,
        explanation: explanation || null,
        difficulty: difficulty || 'MEDIUM',
        points: points || 10,
      },
    });

    // Update category question count
    await db.quizCategory.update({
      where: { id: categoryId },
      data: { questionCount: { increment: 1 } },
    });

    return NextResponse.json({ question: q }, { status: 201 });
  } catch (error) {
    console.error('Quiz questions POST error:', error);
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
  }
}
