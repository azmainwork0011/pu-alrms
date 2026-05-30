/**
 * Snowwe Voice Assistant — AI Backend Route
 *
 * Handles voice intent processing with:
 * - Database user context injection (personalized greetings)
 * - Structured JSON response: { reply, navigation }
 * - SPA navigation command extraction
 * - z-ai-web-dev-sdk for AI inference
 *
 * Authentication: JWT Bearer token (optional — works in guest mode too)
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/jwt';
import { db } from '@/lib/db';
import { checkRateLimit, getClientIp } from '@/lib/security/rate-limit';
import { chatAI, type AIMessage } from '@/lib/ai/router';

// ─── Rate limiting: 30 requests per minute ──────────────────
const snowweLimiter = { windowMs: 60_000, max: 30, keyPrefix: 'snowwe-voice' };

// ─── Valid navigation targets (must match Zustand PageView) ─
const VALID_PAGES = new Set([
  'dashboard', 'admin-panel', 'assignments', 'lab-reports',
  'create-assignment', 'submissions', 'student-tasks',
  'leaderboard', 'announcements', 'student-community',
  'quiz', 'code-quest', 'books', 'ai-chat', 'notifications', 'profile',
  'cr-dashboard',
]);

// ─── Snowwe System Prompt ──────────────────────────────────
function buildSnowwePrompt(userContext: string, currentPage: string): string {
  return `You are "Snowwe" (স্নোয়ি), the friendly and intelligent female AI voice assistant for Prime University's Learning Management System — PU-ALRMS.

## Personality & Speaking Style
- You are warm, polite, articulate, and naturally helpful — like a friendly academic guide.
- Your voice persona is female, sweet, and confident.
- You speak primarily in fluent Bangla (বাংলা), but switch to English naturally when the user speaks English or asks about technical topics.
- Keep responses concise and conversational — this is SPOKEN output, not an essay. Aim for 2-3 sentences max.
- Use natural speech patterns. Avoid robotic or overly formal language.
- Greet with "আসসালামু আলাইকুম" for Muslim users or "হ্যালো" casually.

## Current Context
- User Info: ${userContext || 'Guest (not logged in)'}
- Current Page: ${currentPage}

## Capabilities
You can:
1. Answer academic questions (assignments, subjects, quizzes, GPA)
2. Help navigate the app (direct users to pages)
3. Provide study tips and motivational advice
4. Explain university policies in simple terms
5. Chat about general knowledge

## Navigation Commands
If the user wants to go to a specific page, include a "navigation" field in your JSON response.
Valid pages: dashboard, admin-panel, assignments, lab-reports, create-assignment, submissions, student-tasks, leaderboard, announcements, student-community, quiz, code-quest, books, ai-chat, notifications, profile, cr-dashboard.

## Response Format
You MUST respond with a JSON object containing exactly:
1. "reply" — Your spoken text response (Bangla or English, concise, friendly)
2. "navigation" — The target page string ONLY if user explicitly asks to navigate. Otherwise null.

Example for navigation:
{"reply": "হ্যাঁ, আমি এখন ড্যাশবোর্ডে নিয়ে যাচ্ছি!", "navigation": "dashboard"}

Example for question:
{"reply": "প্রাইম ইউনিভার্সিটিতে GPA ক্যালকুলেশন প্রতি সেমেস্টারে ক্রেডিট ঘণ্টার ভিত্তিতে হয়। আপনি কি নির্দিষ্ট কোনো সেমেস্টারের GPA জানতে চান?", "navigation": null}

IMPORTANT: Only output valid JSON. No markdown, no code blocks, no extra text.`;
}

// ─── Safe JSON parse (handles markdown code fences) ────────
function parseSnowweResponse(raw: string): { reply: string; navigation: string | null } {
  // Strip markdown code fences if present
  let cleaned = raw.replace(/```json\s*/gi, '').replace(/```\s*/gi, '').trim();

  // Try to extract JSON from the response
  try {
    const parsed = JSON.parse(cleaned);
    if (parsed.reply && typeof parsed.reply === 'string') {
      return {
        reply: String(parsed.reply),
        navigation: VALID_PAGES.has(parsed.navigation) ? parsed.navigation : null,
      };
    }
  } catch {
    // Try to find JSON object in the text
    const jsonMatch = cleaned.match(/\{[\s\S]*"reply"[\s\S]*\}/);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[0]);
        if (parsed.reply) {
          return {
            reply: String(parsed.reply),
            navigation: VALID_PAGES.has(parsed.navigation) ? parsed.navigation : null,
          };
        }
      } catch { /* fall through */ }
    }
  }

  // Fallback: treat entire response as reply
  return { reply: cleaned, navigation: null };
}

// ─── Sanitize output (strip dangerous content) ─────────────
function sanitizeOutput(text: string): string {
  return text
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/<embed\b[^>]*>/gi, '')
    .replace(/javascript\s*:/gi, '')
    .replace(/<[^>]+on\w+\s*=\s*["'][^"']*["'][^>]*>/gi, '')
    .trim();
}

// ═══════════════════════════════════════════════════════════════════
// POST: Process voice transcript and return Snowwe response
// ═══════════════════════════════════════════════════════════════════
export async function POST(req: NextRequest) {
  try {
    // ─── 1. Optional Auth: Extract user context ────────────
    let userContext = 'Guest User (not authenticated)';
    let userId: string | null = null;

    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (token) {
      const payload = verifyToken(token);
      if (payload) {
        userId = payload.userId;
        // Try to get user profile from database (non-blocking)
        try {
          const dbUser = await db.user.findUnique({
            where: { id: userId },
            select: { name: true, role: true, batch: true, department: true },
          });
          if (dbUser) {
            userContext = `Name: ${dbUser.name}, Role: ${dbUser.role}, Batch: ${dbUser.batch || 'N/A'}, Department: ${dbUser.department || 'N/A'}`;
          } else {
            userContext = `Name: ${payload.name || 'User'}, Role: ${payload.role}, ID: ${userId}`;
          }
        } catch (dbErr) {
          // DB not available — use token data
          console.warn('[Snowwe] DB lookup failed, using token data:', dbErr instanceof Error ? dbErr.message : dbErr);
          userContext = `Name: ${payload.name || 'User'}, Role: ${payload.role}`;
        }
      }
    }

    // ─── 2. Rate limit ────────────────────────────────────
    const ip = getClientIp(req);
    const rlKey = `${ip}:${userId || 'guest'}`;
    const rl = checkRateLimit(rlKey, snowweLimiter);
    if (!rl.allowed) {
      return NextResponse.json(
        { reply: 'আপনি খুব দ্রুত কথা বলছেন! একটু অপেক্ষা করুন।', navigation: null },
        { status: 429 },
      );
    }

    // ─── 3. Parse request body ────────────────────────────
    const body = await req.json().catch(() => null);
    if (!body || !body.transcript || typeof body.transcript !== 'string') {
      return NextResponse.json(
        { reply: 'দুঃখিত, আমি আপনার কথা বুঝতে পারিনি। আবার বলুন।', navigation: null },
        { status: 400 },
      );
    }

    const { transcript, currentPageState } = body;
    const currentPage = currentPageState || 'dashboard';

    if (transcript.length > 1000) {
      return NextResponse.json(
        { reply: 'এটা অনেক বড়! একটু ছোট করে বলুন।', navigation: null },
        { status: 400 },
      );
    }

    // ─── 4. Build Snowwe prompt with user context ──────────
    const systemPrompt = buildSnowwePrompt(userContext, currentPage);

    const messages: AIMessage[] = [
      { role: 'user', content: transcript },
    ];

    // ─── 5. Call AI router (non-streaming for voice) ───────
    const result = await chatAI(messages, 'voice', { stream: false });

    let rawResponse: string;
    if (typeof result === 'string') {
      rawResponse = sanitizeOutput(result);
    } else {
      // Consume stream if returned unexpectedly
      const reader = (result as ReadableStream<string>).getReader();
      const decoder = new TextDecoder();
      let collected = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        collected += typeof value === 'string' ? value : decoder.decode(value as BufferSource, { stream: true });
      }
      rawResponse = sanitizeOutput(collected);
    }

    // ─── 6. Parse structured response ─────────────────────
    const parsed = parseSnowweResponse(rawResponse);

    // Truncate long responses for speech
    if (parsed.reply.length > 500) {
      parsed.reply = parsed.reply.slice(0, 500).trim() + '…';
    }

    console.log(`[Snowwe] User: ${userId || 'guest'} | Page: ${currentPage} | Nav: ${parsed.navigation}`);

    return NextResponse.json({
      reply: parsed.reply,
      navigation: parsed.navigation,
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      return NextResponse.json(
        { reply: 'রিকোয়েস্ট বাতিল হয়েছে।', navigation: null },
        { status: 499 },
      );
    }

    console.error('[Snowwe] Error:', error instanceof Error ? error.message : error);
    return NextResponse.json(
      { reply: 'দুঃখিত, এই মুহূর্তে আমি সংযোগ স্থাপন করতে পারছি না। আবার চেষ্টা করুন।', navigation: null },
      { status: 500 },
    );
  }
}
