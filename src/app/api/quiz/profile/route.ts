import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyToken } from '@/lib/jwt';

// GET /api/quiz/profile — Get user's quiz profile (streaks, XP, stats)
export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const payload = verifyToken(token);
    if (!payload) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });

    let profile = await db.quizProfile.findUnique({
      where: { userId: payload.userId },
    });

    // Auto-create profile if it doesn't exist
    if (!profile) {
      profile = await db.quizProfile.create({
        data: { userId: payload.userId },
      });
    }

    // Check if streak needs to be reset (new day, didn't play yesterday)
    const today = new Date().toISOString().split('T')[0];
    if (profile.lastQuizDate && profile.lastQuizDate !== today) {
      const lastDate = new Date(profile.lastQuizDate + 'T00:00:00');
      const todayDate = new Date(today + 'T00:00:00');
      const diffDays = Math.floor((todayDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays > 1) {
        // Streak broken — reset to 0
        await db.quizProfile.update({
          where: { userId: payload.userId },
          data: { dailyStreak: 0 },
        });
        profile.dailyStreak = 0;
      }
    }

    return NextResponse.json({
      profile: {
        totalXP: profile.totalXP,
        dailyStreak: profile.dailyStreak,
        bestStreak: profile.bestStreak,
        totalQuizzes: profile.totalQuizzes,
        totalCorrect: profile.totalCorrect,
        totalQuestions: profile.totalQuestions,
        lastQuizDate: profile.lastQuizDate,
      },
    });
  } catch (error) {
    console.error('Quiz profile GET error:', error);
    return NextResponse.json({ error: 'Failed to load profile' }, { status: 500 });
  }
}

// POST /api/quiz/profile — Update quiz profile after completing a quiz
// Body: { xpGained: number, correctCount: number, totalQuestions: number }
export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const payload = verifyToken(token);
    if (!payload) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });

    const body = await req.json();
    const { xpGained = 0, correctCount = 0, totalQuestions = 0 } = body;

    const today = new Date().toISOString().split('T')[0];

    // Upsert the profile
    const existing = await db.quizProfile.findUnique({
      where: { userId: payload.userId },
    });

    if (!existing) {
      // First time — create with streak = 1
      const profile = await db.quizProfile.create({
        data: {
          userId: payload.userId,
          totalXP: xpGained,
          dailyStreak: 1,
          bestStreak: 1,
          totalQuizzes: 1,
          totalCorrect: correctCount,
          totalQuestions: totalQuestions,
          lastQuizDate: today,
        },
      });

      return NextResponse.json({
        profile: {
          totalXP: profile.totalXP,
          dailyStreak: profile.dailyStreak,
          bestStreak: profile.bestStreak,
          totalQuizzes: profile.totalQuizzes,
          totalCorrect: profile.totalCorrect,
          totalQuestions: profile.totalQuestions,
          lastQuizDate: profile.lastQuizDate,
          streakUpdated: true,
          newStreak: 1,
        },
      });
    }

    // Check streak logic
    let newStreak = existing.dailyStreak;
    let streakUpdated = false;

    if (existing.lastQuizDate === today) {
      // Already played today — no streak change
      newStreak = existing.dailyStreak;
    } else if (!existing.lastQuizDate) {
      // First quiz ever — start streak at 1
      newStreak = 1;
      streakUpdated = true;
    } else {
      const lastDate = new Date(existing.lastQuizDate + 'T00:00:00');
      const todayDate = new Date(today + 'T00:00:00');
      const diffDays = Math.floor((todayDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        // Consecutive day — increment streak
        newStreak = existing.dailyStreak + 1;
      } else if (diffDays > 1) {
        // Streak broken — restart
        newStreak = 1;
      } else {
        // Same day (shouldn't happen due to check above) or future (clock issues)
        newStreak = existing.dailyStreak;
      }
      streakUpdated = true;
    }

    const newBestStreak = Math.max(existing.bestStreak, newStreak);

    const profile = await db.quizProfile.update({
      where: { userId: payload.userId },
      data: {
        totalXP: existing.totalXP + xpGained,
        dailyStreak: newStreak,
        bestStreak: newBestStreak,
        totalQuizzes: existing.totalQuizzes + 1,
        totalCorrect: existing.totalCorrect + correctCount,
        totalQuestions: existing.totalQuestions + totalQuestions,
        lastQuizDate: today,
      },
    });

    return NextResponse.json({
      profile: {
        totalXP: profile.totalXP,
        dailyStreak: profile.dailyStreak,
        bestStreak: profile.bestStreak,
        totalQuizzes: profile.totalQuizzes,
        totalCorrect: profile.totalCorrect,
        totalQuestions: profile.totalQuestions,
        lastQuizDate: profile.lastQuizDate,
        streakUpdated,
        newStreak,
      },
    });
  } catch (error) {
    console.error('Quiz profile POST error:', error);
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
  }
}
