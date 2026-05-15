import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/jwt';
import { getZAI } from '@/lib/zai';
import { checkRateLimit, getClientIp } from '@/lib/security/rate-limit';

// ═══════════════════════════════════════════════════════════════════
// AI VISION / SMART SCANNER
// Bulletproof image analysis — NEVER returns generic errors.
// ═══════════════════════════════════════════════════════════════════

const scanLimiter = { windowMs: 60_000, max: 10, keyPrefix: 'scan' };

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
    const rl = checkRateLimit(`${ip}:${payload.userId}`, scanLimiter);
    if (!rl.allowed) {
      return NextResponse.json({
        error: 'Too many scan requests. Please wait a moment before trying again.',
        retryAfterMs: rl.retryAfterMs,
      }, { status: 429 });
    }

    const { image, question } = await req.json();

    if (!image || !question) {
      return NextResponse.json({
        error: "I couldn't understand your request. Please provide both an image and a question.",
      }, { status: 400 });
    }

    if (!image.startsWith('data:image/')) {
      return NextResponse.json({
        error: 'The image format is not supported. Please upload a valid image file (PNG, JPG, or WebP).',
      }, { status: 400 });
    }

    const systemPrompt = `You are Professor Gemini, an expert academic AI teacher at Prime University.

## ANALYSIS STANDARDS
1. Analyze images thoroughly, accurately, and educationally
2. For math/diagrams: Extract all text, numbers, equations
3. For code screenshots: Identify the language, explain the logic, find bugs
4. For science diagrams: Identify components, explain relationships
5. Use clear markdown formatting with headers, lists, and code blocks
6. Provide step-by-step solutions for problems shown in images

## CRITICAL RULES
- NEVER say "As an AI..."
- Be precise and educational
- If text is unclear, state what you can see and ask for clarification`;

    const userText = `Analyze this image carefully and answer the question.

**Question:** ${question}

Provide a structured analysis:
1. **📋 Description** — What do you see in the image?
2. **💡 Detailed Answer** — Step-by-step answer to the question
3. **📚 Educational Context** — Related concepts, formulas, or explanations`;

    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const zai = await getZAI();
        const completion = await zai.chat.completions.createVision({
          model: 'vision',
          messages: [
            { role: 'system', content: systemPrompt },
            {
              role: 'user',
              content: [
                { type: 'text', text: userText },
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
        throw new Error('Empty vision response');
      } catch (err: any) {
        lastError = err;
        console.error(`[AI Scan] Attempt ${attempt}/3:`, err?.message || err);
        if (attempt < 3) await new Promise(r => setTimeout(r, 1000 * attempt));
      }
    }

    // Intelligent fallback — NEVER generic
    return NextResponse.json({
      response: `I encountered an issue analyzing this image. Here's what I recommend:

**📋 To get the best results:**
1. 📸 Ensure the image is clear and well-lit
2. 📐 For math problems — show the complete question
3. 💻 For code — make sure the screenshot includes all relevant code
4. 📝 For text — ensure it's readable and not rotated

**💡 Tips for your question:** "${question}"

Please try again with a clearer image or rephrase your question for better results!`,
    });
  } catch (error: any) {
    console.error('[AI Scan] Error:', error?.message || error);
    return NextResponse.json({
      error: "I couldn't analyze the image at this time. Please try uploading it again with a clear question.",
    }, { status: 500 });
  }
}
