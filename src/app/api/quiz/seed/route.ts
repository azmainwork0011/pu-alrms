import { NextResponse } from 'next/server';
import { seedQuizData } from '@/lib/seed-quiz';

export async function POST() {
  try {
    await seedQuizData();
    return NextResponse.json({ success: true, message: 'Quiz data seeded' });
  } catch (error) {
    console.error('Seed error:', error);
    return NextResponse.json({ error: 'Failed to seed' }, { status: 500 });
  }
}
