import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/jwt';
import { db } from '@/lib/db';

// GET /api/books/saved — List user's saved books
export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload || !payload.userId) {
      return NextResponse.json({ success: false, error: 'Invalid token' }, { status: 401 });
    }

    const savedBooks = await db.savedBook.findMany({
      where: { userId: payload.userId },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ success: true, books: savedBooks });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Saved Books GET Error]', msg);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

// POST /api/books/saved — Save a book
export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload || !payload.userId) {
      return NextResponse.json({ success: false, error: 'Invalid token' }, { status: 401 });
    }

    const body = await req.json();
    const { bookId, title, authors, coverUrl, category, language, description, infoLink, pdfLink } = body;

    if (!bookId || !title) {
      return NextResponse.json({ success: false, error: 'bookId and title are required' }, { status: 400 });
    }

    const saved = await db.savedBook.upsert({
      where: { userId_bookId: { userId: payload.userId, bookId } },
      create: {
        userId: payload.userId,
        bookId,
        title,
        authors: authors || 'Unknown Author',
        coverUrl: coverUrl || null,
        category: category || null,
        language: language || 'en',
        description: description || null,
        infoLink: infoLink || null,
        pdfLink: pdfLink || null,
      },
      update: {},
    });

    return NextResponse.json({ success: true, book: saved });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Saved Books POST Error]', msg);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

// DELETE /api/books/saved — Remove a saved book
export async function DELETE(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload || !payload.userId) {
      return NextResponse.json({ success: false, error: 'Invalid token' }, { status: 401 });
    }

    const { searchParams } = req.nextUrl;
    const bookId = searchParams.get('bookId');
    if (!bookId) {
      return NextResponse.json({ success: false, error: 'bookId is required' }, { status: 400 });
    }

    await db.savedBook.deleteMany({
      where: { userId: payload.userId, bookId },
    });

    return NextResponse.json({ success: true, message: 'Book removed from saved list' });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Saved Books DELETE Error]', msg);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
