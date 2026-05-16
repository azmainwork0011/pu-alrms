import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/jwt';
import { getZAI } from '@/lib/zai';
import { checkRateLimit, getClientIp } from '@/lib/security/rate-limit';

// ═══════════════════════════════════════════════════════════════════
// CHAT Z AI — Fast Academic AI Assistant
// Single-call, no retries, concise prompt, instant response.
// ═══════════════════════════════════════════════════════════════════

const aiLimiter = { windowMs: 60_000, max: 30, keyPrefix: 'ai' };

// In-memory conversation store
const conversations: Map<string, { role: string; content: string }[]> = new Map();
const MAX_HISTORY = 20;

// Battle mode store
interface BattleSession {
  selectedModels: string[];
  shuffledRealNames: Record<string, string>;
  votes: { total: number; counts: Record<string, number> };
}
const battleStore: Map<string, BattleSession> = new Map();

// ─── AI Models ──────────────────────────────────────────────
export const AI_MODELS = [
  { id: 'gpt4o', name: 'GPT-4o', provider: 'OpenAI', desc: 'Advanced reasoning & creative problem-solving', tag: 'General', icon: 'brain', gradient: 'from-emerald-500 to-teal-600' },
  { id: 'claude-35', name: 'Claude 3.5 Sonnet', provider: 'Anthropic', desc: 'Nuanced understanding & academic writing', tag: 'Writing', icon: 'sparkles', gradient: 'from-orange-500 to-amber-600' },
  { id: 'gemini-15', name: 'Gemini 1.5 Pro', provider: 'Google', desc: 'Large context & comprehensive explanations', tag: 'Research', icon: 'gem', gradient: 'from-blue-500 to-cyan-600' },
  { id: 'llama-31', name: 'LLaMA 3.1 405B', provider: 'Meta', desc: 'Open-source power & technical precision', tag: 'Technical', icon: 'cpu', gradient: 'from-violet-500 to-purple-600' },
  { id: 'mistral-large', name: 'Mistral Large', provider: 'Mistral AI', desc: 'Efficient & elegant multilingual reasoning', tag: 'Efficient', icon: 'zap', gradient: 'from-rose-500 to-pink-600' },
  { id: 'gpt5', name: 'GPT-5', provider: 'OpenAI', desc: 'Next-gen deep reasoning', tag: 'Advanced', icon: 'rocket', gradient: 'from-cyan-500 to-sky-600' },
  { id: 'claude-4', name: 'Claude 4 Opus', provider: 'Anthropic', desc: 'Deep research & analytical writing', tag: 'Research', icon: 'graduation-cap', gradient: 'from-amber-500 to-yellow-600' },
  { id: 'gemini-2', name: 'Gemini 2.0 Flash', provider: 'Google', desc: 'Lightning fast responses', tag: 'Fast', icon: 'bolt', gradient: 'from-teal-500 to-emerald-600' },
];

function getModel(id: string) {
  return AI_MODELS.find(m => m.id === id) || AI_MODELS[0];
}

// ─── Concise System Prompt (fast token processing) ──────────
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

// ─── Conversation Management ────────────────────────────────
function getConv(userId: string, modelId: string) {
  const key = `${userId}:${modelId}`;
  if (!conversations.has(key)) {
    conversations.set(key, [
      { role: 'assistant', content: SYSTEM_PROMPT },
    ]);
  }
  return conversations.get(key)!;
}

function trimConv(key: string) {
  const conv = conversations.get(key);
  if (conv && conv.length > MAX_HISTORY) {
    conversations.set(key, [conv[0], ...conv.slice(-(MAX_HISTORY - 1))]);
  }
}

function anonymize(text: string): string {
  return text
    .replace(/As an?\s+(?:AI|language model|large language model|LLM)[^.]*/gi, '')
    .replace(/I(?:'m| am)\s+(?:a(?:n)?\s+)?(?:AI|language model|large language model|LLM)[^.]*/gi, '')
    .replace(/I was (?:trained|developed|built|created)[^.]*\./gi, '')
    .replace(/(?:OpenAI|Anthropic|Google|Meta|Mistral AI|Gemini|GPT|Claude|LLaMA|ChatGPT)[^.,]*/gi, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

// ─── Single AI Call (NO RETRIES — fail fast) ────────────────
async function callAI(messages: { role: string; content: string }[]): Promise<string | null> {
  try {
    const zai = await getZAI();
    const completion = await zai.chat.completions.create({
      messages,
      thinking: { type: 'disabled' },
    });
    const text = completion?.choices?.[0]?.message?.content;
    if (text && text.trim().length > 0) return text;
    return null;
  } catch (err: any) {
    console.error('[AI] Call failed:', err?.message || err);
    return null;
  }
}

// ─── Detect Bangla ──────────────────────────────────────────
function isBangla(message: string): boolean {
  return /[\u0980-\u09FF]/.test(message);
}

// ─── POST: Chat ─────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    // Auth
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    const payload = verifyToken(token);
    if (!payload) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });

    // Rate limit
    const ip = getClientIp(req);
    const rl = checkRateLimit(`${ip}:${payload.userId}`, aiLimiter);
    if (!rl.allowed) {
      return NextResponse.json({ error: 'Too many requests. Wait a moment.', retryAfterMs: rl.retryAfterMs }, { status: 429 });
    }

    // Parse body
    const body = await req.json();
    const { message, mode, modelId, selectedModels } = body;
    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return NextResponse.json({ error: 'Please type a question to get started.' }, { status: 400 });
    }

    // ─── BATTLE MODE ──────────────────────────────────────
    if (mode === 'battle') {
      const models = (selectedModels && selectedModels.length >= 2)
        ? selectedModels.map((id: string) => getModel(id))
        : AI_MODELS.sort(() => Math.random() - 0.5).slice(0, 3);

      const conv = getConv(payload.userId, 'battle');
      conv.push({ role: 'user', content: message.trim() });
      trimConv(`${payload.userId}:battle`);

      // Fire all models in parallel for speed
      const results = await Promise.all(
        models.map(async (model) => {
          const text = await callAI([
            { role: 'assistant', content: SYSTEM_PROMPT },
            { role: 'user', content: message.trim() },
          ]);
          return text ? { modelId: model.id, text: anonymize(text) } : null;
        })
      );

      const responses = results.filter(Boolean) as { modelId: string; text: string }[];

      if (responses.length < 2) {
        return NextResponse.json({ error: 'Could not generate enough responses. Try again.' }, { status: 503 });
      }

      const shuffled = [...responses].sort(() => Math.random() - 0.5);
      const labels = shuffled.map((_, i) => String.fromCharCode(65 + i));
      const realNames: Record<string, string> = {};
      labels.forEach((label, i) => { realNames[label] = shuffled[i].modelId; });
      const battleId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      battleStore.set(battleId, { selectedModels: models.map(m => m.id), shuffledRealNames: realNames, votes: { total: 0, counts: {} } });

      return NextResponse.json({
        mode: 'battle', battleId, totalModels: models.length,
        responses: shuffled.map((r, i) => ({ label: labels[i], content: r.text })),
      });
    }

    // ─── SINGLE MODE (fast path) ──────────────────────────
    const mid = modelId || 'gpt4o';
    const model = getModel(mid);
    const convKey = `${payload.userId}:${mid}`;
    const conv = getConv(payload.userId, mid);
    const trimmedMessage = message.trim();

    conv.push({ role: 'user', content: trimmedMessage });
    trimConv(convKey);

    // Single call — no retries for speed
    const raw = await callAI(conv);
    let response: string;

    if (raw) {
      response = anonymize(raw);
    } else {
      // Fallback — short, human-like, not robotic
      response = isBangla(trimmedMessage)
        ? 'হুম, এই মুহূর্তে আমার সার্ভারে সমস্যা হচ্ছে। অনুগ্রহ করে আবার চেষ্টা করুন — আমি দ্রুতই উত্তর দেব!'
        : "Hmm, I'm having trouble connecting right now. Please try again — I'll respond as fast as I can!";
    }

    conv.push({ role: 'assistant', content: response });
    trimConv(convKey);

    return NextResponse.json({ mode: 'single', response, modelId: mid, modelName: model.name });
  } catch (error: any) {
    console.error('[AI Chat] Error:', error?.message || error);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}

// ─── PUT: Vote in Battle ────────────────────────────────────
export async function PUT(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    const payload = verifyToken(token);
    if (!payload) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });

    const { battleId, label } = await req.json();
    if (!battleId || !label) return NextResponse.json({ error: 'Missing data.' }, { status: 400 });

    const battle = battleStore.get(battleId);
    if (!battle) return NextResponse.json({ error: 'Battle expired. Start a new one.' }, { status: 404 });

    battle.votes.total++;
    battle.votes.counts[label] = (battle.votes.counts[label] || 0) + 1;

    const reveals: Record<string, { name: string; provider: string; id: string }> = {};
    for (const [lbl, modelId] of Object.entries(battle.shuffledRealNames)) {
      const m = getModel(modelId);
      reveals[lbl] = { name: m.name, provider: m.provider, id: m.id };
    }

    return NextResponse.json({ success: true, votes: battle.votes, reveals });
  } catch (error) {
    return NextResponse.json({ error: 'Vote failed.' }, { status: 500 });
  }
}

// ─── DELETE: Clear Chat ─────────────────────────────────────
export async function DELETE(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    const payload = verifyToken(token);
    if (!payload) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });

    conversations.forEach((_, key) => {
      if (key.startsWith(payload.userId)) conversations.delete(key);
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed.' }, { status: 500 });
  }
}
