import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/jwt';
import { getZAI } from '@/lib/zai';
import { checkRateLimit, getClientIp } from '@/lib/security/rate-limit';

const searchLimiter = { windowMs: 60_000, max: 15, keyPrefix: 'search' };

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    const payload = verifyToken(token);
    if (!payload) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });

    const ip = getClientIp(req);
    const rl = checkRateLimit(`${ip}:${payload.userId}`, searchLimiter);
    if (!rl.allowed) {
      return NextResponse.json({
        error: 'Too many search requests. Please wait a moment.',
        retryAfterMs: rl.retryAfterMs,
      }, { status: 429 });
    }

    const { query, num = 8 } = await req.json();
    if (!query || typeof query !== 'string' || query.trim().length < 2) {
      return NextResponse.json({ error: 'Please enter a valid search query.' }, { status: 400 });
    }

    const zai = await getZAI();
    const results = await zai.functions.invoke('web_search', {
      query: query.trim(),
      num: Math.min(num, 10),
    });

    const formatted = (results || []).slice(0, 8).map((item: any, i: number) => ({
      position: i + 1,
      title: item.name || 'Untitled',
      url: item.url || '#',
      snippet: item.snippet || '',
      domain: item.host_name || '',
      date: item.date || '',
    }));

    return NextResponse.json({
      success: true,
      query: query.trim(),
      results: formatted,
      totalResults: formatted.length,
    });
  } catch (error: any) {
    console.error('[AI Search] Error:', error?.message || error);
    return NextResponse.json({
      error: 'Search failed. Please try again.',
    }, { status: 500 });
  }
}
