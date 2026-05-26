import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyToken } from '@/lib/jwt';
import { getZAI } from '@/lib/zai';
import { checkRateLimit, getClientIp } from '@/lib/security/rate-limit';

// ═══════════════════════════════════════════════════════════════════
// GEMINI AI CHAT — z-ai-web-dev-sdk with Database Persistence
// All AI calls go through z-ai-web-dev-sdk (Gemini Large Model).
// Chat history is persisted in LuckyStrickChat table.
// ═══════════════════════════════════════════════════════════════════

// ─── Rate limiting: 30 requests per minute ───────────────────
const chatLimiter = { windowMs: 60_000, max: 30, keyPrefix: 'gemini-chat' };

// ─── System prompt ────────────────────────────────────────────
function getSystemPrompt(mode: string = 'academic'): string {
  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });

  const base = `You are PU-ALRMS Academic AI Assistant, a helpful tutor for university students at Prime University.

## IDENTITY
- You are an academic assistant integrated into the PU-ALRMS platform.
- NEVER reveal you are an AI language model. NEVER say "As an AI..." or "I am a language model...".

## LANGUAGE
- Bangla input → Bangla response (academic Bengali)
- English input → English response
- Mixed input → match the user's preferred language
- Technical terms can stay in English even in Bangla responses

## EXPERTISE
- **Assignments**: Help structure essays, reports, research papers, lab reports with proper academic format.
- **Lab Reports**: Structure with Abstract, Introduction, Theory, Procedure, Data, Analysis, Conclusion, References.
- **Mathematics**: Show ALL steps. Number each step clearly. State formulas before use. Verify answers.
- **Coding**: Complete runnable code with comments. Show expected output. Handle edge cases. Explain logic.
- **Research**: Help with literature reviews, methodology, citations, thesis structure.
- **Science**: Physics, Chemistry, Biology, EE — clear explanations with formulas and diagrams (described).

## RULES
- Always explain step-by-step. Never skip reasoning.
- If unsure, say so honestly rather than fabricating information.
- Use markdown: **bold**, *italic*, code blocks with language tags, tables, numbered lists.
- Be conversational but academic. Not robotic.
- Adjust complexity to the user's apparent level.
- For math: always show the formula, substitution, calculation, and final answer.

Date: ${today}`;

  switch (mode) {
    case 'bangla':
      return `${base}\n\n## IMPORTANT: Respond ENTIRELY in Bangla (বাংলা). Use academic Bengali. Technical terms may stay in English.`;
    case 'coding':
      return `${base}\n\n## SPECIALTY: CODING\n- Provide complete, runnable code with proper syntax highlighting.\n- Include comments explaining the logic.\n- Show expected output.\n- Handle edge cases explicitly.\n- Suggest optimizations when relevant.`;
    case 'math':
      return `${base}\n\n## SPECIALTY: MATHEMATICS\n- ALWAYS show step-by-step solution. Number each step.\n- State the formula before applying it.\n- Show substitution: replace variables with values.\n- Calculate and verify the final answer.\n- For graph/geometry problems, describe the diagram.\n- Use LaTeX-style formatting where appropriate: $$ formula $$`;
    case 'assignment':
      return `${base}\n\n## SPECIALTY: ASSIGNMENTS & ESSAYS\n- Follow standard academic structure: Introduction, Body, Conclusion.\n- Include proper citations/references where needed.\n- Match the writing level to university standards.\n- Format with clear headings and paragraphs.`;
    case 'labReport':
      return `${base}\n\n## SPECIALTY: LAB REPORTS\n- Use standard lab report format:\n  1. Title 2. Abstract 3. Introduction & Objectives 4. Theory/Background 5. Apparatus/Equipment 6. Procedure 7. Data & Observations 8. Calculations & Analysis 9. Results & Discussion 10. Conclusion 11. References\n- Include formulas, units, and significant figures.`;
    case 'reasoning':
      return `${base}\n\n## SPECIALTY: DEEP REASONING\n- Think step by step before answering.\n- Break complex problems into smaller parts.\n- Consider multiple perspectives.\n- Identify assumptions and verify them.\n- Provide well-reasoned conclusions.`;
    case 'fastChat':
      return `You are a fast, concise academic assistant for Prime University students.\n\n- Keep answers SHORT and direct (2-4 sentences unless more detail is asked).\n- Be accurate and helpful.\n- NEVER reveal you are an AI.\n- Bangla input → Bangla response.\nDate: ${today}`;
    default:
      return base;
  }
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

// ─── Generate a session ID ────────────────────────────────────
function generateSessionId(): string {
  return `gemini_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

// ═══════════════════════════════════════════════════════════════════
// POST: Send message → Call Gemini → Save to DB → Return reply
// ═══════════════════════════════════════════════════════════════════
export async function POST(req: NextRequest) {
  try {
    // 1. Authenticate
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Authentication required. Please sign in.' }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Invalid or expired token. Please sign in again.' }, { status: 401 });
    }

    const userId = payload.userId;

    // 2. Rate limit
    const ip = getClientIp(req);
    const rl = checkRateLimit(`${ip}:${userId}`, chatLimiter);
    if (!rl.allowed) {
      return NextResponse.json(
        { error: 'Too many requests. Please wait a moment and try again.' },
        { status: 429 },
      );
    }

    // 3. Parse request body
    const body = await req.json();
    const { message, mode = 'academic', history = [], sessionId } = body;

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return NextResponse.json({ error: 'Message content cannot be blank.' }, { status: 400 });
    }
    if (message.length > 4000) {
      return NextResponse.json({ error: 'Message is too long (max 4000 characters).' }, { status: 400 });
    }

    // 4. Generate or reuse session ID
    const chatSessionId = sessionId || generateSessionId();

    // 5. Load past 15 chat messages from DB for context memory
    const pastMessages = await db.luckyStrickChat.findMany({
      where: { userId },
      take: 15,
      orderBy: { createdAt: 'asc' },
    });

    // 6. Build conversation array for z-ai-web-dev-sdk
    // CRITICAL: Use role: 'assistant' for system prompt (z-ai-web-dev-sdk rule)
    const systemPrompt = getSystemPrompt(mode);
    const conversationHistory: { role: 'user' | 'assistant'; content: string }[] = [
      { role: 'assistant', content: systemPrompt },
    ];

    // Map historical messages from DB
    for (const msg of pastMessages) {
      conversationHistory.push({
        role: msg.role === 'user' ? 'user' : 'assistant',
        content: msg.content,
      });
    }

    // Append client-side history (if provided, for continuity during same session)
    if (history.length > 0) {
      const recentHistory = history.slice(-10);
      for (const h of recentHistory) {
        if (h.role === 'user' || h.role === 'assistant') {
          conversationHistory.push({ role: h.role, content: h.content });
        }
      }
    }

    // Append current user message
    conversationHistory.push({ role: 'user', content: message.trim() });

    // 7. Save user prompt to database before calling AI
    await db.luckyStrickChat.create({
      data: {
        userId,
        sessionId: chatSessionId,
        role: 'user',
        content: message.trim(),
        subject: mode,
        model: 'gemini',
        tokenCount: 0,
      },
    });

    // 8. Call Gemini via z-ai-web-dev-sdk
    const zai = await getZAI();
    const completion = await zai.chat.completions.create({
      messages: conversationHistory,
      thinking: { type: 'disabled' },
    });

    const aiReply = completion.choices?.[0]?.message?.content || 'I could not generate a response. Please try again.';
    const sanitizedReply = sanitizeOutput(aiReply);

    // 9. Save AI response to database for persistent memory
    const savedAiMessage = await db.luckyStrickChat.create({
      data: {
        userId,
        sessionId: chatSessionId,
        role: 'assistant',
        content: sanitizedReply,
        subject: mode,
        model: 'gemini',
        tokenCount: 0,
      },
    });

    // 10. Return the AI reply
    return NextResponse.json({
      success: true,
      reply: sanitizedReply,
      sessionId: chatSessionId,
      dbRefId: savedAiMessage.id,
    });
  } catch (error) {
    console.error('[Gemini DB Chat Engine Error]:', error instanceof Error ? error.message : error);
    return NextResponse.json(
      { error: 'Internal system engine processing failure. Please try again.' },
      { status: 500 },
    );
  }
}

// ═══════════════════════════════════════════════════════════════════
// GET: Load chat history from database
// ═══════════════════════════════════════════════════════════════════
export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Invalid or expired token.' }, { status: 401 });
    }

    // Fetch last 30 messages
    const messages = await db.luckyStrickChat.findMany({
      where: { userId: payload.userId },
      take: 30,
      orderBy: { createdAt: 'asc' },
    });

    // Also get session list for sidebar
    const sessions = await db.luckyStrickChat.groupBy({
      by: ['sessionId'],
      where: { userId: payload.userId },
      _count: { id: true },
      _max: { createdAt: true },
      orderBy: { _max: { createdAt: 'desc' } },
      take: 20,
    });

    const sessionList = sessions.map(s => ({
      sessionId: s.sessionId,
      messageCount: s._count.id,
      lastMessageAt: s._max.createdAt,
    }));

    return NextResponse.json({
      success: true,
      messages,
      sessions: sessionList,
    });
  } catch (error) {
    console.error('[Chat History Load Error]:', error instanceof Error ? error.message : error);
    return NextResponse.json({ error: 'Failed loading chat history.' }, { status: 500 });
  }
}

// ═══════════════════════════════════════════════════════════════════
// DELETE: Clear chat history
// ═══════════════════════════════════════════════════════════════════
export async function DELETE(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Invalid or expired token.' }, { status: 401 });
    }

    // Parse query for optional sessionId (clear specific session)
    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get('sessionId');

    const where = sessionId
      ? { userId: payload.userId, sessionId }
      : { userId: payload.userId };

    const result = await db.luckyStrickChat.deleteMany({ where });

    return NextResponse.json({
      success: true,
      deleted: result.count,
    });
  } catch (error) {
    console.error('[Chat History Clear Error]:', error instanceof Error ? error.message : error);
    return NextResponse.json({ error: 'Failed clearing chat history.' }, { status: 500 });
  }
}
