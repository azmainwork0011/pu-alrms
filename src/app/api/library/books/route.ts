import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/library/books — Fetch books with search, category filter, sort
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const search = searchParams.get('search')?.trim() || '';
    const category = searchParams.get('category') || '';
    const sort = searchParams.get('sort') || 'newest'; // newest, popular, title, author
    const featured = searchParams.get('featured') === 'true';
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(50, Math.max(6, parseInt(searchParams.get('limit') || '24', 10)));

    // Build where clause
    const where: Record<string, unknown> = { isActive: true };

    if (category) {
      where.category = category.toUpperCase();
    }

    if (search) {
      where.OR = [
        { title: { contains: search } },
        { author: { contains: search } },
        { description: { contains: search } },
        { subcategory: { contains: search } },
      ];
    }

    if (featured) {
      where.featured = true;
    }

    // Build orderBy
    let orderBy: Record<string, string> = { createdAt: 'desc' };
    switch (sort) {
      case 'popular': orderBy = { downloads: 'desc' }; break;
      case 'title': orderBy = { title: 'asc' }; break;
      case 'author': orderBy = { author: 'asc' }; break;
      case 'oldest': orderBy = { createdAt: 'asc' }; break;
      default: orderBy = { createdAt: 'desc' };
    }

    const skip = (page - 1) * limit;

    const [books, total] = await Promise.all([
      db.libraryBook.findMany({
        where,
        orderBy,
        skip,
        take: limit,
      }),
      db.libraryBook.count({ where }),
    ]);

    // Get category stats
    const categoryStats = await db.libraryBook.groupBy({
      by: ['category'],
      where: { isActive: true },
      _count: { category: true },
    });

    const statsMap: Record<string, number> = {};
    categoryStats.forEach((s) => { statsMap[s.category] = s._count.category; });

    return NextResponse.json({
      success: true,
      books,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      categoryStats: statsMap,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Library Books GET Error]', msg);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
