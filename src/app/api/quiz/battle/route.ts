import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyToken } from '@/lib/jwt';

// GET /api/quiz/battle — List open battle rooms or user's battle history
export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const payload = verifyToken(token);
    if (!payload) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type') || 'waiting';

    if (type === 'waiting') {
      // List open battle rooms waiting for players
      const rooms = await db.battleRoom.findMany({
        where: {
          status: 'WAITING',
          player1Id: { not: payload.userId },
        },
        include: {
          player1: { select: { id: true, name: true, avatar: true, batch: true, department: true } },
          category: { select: { id: true, name: true, department: true, icon: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 20,
      });

      return NextResponse.json({ rooms });
    }

    // User's battle history
    const rooms = await db.battleRoom.findMany({
      where: {
        OR: [
          { player1Id: payload.userId },
          { player2Id: payload.userId },
        ],
      },
      include: {
        player1: { select: { id: true, name: true, avatar: true } },
        player2: { select: { id: true, name: true, avatar: true } },
        category: { select: { id: true, name: true, icon: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    return NextResponse.json({ rooms });
  } catch (error) {
    console.error('Battle list error:', error);
    return NextResponse.json({ error: 'Failed to load battles' }, { status: 500 });
  }
}

// POST /api/quiz/battle — Create a battle room, join one, or get battle questions
export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const payload = verifyToken(token);
    if (!payload) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });

    const body = await req.json();
    const { action, battleRoomId, categoryId } = body;

    // ── Action: create (create a new battle room) ────────────────
    if (action === 'create') {
      // Check if user already has a waiting room
      const existing = await db.battleRoom.findFirst({
        where: {
          player1Id: payload.userId,
          status: 'WAITING',
        },
      });

      if (existing) {
        return NextResponse.json({ error: 'You already have a waiting battle room', room: existing }, { status: 409 });
      }

      const room = await db.battleRoom.create({
        data: {
          player1Id: payload.userId,
          categoryId: categoryId || null,
          status: 'WAITING',
          totalQuestions: 10,
          timePerQuestion: 15,
        },
        include: {
          player1: { select: { id: true, name: true, avatar: true, batch: true, department: true } },
          category: { select: { id: true, name: true, icon: true } },
        },
      });

      return NextResponse.json({ room }, { status: 201 });
    }

    // ── Action: join (join an existing battle room) ──────────────
    if (action === 'join') {
      if (!battleRoomId) {
        return NextResponse.json({ error: 'Battle room ID is required' }, { status: 400 });
      }

      const room = await db.battleRoom.findUnique({ where: { id: battleRoomId } });

      if (!room || room.status !== 'WAITING') {
        return NextResponse.json({ error: 'Battle room is not available' }, { status: 404 });
      }

      if (room.player1Id === payload.userId) {
        return NextResponse.json({ error: 'Cannot join your own room' }, { status: 400 });
      }

      const updated = await db.battleRoom.update({
        where: { id: battleRoomId },
        data: {
          player2Id: payload.userId,
          status: 'IN_PROGRESS',
        },
        include: {
          player1: { select: { id: true, name: true, avatar: true } },
          player2: { select: { id: true, name: true, avatar: true } },
          category: { select: { id: true, name: true, icon: true } },
        },
      });

      return NextResponse.json({ room: updated });
    }

    // ── Action: complete (finish a battle) ───────────────────────
    if (action === 'complete') {
      const { player1Score, player2Score, player1Correct, player2Correct, winnerId } = body;

      const room = await db.battleRoom.findUnique({ where: { id: battleRoomId } });

      if (!room) {
        return NextResponse.json({ error: 'Battle room not found' }, { status: 404 });
      }

      // Only players in the room can complete it
      if (room.player1Id !== payload.userId && room.player2Id !== payload.userId) {
        return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
      }

      const updated = await db.battleRoom.update({
        where: { id: battleRoomId },
        data: {
          player1Score: player1Score || 0,
          player2Score: player2Score || 0,
          player1Correct: player1Correct || 0,
          player2Correct: player2Correct || 0,
          winnerId: winnerId || null,
          status: 'COMPLETED',
          completedAt: new Date(),
        },
      });

      return NextResponse.json({ room: updated });
    }

    // ── Action: get-questions (fetch questions with answers for battle) ──
    if (action === 'get-questions') {
      const { count } = body;
      const questionCount = Math.min(count || 10, 10);

      let queryWhere: any = {};

      // If room exists, filter by its category
      if (battleRoomId) {
        const room = await db.battleRoom.findUnique({
          where: { id: battleRoomId },
          include: { category: true },
        });
        if (room?.categoryId) {
          queryWhere = { categoryId: room.categoryId };
        }
      } else if (categoryId) {
        queryWhere = { categoryId };
      }

      const allQuestions = await db.quizQuestion.findMany({
        where: queryWhere,
      });

      if (allQuestions.length === 0) {
        return NextResponse.json({ error: 'No questions available' }, { status: 404 });
      }

      // Shuffle and take the requested count
      const shuffled = allQuestions.sort(() => Math.random() - 0.5);
      const questions = shuffled.slice(0, Math.min(questionCount, shuffled.length));

      // Return questions WITH correctOption for battle mode
      const battleQuestions = questions.map(q => ({
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
        questions: battleQuestions,
        total: allQuestions.length,
        selected: battleQuestions.length,
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Battle POST error:', error);
    return NextResponse.json({ error: 'Failed to process battle' }, { status: 500 });
  }
}
