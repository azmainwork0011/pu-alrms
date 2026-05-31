/**
 * Snowwe Voice Assistant — AI Backend Route (v2 — Gemini Pro + Google Cloud TTS Neural2)
 *
 * Architecture:
 * 1. Frontend captures voice via Web Speech API → sends text to this endpoint
 * 2. Backend sends text to Gemini Pro with advanced Snowwe system prompt
 * 3. Gemini Pro returns beautifully crafted Bangla/English text response
 * 4. Backend sends text to Google Cloud Text-to-Speech API (Neural2-A for Bangla)
 * 5. Backend returns JSON: { reply, navigation, audioBuffer (base64 MP3) }
 * 6. Frontend plays the premium MP3 audio with beautiful UI states
 *
 * Environment Variables needed:
 * - GEMINI_API_KEY: Google Gemini API key (required for brain)
 * - GOOGLE_CLOUD_TTS_KEY: Base64-encoded Google Cloud service account JSON (required for voice)
 *   Or set GOOGLE_APPLICATION_CREDENTIALS to a file path (not usable on Vercel)
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/jwt';
import { db } from '@/lib/db';
import { checkRateLimit, getClientIp } from '@/lib/security/rate-limit';
import { geminiChat, type GeminiMessage, isGeminiAvailable } from '@/lib/ai/gemini';

// ─── Rate limiting: 20 requests per minute ──────────────────
const snowweLimiter = { windowMs: 60_000, max: 20, keyPrefix: 'snowwe-voice-v2' };

// ─── Valid navigation targets (must match Zustand PageView) ─
const VALID_PAGES = new Set([
  'dashboard', 'admin-panel', 'assignments', 'lab-reports',
  'create-assignment', 'submissions', 'student-tasks',
  'leaderboard', 'announcements', 'student-community',
  'quiz', 'code-quest', 'books', 'ai-chat', 'notifications', 'profile',
  'cr-dashboard',
]);

// ═══════════════════════════════════════════════════════════════════
//  SNOWWE ADVANCED SYSTEM PROMPT (Gemini Pro — The Brain)
// ═══════════════════════════════════════════════════════════════════
function buildSnowweSystemPrompt(userContext: string, currentPage: string): string {
  return `You are "Snowwe" (স্নোয়ি), an ultra-intelligent, warm, and culturally-aware AI voice assistant built into Prime University's Academic Learning Management System — PU-ALRMS. You are powered by the most advanced language model technology.

## 🧠 CORE IDENTITY & INTELLECT
- You think deeply, justify your answers with logic, and provide highly accurate, well-reasoned solutions.
- You have expertise in computer science, electrical engineering, business administration, law, mathematics, physics, chemistry, and all university-level academic subjects.
- You never say "As an AI..." or "I am a language model..." — you ARE Snowwe, a unique personality.
- When you don't know something, you honestly say so rather than fabricating information.

## 🗣️ LANGUAGE BEHAVIOR — CRITICAL
- You are natively fluent in both Bangla (বাংলা) and English.
- If the user speaks in Bangla, you MUST respond in **pure, standard, sweet academic Bangla (প্রমিত বাংলা)**.
- AVOID: Broken grammar, literal English-to-Bangla word-by-word translations, robotic phrasing, awkward transliterations.
- USE: Natural Bangla sentence structures, idioms where appropriate, sweet and respectful tone (আপনি/তুম context-aware).
- For technical terms (API, database, algorithm, etc.), use the English term in Bangla context naturally (e.g., "ডাটাবেস কনেকশন", "অ্যালগরিদমটি").
- English questions → English response. Bangla questions → Bangla response. Mixed → match user's dominant language.

## 🎙️ VOICE OUTPUT FORMATTING — CRITICAL
- Your responses will be SPOKEN ALOUD. Optimize for LISTENING, not reading.
- Keep responses CONCISE: 2-4 sentences maximum for most queries.
- AVOID: Long bullet lists, complex markdown, numbered steps, code blocks, tables — these sound terrible when spoken.
- USE: Natural speech patterns, conversational flow, connecting words (তাই, কিন্তু, যেহেতু, অতএব).
- For complex topics: Give a clear summary first, then elaborate briefly.
- For navigation: Give warm, encouraging directions.
- Add warmth markers: "ভালো প্রশ্ন!", "চমৎকার!", "একদম সঠিক!" where natural.

## 👤 USER CONTEXT
- User Info: ${userContext || 'Guest (not logged in)'}
- Current Page: ${currentPage}

## 🧭 NAVIGATION COMMANDS
If the user wants to go to a specific page, include a "navigation" field in your JSON response.
Valid pages: dashboard, admin-panel, assignments, lab-reports, create-assignment, submissions, student-tasks, leaderboard, announcements, student-community, quiz, code-quest, books, ai-chat, notifications, profile, cr-dashboard.

## 📋 RESPONSE FORMAT — STRICT JSON
You MUST respond with ONLY a valid JSON object. No markdown, no code blocks, no extra text.

{
  "reply": "Your spoken text response here — concise, warm, natural Bangla or English",
  "navigation": "page-name" OR null
}

Examples:
User asks in Bangla: "আমাকে অ্যাসাইনমেন্ট পেজে নিয়ে যাও"
→ {"reply": "একদম, এখনই অ্যাসাইনমেন্ট পেজে নিয়ে যাচ্ছি!", "navigation": "assignments"}

User asks: "What is GPA?"
→ {"reply": "GPA stands for Grade Point Average. It's calculated by dividing total grade points by total credit hours in a semester.", "navigation": null}

User asks: "ডাটাবেস কী?"
→ {"reply": "ডাটাবেস হলো এমন একটি সিস্টেম যেখানে ডাটা সুশৃঙ্খলভাবে সংরক্ষণ করা হয়। SQL ডাটাবেজে টেবিলে ডাটা রাখা হয়, আর NoSQL ডাটাবেজে ডকুমেন্ট বা কি-ভ্যালু আকারে রাখা হয়।", "navigation": null}

REMEMBER: Only output valid JSON. This is for voice output — keep it natural and concise.`;
}

// ═══════════════════════════════════════════════════════════════════
//  GOOGLE CLOUD TEXT-TO-SPEECH — Neural2 Bangla Voice
// ═══════════════════════════════════════════════════════════════════

interface TTSConfig {
  languageCode: string;
  voiceName: string;
  ssmlGender: string;
  audioEncoding: string;
  speakingRate: number;
  pitch: number;
}

const BANGLA_TTS: TTSConfig = {
  languageCode: 'bn-IN',
  voiceName: 'bn-IN-Neural2-A',
  ssmlGender: 'FEMALE',
  audioEncoding: 'MP3',
  speakingRate: 1.0,
  pitch: 0.0,
};

const ENGLISH_TTS: TTSConfig = {
  languageCode: 'en-US',
  voiceName: 'en-US-Neural2-C',
  ssmlGender: 'FEMALE',
  audioEncoding: 'MP3',
  speakingRate: 1.0,
  pitch: 0.0,
};

/**
 * Detect if text contains Bangla characters
 */
function containsBangla(text: string): boolean {
  return /[\u0980-\u09FF]/.test(text);
}

/**
 * Get Google Cloud access token from service account credentials.
 * Uses the REST API directly — no SDK needed (works on Vercel serverless).
 */
async function getGoogleCloudAccessToken(): Promise<string | null> {
  const credentialsBase64 = process.env.GOOGLE_CLOUD_TTS_KEY;
  if (!credentialsBase64) return null;

  try {
    const credentialsJson = Buffer.from(credentialsBase64, 'base64').toString('utf-8');
    const credentials = JSON.parse(credentialsJson);

    const jwtPayload = {
      iss: credentials.client_email,
      scope: 'https://www.googleapis.com/auth/cloud-platform',
      aud: 'https://oauth2.googleapis.com/token',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600,
      sub: credentials.client_email,
    };

    // Sign JWT with RS256
    const { createSign } = await import('crypto');
    const header = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url');
    const payload = Buffer.from(JSON.stringify(jwtPayload)).toString('base64url');

    const sign = createSign('RSA-SHA256');
    sign.update(`${header}.${payload}`);
    const signature = sign.sign(credentials.private_key, 'base64url');

    const jwt = `${header}.${payload}.${signature}`;

    // Exchange JWT for access token
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=${jwt}`,
    });

    if (!tokenResponse.ok) {
      console.error('[TTS] Failed to get access token:', tokenResponse.status);
      return null;
    }

    const tokenData = await tokenResponse.json();
    return tokenData.access_token;
  } catch (err) {
    console.error('[TTS] Error getting access token:', err instanceof Error ? err.message : err);
    return null;
  }
}

/**
 * Synthesize speech using Google Cloud TTS REST API (Neural2 voice).
 * Returns base64-encoded MP3 audio, or null if TTS is unavailable.
 */
async function synthesizeSpeech(text: string, lang?: 'bn' | 'en'): Promise<string | null> {
  const accessToken = await getGoogleCloudAccessToken();
  if (!accessToken) return null;

  const detectedLang = lang || (containsBangla(text) ? 'bn' : 'en');
  const ttsConfig = detectedLang === 'bn' ? BANGLA_TTS : ENGLISH_TTS;

  try {
    const response = await fetch(
      'https://texttospeech.googleapis.com/v1/text:synthesize',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          input: { text },
          voice: {
            languageCode: ttsConfig.languageCode,
            name: ttsConfig.voiceName,
            ssmlGender: ttsConfig.ssmlGender,
          },
          audioConfig: {
            audioEncoding: ttsConfig.audioEncoding,
            speakingRate: ttsConfig.speakingRate,
            pitch: ttsConfig.pitch,
            effectsProfileId: ['headphone-class-device'],
          },
        }),
      }
    );

    if (!response.ok) {
      const errorBody = await response.text().catch(() => 'unknown');
      console.error(`[TTS] Google Cloud TTS error ${response.status}:`, errorBody.slice(0, 200));
      return null;
    }

    const data = await response.json();
    if (data.audioContent) {
      return data.audioContent as string; // Already base64 from Google
    }
    return null;
  } catch (err) {
    console.error('[TTS] Synthesis error:', err instanceof Error ? err.message : err);
    return null;
  }
}

// ═══════════════════════════════════════════════════════════════════
//  SAFE JSON PARSER
// ═══════════════════════════════════════════════════════════════════
function parseSnowweResponse(raw: string): { reply: string; navigation: string | null } {
  // Strip markdown code fences if present
  let cleaned = raw.replace(/```json\s*/gi, '').replace(/```\s*/gi, '').trim();

  try {
    const parsed = JSON.parse(cleaned);
    if (parsed.reply && typeof parsed.reply === 'string') {
      return {
        reply: String(parsed.reply),
        navigation: VALID_PAGES.has(parsed.navigation) ? parsed.navigation : null,
      };
    }
  } catch {
    const jsonMatch = cleaned.match(/\{[\s\S]*?"reply"[\s\S]*?\}/);
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

  return { reply: cleaned, navigation: null };
}

// ═══════════════════════════════════════════════════════════════════
//  SANITIZE OUTPUT
// ═══════════════════════════════════════════════════════════════════
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
//  POST: Process voice transcript → Gemini Pro → Google TTS → MP3
// ═══════════════════════════════════════════════════════════════════
export async function POST(req: NextRequest) {
  const startTime = Date.now();

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
        try {
          const dbUser = await db.user.findUnique({
            where: { id: userId },
            select: { name: true, role: true, batch: true, department: true },
          });
          if (dbUser) {
            userContext = `Name: ${dbUser.name}, Role: ${dbUser.role}, Batch: ${dbUser.batch || 'N/A'}, Dept: ${dbUser.department || 'N/A'}`;
          } else {
            userContext = `Name: ${payload.name || 'User'}, Role: ${payload.role}`;
          }
        } catch {
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
        { reply: 'আপনি খুব দ্রুত কথা বলছেন! একটু অপেক্ষা করুন।', navigation: null, audioBuffer: null },
        { status: 429 },
      );
    }

    // ─── 3. Parse request body ────────────────────────────
    const body = await req.json().catch(() => null);
    if (!body || !body.transcript || typeof body.transcript !== 'string') {
      return NextResponse.json(
        { reply: 'দুঃখিত, আমি আপনার কথা বুঝতে পারিনি। আবার বলুন।', navigation: null, audioBuffer: null },
        { status: 400 },
      );
    }

    const { transcript, currentPageState, conversationHistory } = body;
    const currentPage = currentPageState || 'dashboard';

    if (transcript.length > 1000) {
      return NextResponse.json(
        { reply: 'এটা অনেক বড়! একটু ছোট করে বলুন।', navigation: null, audioBuffer: null },
        { status: 400 },
      );
    }

    // ─── 4. Call Gemini Pro (Brain) ────────────────────────
    const systemPrompt = buildSnowweSystemPrompt(userContext, currentPage);

    // Build conversation history for context
    const geminiMessages: GeminiMessage[] = [];

    // Add recent conversation history for context awareness
    if (Array.isArray(conversationHistory) && conversationHistory.length > 0) {
      const recentHistory = conversationHistory.slice(-6); // Last 6 messages for context
      for (const msg of recentHistory) {
        if (msg.role === 'user') {
          geminiMessages.push({ role: 'user', content: msg.text });
        } else {
          geminiMessages.push({ role: 'model', content: msg.text });
        }
      }
    }

    // Add current user message
    geminiMessages.push({ role: 'user', content: transcript });

    let rawResponse: string;
    try {
      rawResponse = await geminiChat(geminiMessages, {
        model: 'gemini-2.0-flash', // Using latest stable model with system instruction support
        systemInstruction: systemPrompt,
        temperature: 0.8, // Slightly creative for natural speech
        maxTokens: 500, // Keep responses short for voice
      });
      rawResponse = sanitizeOutput(rawResponse);
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      console.error('[Snowwe] Gemini error:', errMsg);

      // Check if it's a quota/key issue — return 503 so frontend can show proper message
      if (errMsg.includes('quota') || errMsg.includes('QUOTA') || errMsg.includes('API_KEY') || errMsg.includes('403')) {
        return NextResponse.json(
          {
            reply: 'আমার AI ব্রেইন এই মুহূর্তে সীমাবদ্ধ। অনুগ্রহ করে কিছুক্ষণ পরে আবার চেষ্টা করুন, অথবা আমাকে লেখায় প্রশ্ন করুন।',
            navigation: null,
            audioBuffer: null,
            quotaExceeded: true,
          },
          { status: 503 },
        );
      }

      return NextResponse.json(
        { reply: 'দুঃখিত, আমি এই মুহূর্তে ভাবতে পারছি না। আবার চেষ্টা করুন।', navigation: null, audioBuffer: null },
        { status: 500 },
      );
    }

    // ─── 5. Parse structured response ─────────────────────
    const parsed = parseSnowweResponse(rawResponse);

    // Truncate long responses for speech
    if (parsed.reply.length > 400) {
      parsed.reply = parsed.reply.slice(0, 400).trim() + '…';
    }

    // ─── 6. Generate premium TTS audio (Voice) ────────────
    let audioBuffer: string | null = null;
    try {
      const ttsResult = await synthesizeSpeech(parsed.reply);
      if (ttsResult) {
        audioBuffer = ttsResult;
        console.log(`[Snowwe] ✅ TTS audio generated (${Math.round(ttsResult.length / 1024)}KB)`);
      } else {
        console.log('[Snowwe] TTS unavailable, frontend will use browser SpeechSynthesis');
      }
    } catch (err) {
      console.warn('[Snowwe] TTS failed, falling back to browser voice:', err instanceof Error ? err.message : err);
    }

    const elapsed = Date.now() - startTime;
    console.log(`[Snowwe] User: ${userId || 'guest'} | Page: ${currentPage} | Nav: ${parsed.navigation} | Latency: ${elapsed}ms`);

    return NextResponse.json({
      reply: parsed.reply,
      navigation: parsed.navigation,
      audioBuffer,
      ttsAvailable: !!audioBuffer,
    });
  } catch (error) {
    console.error('[Snowwe] Error:', error instanceof Error ? error.message : error);
    return NextResponse.json(
      { reply: 'দুঃখিত, এই মুহূর্তে আমি সংযোগ স্থাপন করতে পারছি না। আবার চেষ্টা করুন।', navigation: null, audioBuffer: null },
      { status: 500 },
    );
  }
}
