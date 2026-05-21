import { NextRequest } from 'next/server';
import { z } from 'zod';
import { verifyToken } from '@/lib/jwt';
import { checkRateLimit, getClientIp } from '@/lib/security/rate-limit';
import {
  chatAI,
  getModesList,
  type AIMode,
} from '@/lib/ai/router';
import { ACADEMIC_PROMPT } from '@/lib/ai/system-prompts';

// ═══════════════════════════════════════════════════════════════════
// AI CHAT — Streaming SSE endpoint with multi-provider fallback
// All logic is server-side only. API keys are NEVER exposed.
// ═══════════════════════════════════════════════════════════════════

// ─── Rate limiting: 30 requests per minute ───────────────────
const chatLimiter = { windowMs: 60_000, max: 30, keyPrefix: 'ai-chat' };

// ─── Zod schema for request body ─────────────────────────────
const chatSchema = z.object({
  message: z
    .string()
    .min(1, 'Message cannot be empty')
    .max(4000, 'Message is too long (max 4000 characters)'),
  mode: z.enum([
    'academic',
    'coding',
    'math',
    'assignment',
    'labReport',
    'fastChat',
    'reasoning',
    'bangla',
    'voice',
  ] as const),
  history: z
    .array(
      z.object({
        role: z.enum(['user', 'assistant']),
        content: z.string().max(8000),
      }),
    )
    .max(40, 'Too much history (max 40 messages)')
    .optional(),
});

// ─── Duplicate detection: same message within 2 seconds ─────
const recentMessages = new Map<
  string,
  { content: string; timestamp: number }
>();
const DUPLICATE_WINDOW_MS = 2000;

function isDuplicate(userId: string, message: string): boolean {
  const now = Date.now();
  const prev = recentMessages.get(userId);
  if (prev && prev.content === message && now - prev.timestamp < DUPLICATE_WINDOW_MS) {
    return true;
  }
  recentMessages.set(userId, { content: message, timestamp: now });
  return false;
}

// ─── HTML/script stripper for output safety ──────────────────
function sanitizeOutput(text: string): string {
  return text
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '')
    .replace(/<embed\b[^>]*>/gi, '')
    .replace(/<link\b[^>]*>/gi, '')
    .replace(/<meta\b[^>]*>/gi, '')
    .replace(/<img\b[^>]*onerror\b[^>]*>/gi, '')
    .replace(/<[^>]+on\w+\s*=\s*["'][^"']*["'][^>]*>/gi, '')
    .replace(/javascript\s*:/gi, '')
    .replace(/\bon\w+\s*=\s*["'][^"']*["']/gi, '')
    .trim();
}

// ─── Get system prompt based on mode ────────────────────────
function getSystemPrompt(mode: AIMode): string {
  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  switch (mode) {
    case 'voice':
      return ACADEMIC_PROMPT; // voice mode uses its own prompt in voice route
    case 'bangla':
      return `${ACADEMIC_PROMPT}\n\n## IMPORTANT: Respond ENTIRELY in Bangla (বাংলা). Use academic Bengali. Technical terms may stay in English.`;
    case 'coding':
      return `${ACADEMIC_PROMPT}\n\n## SPECIALTY: CODING\n- Provide complete, runnable code with proper syntax highlighting.\n- Include comments explaining the logic.\n- Show expected output.\n- Handle edge cases explicitly.\n- Suggest optimizations when relevant.`;
    case 'math':
      return `${ACADEMIC_PROMPT}\n\n## SPECIALTY: MATHEMATICS\n- ALWAYS show step-by-step solution. Number each step.\n- State the formula before applying it.\n- Show substitution: replace variables with values.\n- Calculate and verify the final answer.\n- For graph/geometry problems, describe the diagram.\n- Use LaTeX-style formatting where appropriate: $$ formula $$`;
    case 'assignment':
      return `${ACADEMIC_PROMPT}\n\n## SPECIALTY: ASSIGNMENTS & ESSAYS\n- Follow standard academic structure: Introduction, Body, Conclusion.\n- Include proper citations/references where needed.\n- Match the writing level to university standards.\n- Check for plagiarism-friendly original writing.\n- Format with clear headings and paragraphs.`;
    case 'labReport':
      return `${ACADEMIC_PROMPT}\n\n## SPECIALTY: LAB REPORTS\n- Use standard lab report format:\n  1. Title\n  2. Abstract\n  3. Introduction & Objectives\n  4. Theory/Background\n  5. Apparatus/Equipment\n  6. Procedure\n  7. Data & Observations (tables)\n  8. Calculations & Analysis\n  9. Results & Discussion\n  10. Conclusion\n  11. References\n- Include formulas, units, and significant figures.\n- Suggest improvements and sources of error.`;
    case 'reasoning':
      return `${ACADEMIC_PROMPT}\n\n## SPECIALTY: DEEP REASONING\n- Think step by step before answering.\- Break complex problems into smaller parts.\- Consider multiple perspectives.\- Identify assumptions and verify them.\- Provide well-reasoned conclusions.\- Cite logical principles when applicable.`;
    case 'fastChat':
      return `You are a fast, concise academic assistant for Prime University students.\n\n- Keep answers SHORT and direct (2-4 sentences unless more detail is asked).\n- Be accurate and helpful.\n- NEVER reveal you are an AI.\n- Bangla input → Bangla response.\nDate: ${today}`;
    case 'academic':
    default:
      return ACADEMIC_PROMPT;
  }
}

// ─── Helper: JSON error response ────────────────────────────
function errorResponse(message: string, status: number, extra?: Record<string, unknown>) {
  return new Response(
    JSON.stringify({ error: message, ...extra }),
    { status, headers: { 'Content-Type': 'application/json' } },
  );
}

// ─── Helper: Convert a string to SSE event ──────────────────
function stringToSSE(text: string): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  const sanitized = sanitizeOutput(text);
  return new ReadableStream({
    start(controller) {
      controller.enqueue(
        encoder.encode(`data: ${JSON.stringify({ content: sanitized })}\n\n`),
      );
      controller.enqueue(encoder.encode('data: [DONE]\n\n'));
      controller.close();
    },
  });
}

// ═══════════════════════════════════════════════════════════════════
// POST: Stream AI chat response via SSE
// ═══════════════════════════════════════════════════════════════════
export async function POST(req: NextRequest) {
  try {
    // ─── 1. Auth: Verify JWT ──────────────────────────────
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    if (!token) {
      return errorResponse('Authentication required. Please sign in.', 401);
    }

    const payload = verifyToken(token);
    if (!payload) {
      return errorResponse('Invalid or expired token. Please sign in again.', 401);
    }

    const userId = payload.userId;

    // ─── 2. Rate limit ────────────────────────────────────
    const ip = getClientIp(req);
    const rl = checkRateLimit(`${ip}:${userId}`, chatLimiter);
    if (!rl.allowed) {
      return errorResponse(
        'Too many requests. Please wait a moment and try again.',
        429,
        { retryAfterMs: rl.retryAfterMs },
      );
    }

    // ─── 3. Validate request body with Zod ────────────────
    let body: z.infer<typeof chatSchema>;
    try {
      const raw = await req.json();
      body = chatSchema.parse(raw);
    } catch (err) {
      if (err instanceof z.ZodError) {
        const firstIssue = err.issues[0];
        return errorResponse(
          firstIssue?.message || 'Invalid request body.',
          400,
          { details: err.issues.map((i) => i.message) },
        );
      }
      return errorResponse('Invalid request. Please check your input.', 400);
    }

    const { message, mode, history } = body;

    // ─── 4. Duplicate detection ───────────────────────────
    if (isDuplicate(userId, message)) {
      return errorResponse(
        'Duplicate message detected. Please wait before sending the same message.',
        429,
      );
    }

    // ─── 5. Build messages array ──────────────────────────
    const systemPrompt = getSystemPrompt(mode);
    const messages: { role: 'system' | 'user' | 'assistant'; content: string }[] = [
      { role: 'system', content: systemPrompt },
    ];

    // Add conversation history (limit to last 20 messages for context)
    if (history && history.length > 0) {
      const recentHistory = history.slice(-20);
      for (const h of recentHistory) {
        messages.push({ role: h.role, content: h.content });
      }
    }

    // Add the current user message
    messages.push({ role: 'user', content: message });

    // ─── 6. Call chatAI with streaming ────────────────────
    const abortSignal = req.signal;

    const result = await chatAI(messages, mode, { stream: true, signal: abortSignal });

    // ─── 7. Handle response ───────────────────────────────

    // If chatAI returned a ReadableStream, pipe it through SSE formatter
    if (result instanceof ReadableStream) {
      const encoder = new TextEncoder();
      const decoder = new TextDecoder();

      const sseTransform = new TransformStream<Uint8Array, Uint8Array>({
        transform(chunk, controller) {
          const text = decoder.decode(chunk, { stream: true });

          // The upstream providers return plain text chunks, wrap as SSE
          const sanitized = sanitizeOutput(text);
          if (sanitized) {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ content: sanitized })}\n\n`),
            );
          }
        },
        flush(controller) {
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
        },
      });

      const sseStream = result.pipeThrough(
        new TransformStream<string, Uint8Array>({
          transform(textChunk, controller) {
            const sanitized = sanitizeOutput(textChunk);
            if (sanitized) {
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ content: sanitized })}\n\n`),
              );
            }
          },
          flush(controller) {
            controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          },
        }),
      );

      return new Response(sseStream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache, no-transform',
          'Connection': 'keep-alive',
          'X-Accel-Buffering': 'no',
        },
      });
    }

    // If chatAI returned a string, wrap as single SSE event
    if (typeof result === 'string') {
      return new Response(stringToSSE(result), {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache, no-transform',
          'Connection': 'keep-alive',
          'X-Accel-Buffering': 'no',
        },
      });
    }

    // Unexpected response type
    return errorResponse(
      'AI service returned an unexpected response. Please try again.',
      500,
    );
  } catch (error: unknown) {
    // Handle abort (client cancelled request)
    if (error instanceof DOMException && error.name === 'AbortError') {
      return new Response('data: [DONE]\n\n', {
        headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' },
      });
    }

    console.error('[AI Chat] Error:', error instanceof Error ? error.message : error);
    return errorResponse(
      'Something went wrong while processing your request. Please try again.',
      500,
    );
  }
}
