import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Returns all unique batches from both users and subjects
export async function GET() {
  try {
    // Get unique batches from users
    const userBatches = await db.user.findMany({
      where: { batch: { not: null } },
      select: { batch: true },
      distinct: ['batch'],
      orderBy: { batch: 'asc' },
    });

    // Get unique batches from subjects
    const subjectBatches = await db.subject.findMany({
      where: { batch: { not: null } },
      select: { batch: true },
      distinct: ['batch'],
      orderBy: { batch: 'asc' },
    });

    // Combine and deduplicate
    const allBatches = new Set<string>();
    userBatches.forEach((u) => { if (u.batch) allBatches.add(u.batch); });
    subjectBatches.forEach((s) => { if (s.batch) allBatches.add(s.batch); });

    // Add some default batches if none exist
    if (allBatches.size === 0) {
      ['CSE-66', 'CSE-67', 'CSE-68', 'EEE-66', 'BBA-66'].forEach(b => allBatches.add(b));
    }

    return NextResponse.json(
      Array.from(allBatches).map(b => ({ value: b, label: b }))
    );
  } catch (error) {
    console.error('Get batches error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
