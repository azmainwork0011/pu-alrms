import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/jwt';
import { getZAI } from '@/lib/zai';
import { checkRateLimit, getClientIp } from '@/lib/security/rate-limit';

// ═══════════════════════════════════════════════════════════════════
// AI IMAGE GENERATION
// Bulletproof image generation — NEVER returns generic errors.
// ═══════════════════════════════════════════════════════════════════

const imageLimiter = { windowMs: 60_000, max: 5, keyPrefix: 'img-gen' };

export async function POST(req: NextRequest) {
  try {
    // ── Auth ──
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    const payload = verifyToken(token);
    if (!payload) return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });

    // ── Rate Limit ──
    const ip = getClientIp(req);
    const rl = checkRateLimit(`${ip}:${payload.userId}`, imageLimiter);
    if (!rl.allowed) {
      return NextResponse.json({
        error: 'Image generation is limited to 5 per minute. Please wait before generating more.',
        retryAfterMs: rl.retryAfterMs,
      }, { status: 429 });
    }

    const { prompt } = await req.json();

    if (!prompt || typeof prompt !== 'string' || prompt.trim().length < 3) {
      return NextResponse.json({
        error: "I couldn't understand your image request. Please describe what you'd like me to generate in more detail.",
      }, { status: 400 });
    }

    // Enhance prompt with quality instructions
    const enhancedPrompt = `High quality, detailed, professional illustration: ${prompt.trim()}. Clean, modern style, well-composed, vibrant colors, sharp focus.`;

    let lastError: any;

    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const zai = await getZAI();
        const response = await zai.images.generations.create({
          prompt: enhancedPrompt,
          size: '1024x1024',
        });

        const imageData = response?.data?.[0];
        if (!imageData) throw new Error('No image data in response');

        let imageUrl: string;
        if (imageData.base64) {
          imageUrl = `data:image/png;base64,${imageData.base64}`;
        } else if (imageData.url) {
          imageUrl = imageData.url;
        } else if ((imageData as any).b64_json) {
          imageUrl = `data:image/png;base64,${(imageData as any).b64_json}`;
        } else {
          throw new Error('Unexpected image format');
        }

        return NextResponse.json({ image: imageUrl, prompt: enhancedPrompt });
      } catch (err: any) {
        lastError = err;
        console.error(`[AI Image Gen] Attempt ${attempt}/3:`, err?.message || err);
        if (attempt < 3) await new Promise(resolve => setTimeout(resolve, 2000 * attempt));
      }
    }

    return NextResponse.json({
      error: "I couldn't generate the image right now. Please try describing it differently — simpler descriptions often work better!",
    }, { status: 503 });
  } catch (error: any) {
    console.error('[AI Image Gen] Error:', error?.message || error);
    return NextResponse.json({
      error: "Image generation is temporarily unavailable. Please try again in a moment.",
    }, { status: 500 });
  }
}
