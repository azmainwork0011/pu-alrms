import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/jwt';
import { getZAI } from '@/lib/zai';
import { checkRateLimit, getClientIp } from '@/lib/security/rate-limit';

const imageLimiter = { windowMs: 60_000, max: 5, keyPrefix: 'img-gen' };

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    const payload = verifyToken(token);
    if (!payload) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });

    const ip = getClientIp(req);
    const rl = checkRateLimit(`${ip}:${payload.userId}`, imageLimiter);
    if (!rl.allowed) return NextResponse.json({ error: '5 images per minute limit. Wait a moment.' }, { status: 429 });

    const { prompt } = await req.json();
    if (!prompt || typeof prompt !== 'string' || prompt.trim().length < 3) {
      return NextResponse.json({ error: 'Describe what image you want.' }, { status: 400 });
    }

    // Single call — no retries
    const zai = await getZAI();
    const response = await zai.images.generations.create({
      prompt: `High quality illustration: ${prompt.trim()}. Clean, modern, vibrant.`,
      size: '1024x1024',
    });

    const imageData = response?.data?.[0];
    if (!imageData) throw new Error('No image data');

    let imageUrl: string;
    if (imageData.base64) imageUrl = `data:image/png;base64,${imageData.base64}`;
    else if (imageData.url) imageUrl = imageData.url;
    else if ((imageData as any).b64_json) imageUrl = `data:image/png;base64,${(imageData as any).b64_json}`;
    else throw new Error('Unexpected format');

    return NextResponse.json({ image: imageUrl, prompt });
  } catch (error: any) {
    console.error('[AI Image Gen] Error:', error?.message || error);
    return NextResponse.json({ error: 'Image generation failed. Try a simpler description.' }, { status: 500 });
  }
}
