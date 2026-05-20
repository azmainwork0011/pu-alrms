import { NextRequest } from 'next/server';
import { verifyToken } from '@/lib/jwt';
import { getZAI } from '@/lib/zai';
import { checkRateLimit, getClientIp } from '@/lib/security/rate-limit';

// ═══════════════════════════════════════════════════════════════════
// CHAT Z AI — Streaming Endpoint
// Returns Server-Sent Events (SSE) for real-time token delivery.
// ═══════════════════════════════════════════════════════════════════

const aiLimiter = { windowMs: 60_000, max: 30, keyPrefix: 'ai-stream' };

const SYSTEM_PROMPT = `You are Chat Z AI, a real-time academic assistant for Prime University LMS.

## RULES
- NEVER say "As an AI...", "I am a language model...", or reveal your provider.
- Use markdown: **bold**, *italic*, code blocks, lists, tables.
- Be conversational, human-like, and genuinely helpful.

## LANGUAGE
- Bangla input → Bangla response (academic Bengali)
- English input → English response
- Mixed → match user's style

## EXPERTISE
- **Math**: Show ALL steps. Number each step. State formulas.
- **Code**: Complete runnable code with comments. Show output. Handle edge cases.
- **Science**: Physics, Chemistry, Biology — clear explanations with formulas.
- **Writing**: Essays, lab reports, research papers, thesis. Follow format requested.
- **Engineering**: Electrical, Mechanical, Civil, Chemical fundamentals.

## BEHAVIOR
- Ask clarifying questions when needed.
- Provide multiple solution approaches.
- Adjust complexity to user's level.
- Be engaging, not robotic.

Date: ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`;

function anonymize(text: string): string {
  return text
    .replace(/As an?\s+(?:AI|language model|large language model|LLM)[^.]*/gi, '')
    .replace(/I(?:'m| am)\s+(?:a(?:n)?\s+)?(?:AI|language model|large language model|LLM)[^.]*/gi, '')
    .replace(/I was (?:trained|developed|built|created)[^.]*\./gi, '')
    .replace(/(?:OpenAI|Anthropic|Google|Meta|Mistral AI|Gemini|GPT|Claude|LLaMA|ChatGPT)[^.,]*/gi, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function isBangla(message: string): boolean {
  return /[\u0980-\u09FF]/.test(message);
}

export async function POST(req: NextRequest) {
  try {
    // Auth
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    if (!token) {
      return new Response(JSON.stringify({ error: 'Authentication required' }), {
        status: 401, headers: { 'Content-Type': 'application/json' },
      });
    }
    const payload = verifyToken(token);
    if (!payload) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401, headers: { 'Content-Type': 'application/json' },
      });
    }

    // Rate limit
    const ip = getClientIp(req);
    const rl = checkRateLimit(`${ip}:${payload.userId}`, aiLimiter);
    if (!rl.allowed) {
      return new Response(
        JSON.stringify({ error: 'Too many requests. Wait a moment.', retryAfterMs: rl.retryAfterMs }),
        { status: 429, headers: { 'Content-Type': 'application/json' } },
      );
    }

    // Parse body
    const body = await req.json();
    const { message, modelId, history } = body;
    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return new Response(JSON.stringify({ error: 'Please type a question to get started.' }), {
        status: 400, headers: { 'Content-Type': 'application/json' },
      });
    }

    const trimmedMessage = message.trim();

    // Build conversation from history or just system + user
    const messages: { role: string; content: string }[] = [
      { role: 'assistant', content: SYSTEM_PROMPT },
    ];
    if (Array.isArray(history) && history.length > 0) {
      // Take last 10 exchanges (20 messages) to keep context manageable
      const recentHistory = history.slice(-20);
      for (const h of recentHistory) {
        if (h.role === 'user' || h.role === 'assistant') {
          messages.push({ role: h.role, content: h.content });
        }
      }
    }
    messages.push({ role: 'user', content: trimmedMessage });

    // Call ZAI SDK with streaming
    const zai = await getZAI();
    const stream = await zai.chat.completions.create({
      messages,
      thinking: { type: 'disabled' },
      stream: true,
    });

    // The SDK returns a ReadableStream when stream: true
    if (!(stream instanceof ReadableStream)) {
      console.warn('[AI Stream] SDK did not return a ReadableStream, falling back to non-stream');
      // Fallback: treat as normal response
      const text = typeof stream === 'object' ? stream?.choices?.[0]?.message?.content : null;
      const response = text ? anonymize(text) : (isBangla(trimmedMessage)
        ? 'হুম, এই মুহূর্তে আমার সার্ভারে সমস্যা হচ্ছে। অনুগ্রহ করে আবার চেষ্টা করুন!'
        : "Hmm, I'm having trouble connecting right now. Please try again!");
      return new Response(JSON.stringify({ mode: 'stream', response, done: true }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Create a TransformStream to process SSE chunks and re-emit as our own SSE format
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    const transformStream = new TransformStream({
      transform(chunk, controller) {
        const text = decoder.decode(chunk, { stream: true });
        const lines = text.split('\n');

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || !trimmed.startsWith('data:')) continue;

          const data = trimmed.slice(5).trim();
          if (data === '[DONE]') {
            controller.enqueue(encoder.encode('data: [DONE]\n\n'));
            return;
          }

          try {
            const parsed = JSON.parse(data);
            const delta = parsed.choices?.[0]?.delta?.content;
            if (delta) {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content: delta })}\n\n`));
            }
          } catch {
            // Skip malformed JSON chunks
          }
        }
      },
      flush(controller) {
        controller.enqueue(encoder.encode('data: [DONE]\n\n'));
      },
    });

    // Pipe the SDK stream through our transformer
    const readable = stream.pipeThrough(transformStream);

    // Return SSE response
    return new Response(readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no',
      },
    });
  } catch (error: any) {
    console.error('[AI Stream] Error:', error?.message || error);

    const fallbackMsg = error?.message?.includes('Bangla')
      ? 'হুম, এই মুহূর্তে সমস্যা হচ্ছে। আবার চেষ্টা করুন!'
      : "I'm having trouble connecting right now. Please try again!";

    // Return error as SSE
    const encoder = new TextEncoder();
    return new Response(
      `data: ${JSON.stringify({ error: fallbackMsg })}\n\n`,
      { headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' } },
    );
  }
}
