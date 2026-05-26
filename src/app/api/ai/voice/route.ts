import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { verifyToken } from '@/lib/jwt';
import { checkRateLimit, getClientIp } from '@/lib/security/rate-limit';
import { chatAI } from '@/lib/ai/router';
import { VOICE_PROMPT } from '@/lib/ai/system-prompts';

// ═══════════════════════════════════════════════════════════════════
// AI VOICE — Short, spoken-friendly responses for voice assistant
// Server-only. API keys are NEVER exposed.
// ═══════════════════════════════════════════════════════════════════

// ─── Rate limiting: 20 requests per minute ──────────────────
const voiceLimiter = { windowMs: 60_000, max: 20, keyPrefix: 'ai-voice' };

// ─── Zod schema ─────────────────────────────────────────────
const voiceSchema = z.object({
  message: z
    .string()
    .min(1, 'Message cannot be empty')
    .max(1000, 'Voice message is too long (max 1000 characters)'),
});

// ─── HTML/script stripper ────────────────────────────────────
function sanitizeOutput(text: string): string {
  return text
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/<embed\b[^>]*>/gi, '')
    .replace(/<img\b[^>]*onerror\b[^>]*>/gi, '')
    .replace(/javascript\s*:/gi, '')
    .replace(/<[^>]+on\w+\s*=\s*["'][^"']*["'][^>]*>/gi, '')
    .trim();
}

// ─── Detect Bangla ──────────────────────────────────────────
function isBangla(text: string): boolean {
  return /[\u0980-\u09FF]/.test(text);
}

// ═══════════════════════════════════════════════════════════════════
// POST: Get a short, voice-friendly AI response
// ═══════════════════════════════════════════════════════════════════
export async function POST(req: NextRequest) {
  try {
    // ─── 1. Auth: Verify JWT ──────────────────────────────
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required. Please sign in.' },
        { status: 401 },
      );
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json(
        { error: 'Invalid or expired token. Please sign in again.' },
        { status: 401 },
      );
    }

    // ─── 2. Rate limit ────────────────────────────────────
    const ip = getClientIp(req);
    const rl = checkRateLimit(`${ip}:${payload.userId}`, voiceLimiter);
    if (!rl.allowed) {
      return NextResponse.json(
        {
          error: 'Too many voice requests. Please wait a moment.',
          retryAfterMs: rl.retryAfterMs,
        },
        { status: 429 },
      );
    }

    // ─── 3. Validate request body ─────────────────────────
    let body: z.infer<typeof voiceSchema>;
    try {
      const raw = await req.json();
      body = voiceSchema.parse(raw);
    } catch (err) {
      if (err instanceof z.ZodError) {
        const firstIssue = err.issues[0];
        return NextResponse.json(
          { error: firstIssue?.message || 'Invalid request body.' },
          { status: 400 },
        );
      }
      return NextResponse.json(
        { error: 'Invalid request. Please check your input.' },
        { status: 400 },
      );
    }

    const { message } = body;

    // ─── 4. Build messages with voice system prompt ───────
    const messages: { role: 'system' | 'user' | 'assistant'; content: string }[] = [
      { role: 'system', content: VOICE_PROMPT },
      { role: 'user', content: message },
    ];

    // ─── 5. Call chatAI (non-streaming for voice) ─────────
    const result = await chatAI(messages, 'voice', {
      stream: false,
    });

    // ─── 6. Format response ───────────────────────────────
    let responseText: string;

    if (typeof result === 'string') {
      responseText = sanitizeOutput(result);
    } else if (result instanceof ReadableStream) {
      // Unexpected stream from non-stream call — consume it
      const reader = result.getReader();
      const decoder = new TextDecoder();
      let collected = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        collected += typeof value === 'string' ? value : decoder.decode(value as BufferSource, { stream: true });
      }
      responseText = sanitizeOutput(collected);
    } else {
      responseText = isBangla(message)
        ? 'দুঃখিত, এই মুহূর্তে উত্তর দিতে পারছি না। আবার চেষ্টা করুন।'
        : "Sorry, I couldn't generate a response right now. Please try again.";
    }

    // Truncate overly long responses for voice readability
    if (responseText.length > 500) {
      responseText = responseText.slice(0, 500).trim() + '…';
    }

    return NextResponse.json({
      response: responseText,
      provider: 'ai-voice',
    });
  } catch (error: unknown) {
    // Handle abort
    if (error instanceof DOMException && error.name === 'AbortError') {
      return NextResponse.json(
        { error: 'Voice request was cancelled.' },
        { status: 499 },
      );
    }

    console.error('[AI Voice] Error:', error instanceof Error ? error.message : error);
    return NextResponse.json(
      { error: 'Voice service is temporarily unavailable. Please try again.' },
      { status: 500 },
    );
  }
}
