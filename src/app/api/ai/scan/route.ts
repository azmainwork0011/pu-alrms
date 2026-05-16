import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/jwt';
import { getZAI } from '@/lib/zai';
import { checkRateLimit, getClientIp } from '@/lib/security/rate-limit';

const scanLimiter = { windowMs: 60_000, max: 10, keyPrefix: 'scan' };

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    const payload = verifyToken(token);
    if (!payload) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });

    const ip = getClientIp(req);
    const rl = checkRateLimit(`${ip}:${payload.userId}`, scanLimiter);
    if (!rl.allowed) return NextResponse.json({ error: 'Too many scans. Wait a moment.' }, { status: 429 });

    const { image, question } = await req.json();
    if (!image || !question) return NextResponse.json({ error: 'Provide both image and question.' }, { status: 400 });
    if (!image.startsWith('data:image/')) return NextResponse.json({ error: 'Unsupported image format.' }, { status: 400 });

    // Single call — no retries
    const zai = await getZAI();
    const completion = await zai.chat.completions.createVision({
      model: 'vision',
      messages: [
        { role: 'assistant', content: 'You are an expert academic AI teacher. Analyze images thoroughly. Use markdown formatting. Be precise and educational.' },
        {
          role: 'user',
          content: [
            { type: 'text', text: `Analyze this image and answer: ${question}\n\n1. **Description** — What do you see?\n2. **Answer** — Step-by-step answer\n3. **Context** — Related concepts` },
            { type: 'image_url', image_url: { url: image } },
          ],
        },
      ],
      thinking: { type: 'disabled' },
    });

    const response = completion?.choices?.[0]?.message?.content;
    if (response && response.trim().length > 0) {
      return NextResponse.json({ response });
    }

    return NextResponse.json({ response: 'I couldn\'t analyze this image clearly. Please try with a clearer image or rephrase your question.' });
  } catch (error: any) {
    console.error('[AI Scan] Error:', error?.message || error);
    return NextResponse.json({ error: 'Image analysis failed. Try again.' }, { status: 500 });
  }
}
