import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyToken } from '@/lib/jwt';

// GET /api/cq/profile — Get CodeQuest profile
export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const payload = verifyToken(token);
    if (!payload) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });

    let profile = await db.cQProfile.findUnique({
      where: { userId: payload.userId },
    });

    if (!profile) {
      profile = await db.cQProfile.create({
        data: { userId: payload.userId },
      });
    }

    // Check streak
    const today = new Date().toISOString().split('T')[0];
    if (profile.lastActiveDate && profile.lastActiveDate !== today) {
      const lastDate = new Date(profile.lastActiveDate + 'T00:00:00');
      const todayDate = new Date(today + 'T00:00:00');
      const diffDays = Math.floor((todayDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays > 1) {
        await db.cQProfile.update({
          where: { userId: payload.userId },
          data: { dailyStreak: 0 },
        });
        profile.dailyStreak = 0;
      }
    }

    return NextResponse.json({ profile });
  } catch (error) {
    console.error('CQ profile GET error:', error);
    return NextResponse.json({ error: 'Failed to load profile' }, { status: 500 });
  }
}

// POST /api/cq/profile — Update CodeQuest profile
// Body: { xpGained?, battlesWon?, battlesLost?, lessonsCompleted?, questionsAnswered?, correctAnswers?, miniGamesPlayed?, avatar?, title? }
export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const payload = verifyToken(token);
    if (!payload) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });

    const body = await req.json();
    const {
      xpGained = 0, battlesWon = 0, battlesLost = 0,
      lessonsCompleted = 0, questionsAnswered = 0, correctAnswers = 0,
      miniGamesPlayed = 0, avatar, title,
    } = body;

    const today = new Date().toISOString().split('T')[0];

    const existing = await db.cQProfile.findUnique({
      where: { userId: payload.userId },
    });

    if (!existing) {
      const profile = await db.cQProfile.create({
        data: {
          userId: payload.userId,
          totalXP: xpGained,
          dailyStreak: 1,
          bestStreak: 1,
          battlesWon,
          battlesLost,
          lessonsCompleted,
          questionsAnswered,
          correctAnswers,
          miniGamesPlayed,
          avatar: avatar || null,
          title: title || 'Code Novice',
          lastActiveDate: today,
        },
      });
      return NextResponse.json({ profile });
    }

    // Streak logic
    let newStreak = existing.dailyStreak;
    if (existing.lastActiveDate === today) {
      newStreak = existing.dailyStreak;
    } else if (!existing.lastActiveDate) {
      newStreak = 1;
    } else {
      const lastDate = new Date(existing.lastActiveDate + 'T00:00:00');
      const todayDate = new Date(today + 'T00:00:00');
      const diffDays = Math.floor((todayDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
      newStreak = diffDays === 1 ? existing.dailyStreak + 1 : 1;
    }

    const newTotalXP = existing.totalXP + xpGained;
    const newBestStreak = Math.max(existing.bestStreak, newStreak);

    // Calculate level from XP
    const levelThresholds = [0, 100, 250, 500, 800, 1200, 1700, 2300, 3000, 4000, 5200, 6500, 8000, 10000, 12500, 15000, 18000, 22000, 27000, 35000];
    let newLevel = 1;
    for (let i = levelThresholds.length - 1; i >= 0; i--) {
      if (newTotalXP >= levelThresholds[i]) { newLevel = i + 1; break; }
    }

    const titles = ['Code Novice', 'Code Apprentice', 'Script Kiddie', 'Code Padawan', 'Junior Developer', 'Code Warrior', 'Problem Solver', 'Senior Coder', 'Algorithms Master', 'System Architect', 'Tech Lead', 'Full Stack Expert', 'Open Source Hero', 'AI Integrator', 'Cloud Architect', 'DevOps Ninja', 'Security Expert', 'Principal Engineer', 'Distinguished Engineer', 'Legendary Coder'];

    const profile = await db.cQProfile.update({
      where: { userId: payload.userId },
      data: {
        totalXP: newTotalXP,
        level: newLevel,
        currentLevelXP: xpGained > 0 ? newTotalXP - levelThresholds[newLevel - 1] : existing.currentLevelXP,
        xpToNextLevel: newLevel < 20 ? levelThresholds[newLevel] - newTotalXP : 0,
        dailyStreak: newStreak,
        bestStreak: newBestStreak,
        battlesWon: existing.battlesWon + battlesWon,
        battlesLost: existing.battlesLost + battlesLost,
        totalBattles: existing.totalBattles + battlesWon + battlesLost,
        lessonsCompleted: existing.lessonsCompleted + lessonsCompleted,
        questionsAnswered: existing.questionsAnswered + questionsAnswered,
        correctAnswers: existing.correctAnswers + correctAnswers,
        miniGamesPlayed: existing.miniGamesPlayed + miniGamesPlayed,
        title: title || titles[Math.min(newLevel - 1, titles.length - 1)],
        avatar: avatar !== undefined ? avatar : existing.avatar,
        lastActiveDate: today,
      },
    });

    return NextResponse.json({ profile });
  } catch (error) {
    console.error('CQ profile POST error:', error);
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
  }
}
