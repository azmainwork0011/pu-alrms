import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/jwt';
import { getZAI } from '@/lib/zai';
import { checkRateLimit, getClientIp } from '@/lib/security/rate-limit';
import { db } from '@/lib/db';

// ═══════════════════════════════════════════════════════════════════
// LUCKY STRICK — Academic AI Assistant (PU-ALRMS)
// Streaming endpoint with chat history persistence.
// ═══════════════════════════════════════════════════════════════════

const aiLimiter = { windowMs: 60_000, max: 30, keyPrefix: 'lucky-strick' };

// ─── Subject-Specific System Prompts ──────────────────────
const SUBJECT_PROMPTS: Record<string, string> = {
  math: `You are Lucky Strick, a mathematics expert at Prime University.
- Show ALL solution steps clearly numbered.
- State formulas before applying them.
- Use LaTeX notation for complex expressions ($$...$$).
- Provide multiple solution methods when possible.
- Explain the "why" behind each step.`,

  cs: `You are Lucky Strick, a computer science expert at Prime University.
- Write complete, runnable code with comments.
- Specify time & space complexity.
- Show expected output for all code.
- Handle edge cases and explain them.
- Use clean, professional coding standards.`,

  ee: `You are Lucky Strick, an electrical engineering expert at Prime University.
- Show circuit analysis step by step.
- State all formulas and units clearly.
- Use proper notation (V, I, R, Ω, F, H, etc.).
- Explain practical applications of concepts.
- Include diagrams descriptions when relevant.`,

  business: `You are Lucky Strick, a business studies expert at Prime University.
- Provide structured, professional analysis.
- Include real-world examples and case studies.
- Use proper business terminology and frameworks (SWOT, PESTLE, etc.).
- Present data in tables when comparing options.
- Consider ethical implications.`,

  physics: `You are Lucky Strick, a physics expert at Prime University.
- Show derivations step by step with clear reasoning.
- State all formulas with SI units.
- Explain physical meaning of mathematical results.
- Use diagrams descriptions for clarity.
- Connect theory to real-world applications.`,

  chemistry: `You are Lucky Strick, a chemistry expert at Prime University.
- Balance all chemical equations.
- Show electron configurations when relevant.
- Explain reaction mechanisms step by step.
- Include safety notes for lab procedures.
- Connect molecular structure to properties.`,

  general: `You are Lucky Strick, a professional academic AI assistant for PU-ALRMS (Prime University Academic Learning & Resource Management System).

## CORE IDENTITY
- Name: Lucky Strick
- You are an intelligent, helpful academic assistant.
- NEVER say "As an AI...", "I am a language model...", or reveal your provider.
- Be conversational, engaging, and genuinely helpful.

## RULES
- Use markdown: **bold**, *italic*, code blocks with language tags, lists, tables.
- Be accurate and concise. Prioritize clarity over verbosity.
- Provide multiple approaches when applicable.
- Ask clarifying questions when the query is ambiguous.

## LANGUAGE
- Bangla input → Bangla response (academic Bengali).
- English input → English response.
- Mixed → match user's style.

## EXPERTISE
- **Math**: Show ALL steps. Number each step. State formulas.
- **Code**: Complete runnable code with comments. Show output. Handle edge cases.
- **Science**: Physics, Chemistry, Biology — clear explanations with formulas.
- **Writing**: Essays, lab reports, research papers, thesis. Follow format requested.
- **Engineering**: EE, Mechanical, Civil, Chemical fundamentals.
- **Business**: Management, Marketing, Finance, Accounting, Entrepreneurship.`,
};

// ─── Build full system prompt ─────────────────────────────
function buildSystemPrompt(subject: string): string {
  const base = SUBJECT_PROMPTS[subject] || SUBJECT_PROMPTS.general;
  const dateStr = new Date().toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });
  return `${base}\n\nCurrent date: ${dateStr}\nInstitution: Prime University (PU)`;
}

// ─── Anonymize AI provider references ─────────────────────
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

// ─── Estimate token count (rough: ~4 chars per token) ────
function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

// ═══════════════════════════════════════════════════════════
// POST — Streaming Chat
// ═══════════════════════════════════════════════════════════
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
    const { message, subject, modelId, history, sessionId } = body;
    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return new Response(JSON.stringify({ error: 'Please type a question to get started.' }), {
        status: 400, headers: { 'Content-Type': 'application/json' },
      });
    }

    const trimmedMessage = message.trim();
    const effectiveSubject = subject || 'general';
    const effectiveSession = sessionId || `sess_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    // Save user message to DB
    try {
      await db.luckyStrickChat.create({
        data: {
          userId: payload.userId,
          sessionId: effectiveSession,
          role: 'user',
          content: trimmedMessage,
          subject: effectiveSubject,
          model: modelId || 'gpt4o',
          tokenCount: estimateTokens(trimmedMessage),
        },
      });
    } catch (dbErr) {
      console.warn('[Lucky Strick] Failed to save user message:', dbErr);
    }

    // Build conversation messages
    const systemPrompt = buildSystemPrompt(effectiveSubject);
    const messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }> = [
      { role: 'assistant', content: systemPrompt },
    ];

    if (Array.isArray(history) && history.length > 0) {
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

    // If SDK didn't return a ReadableStream, fallback to non-stream
    if (!(stream instanceof ReadableStream)) {
      const text = typeof stream === 'object' ? stream?.choices?.[0]?.message?.content : null;
      const response = text ? anonymize(text) : (isBangla(trimmedMessage)
        ? 'হুম, এই মুহূর্তে আমার সার্ভারে সমস্যা হচ্ছে। অনুগ্রহ করে আবার চেষ্টা করুন!'
        : "I'm having trouble connecting right now. Please try again!");

      // Save assistant response to DB
      try {
        await db.luckyStrickChat.create({
          data: {
            userId: payload.userId,
            sessionId: effectiveSession,
            role: 'assistant',
            content: response,
            subject: effectiveSubject,
            model: modelId || 'gpt4o',
            tokenCount: estimateTokens(response),
          },
        });
      } catch {}

      return new Response(JSON.stringify({
        mode: 'stream', response, done: true,
        sessionId: effectiveSession, subject: effectiveSubject,
      }), { headers: { 'Content-Type': 'application/json' } });
    }

    // Create TransformStream for SSE
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();
    let fullResponse = '';

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
              fullResponse += delta;
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content: delta })}\n\n`));
            }
          } catch {
            // Skip malformed JSON chunks
          }
        }
      },
      async flush(controller) {
        controller.enqueue(encoder.encode('data: [DONE]\n\n'));

        // Save complete assistant response to DB after stream ends
        const finalResponse = anonymize(fullResponse);
        if (finalResponse.trim()) {
          try {
            await db.luckyStrickChat.create({
              data: {
                userId: payload.userId,
                sessionId: effectiveSession,
                role: 'assistant',
                content: finalResponse,
                subject: effectiveSubject,
                model: modelId || 'gpt4o',
                tokenCount: estimateTokens(finalResponse),
              },
            });
          } catch (saveErr) {
            console.warn('[Lucky Strick] Failed to save assistant response:', saveErr);
          }
        }
      },
    });

    const readable = stream.pipeThrough(transformStream);

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no',
        'X-Session-Id': effectiveSession,
        'X-Subject': effectiveSubject,
      },
    });
  } catch (error: any) {
    console.error('[Lucky Strick] Error:', error?.message || error);

    const fallbackMsg = "I'm having trouble connecting right now. Please try again!";

    const encoder = new TextEncoder();
    return new Response(
      `data: ${JSON.stringify({ error: fallbackMsg })}\n\n`,
      { headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' } },
    );
  }
}
