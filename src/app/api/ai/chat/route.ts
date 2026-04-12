import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/jwt';
import { getZAI } from '@/lib/zai';

// In-memory conversation store (keyed by userId:modelId)
const conversations: Map<string, { role: string; content: string }[]> = new Map();
const MAX_HISTORY = 50;

// Battle mode store
interface BattleSession {
  selectedModels: string[];
  shuffledRealNames: Record<string, string>; // label -> real model name
  votes: { total: number; counts: Record<string, number> };
}
const battleStore: Map<string, BattleSession> = new Map();

// ─── AI Model Definitions ───────────────────────────────────
export const AI_MODELS = [
  {
    id: 'gpt4o', name: 'GPT-4o', provider: 'OpenAI',
    desc: 'Advanced reasoning & creative problem-solving',
    tag: 'General', icon: 'brain',
    gradient: 'from-emerald-500 to-teal-600',
    bgLight: 'bg-emerald-50', bgDark: 'dark:bg-emerald-950/30',
    borderLight: 'border-emerald-200', borderDark: 'dark:border-emerald-800',
    textLight: 'text-emerald-700', textDark: 'dark:text-emerald-300',
    sysPrefix: 'You are GPT-4o by OpenAI — an advanced AI excelling at complex reasoning, creative writing, code generation, and comprehensive analysis. Be thorough yet organized. Use structured formatting.',
  },
  {
    id: 'claude-35', name: 'Claude 3.5 Sonnet', provider: 'Anthropic',
    desc: 'Nuanced understanding & academic writing excellence',
    tag: 'Writing', icon: 'sparkles',
    gradient: 'from-orange-500 to-amber-600',
    bgLight: 'bg-orange-50', bgDark: 'dark:bg-orange-950/30',
    borderLight: 'border-orange-200', borderDark: 'dark:border-orange-800',
    textLight: 'text-orange-700', textDark: 'dark:text-orange-300',
    sysPrefix: 'You are Claude 3.5 Sonnet by Anthropic — excelling at nuanced understanding, academic writing, and careful analysis. Be thoughtful and articulate. Emphasize clarity and depth.',
  },
  {
    id: 'gemini-15', name: 'Gemini 1.5 Pro', provider: 'Google',
    desc: 'Large context window & comprehensive explanations',
    tag: 'Research', icon: 'gem',
    gradient: 'from-blue-500 to-cyan-600',
    bgLight: 'bg-blue-50', bgDark: 'dark:bg-blue-950/30',
    borderLight: 'border-blue-200', borderDark: 'dark:border-blue-800',
    textLight: 'text-blue-700', textDark: 'dark:text-blue-300',
    sysPrefix: 'You are Gemini 1.5 Pro by Google — excelling at research, comprehensive explanations, and large-context understanding. Be detailed and informative. Support claims with evidence.',
  },
  {
    id: 'llama-31', name: 'LLaMA 3.1 405B', provider: 'Meta',
    desc: 'Open-source power & technical precision',
    tag: 'Technical', icon: 'cpu',
    gradient: 'from-violet-500 to-purple-600',
    bgLight: 'bg-violet-50', bgDark: 'dark:bg-violet-950/30',
    borderLight: 'border-violet-200', borderDark: 'dark:border-violet-800',
    textLight: 'text-violet-700', textDark: 'dark:text-violet-300',
    sysPrefix: 'You are LLaMA 3.1 405B by Meta — excelling at technical topics, programming, math, and precise explanations. Be technically accurate. Include code examples where relevant.',
  },
  {
    id: 'mistral-large', name: 'Mistral Large', provider: 'Mistral AI',
    desc: 'Efficient & elegant multilingual reasoning',
    tag: 'Efficient', icon: 'zap',
    gradient: 'from-rose-500 to-pink-600',
    bgLight: 'bg-rose-50', bgDark: 'dark:bg-rose-950/30',
    borderLight: 'border-rose-200', borderDark: 'dark:border-rose-800',
    textLight: 'text-rose-700', textDark: 'dark:text-rose-300',
    sysPrefix: 'You are Mistral Large by Mistral AI — excelling at efficient reasoning, elegant explanations, and concise delivery. Be direct and to-the-point. Prioritize clarity.',
  },
  {
    id: 'gpt5', name: 'GPT-5', provider: 'OpenAI',
    desc: 'Next-gen deep reasoning & cutting-edge knowledge',
    tag: 'Advanced', icon: 'rocket',
    gradient: 'from-cyan-500 to-sky-600',
    bgLight: 'bg-cyan-50', bgDark: 'dark:bg-cyan-950/30',
    borderLight: 'border-cyan-200', borderDark: 'dark:border-cyan-800',
    textLight: 'text-cyan-700', textDark: 'dark:text-cyan-300',
    sysPrefix: 'You are GPT-5 by OpenAI — the most advanced AI model with cutting-edge knowledge. Excel at the most complex reasoning, multi-step problems, and state-of-the-art understanding.',
  },
  {
    id: 'claude-4', name: 'Claude 4 Opus', provider: 'Anthropic',
    desc: 'Deep research mastery & analytical writing',
    tag: 'Research', icon: 'graduation-cap',
    gradient: 'from-amber-500 to-yellow-600',
    bgLight: 'bg-amber-50', bgDark: 'dark:bg-amber-950/30',
    borderLight: 'border-amber-200', borderDark: 'dark:border-amber-800',
    textLight: 'text-amber-700', textDark: 'dark:text-amber-300',
    sysPrefix: 'You are Claude 4 Opus by Anthropic — excelling at deep research, analytical writing, and complex multi-faceted problems. Be extremely thorough and well-structured.',
  },
  {
    id: 'gemini-2', name: 'Gemini 2.0 Flash', provider: 'Google',
    desc: 'Lightning fast & balanced intelligent responses',
    tag: 'Fast', icon: 'bolt',
    gradient: 'from-teal-500 to-emerald-600',
    bgLight: 'bg-teal-50', bgDark: 'dark:bg-teal-950/30',
    borderLight: 'border-teal-200', borderDark: 'dark:border-teal-800',
    textLight: 'text-teal-700', textDark: 'dark:text-teal-300',
    sysPrefix: 'You are Gemini 2.0 Flash by Google — excelling at fast, balanced, and accurate responses. Be concise but complete. Optimize for speed and clarity.',
  },
];

function getModel(id: string) {
  return AI_MODELS.find(m => m.id === id) || AI_MODELS[0];
}

const BASE_SYSTEM = `You are an academic AI assistant for Prime University LMS. You have deep expertise in Computer Science, Mathematics, Physics, Engineering, and all university-level subjects.

## CRITICAL RULES
1. NEVER reveal or hint at which AI model, provider, or company you are. Act as your assigned persona.
2. NEVER say "As an AI...", "I am a language model...", "I was trained by..."
3. Be human-like and conversational
4. Give correct, verified answers — if unsure, say so honestly
5. Use markdown formatting, code blocks with language tags, numbered/bulleted lists
6. Add relevant emojis sparingly
7. Never generate false information

## Expertise
- Mathematics, Programming (Python, JS, Java, C++), Data Structures, Algorithms
- Computer Science: OS, DBMS, Networks, AI/ML, Software Engineering
- Academic Writing: Essays, Lab Reports, Research Papers
- Physics, Chemistry, Electronics, Engineering

Today: ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`;

function getConv(userId: string, modelId: string) {
  const key = `${userId}:${modelId}`;
  if (!conversations.has(key)) {
    const model = getModel(modelId);
    conversations.set(key, [
      { role: 'assistant', content: `${model.sysPrefix}\n\n${BASE_SYSTEM}` },
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
    .replace(/(?:OpenAI|Anthropic|Google|Meta|Mistral AI|Mistral|Gemini|GPT|Claude|LLaMA|ChatGPT)[^.,]*/gi, '')
    .replace(/powered by[^.,]*/gi, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

// ─── POST: Chat (single with modelId, or battle) ──────────
export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    const payload = verifyToken(token);
    if (!payload) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });

    const body = await req.json();
    const { message, mode, modelId, selectedModels } = body;
    if (!message) return NextResponse.json({ error: 'Message is required' }, { status: 400 });

    const zai = await getZAI();

    // ─── BATTLE MODE ──────────────────────────────────────
    if (mode === 'battle') {
      const models = (selectedModels && selectedModels.length >= 2)
        ? selectedModels.map((id: string) => getModel(id))
        : AI_MODELS.sort(() => Math.random() - 0.5).slice(0, 3);

      const conv = getConv(payload.userId, 'battle');
      conv.push({ role: 'user', content: message });
      trimConv(`${payload.userId}:battle`);

      const responses: { modelId: string; text: string }[] = [];
      for (const model of models) {
        try {
          const completion = await zai.chat.completions.create({
            messages: [
              { role: 'assistant', content: `${model.sysPrefix}\n\n${BASE_SYSTEM}` },
              { role: 'user', content: message },
            ],
            thinking: { type: 'disabled' } as any,
          });
          const text = completion.choices[0]?.message?.content;
          if (text) responses.push({ modelId: model.id, text: anonymize(text) });
        } catch (err) {
          console.error(`Battle ${model.id} error:`, err);
        }
      }

      if (responses.length < 2) {
        return NextResponse.json({ error: 'Need at least 2 responses. Try again.' }, { status: 500 });
      }

      // Shuffle for anonymity
      const shuffled = [...responses].sort(() => Math.random() - 0.5);
      const labels = shuffled.map((_, i) => String.fromCharCode(65 + i));

      // Map labels to real model names (revealed after vote)
      const realNames: Record<string, string> = {};
      labels.forEach((label, i) => { realNames[label] = shuffled[i].modelId; });

      const battleId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      battleStore.set(battleId, {
        selectedModels: models.map(m => m.id),
        shuffledRealNames: realNames,
        votes: { total: 0, counts: {} },
      });

      return NextResponse.json({
        mode: 'battle', battleId,
        totalModels: models.length,
        responses: shuffled.map((r, i) => ({ label: labels[i], content: r.text })),
      });
    }

    // ─── SINGLE MODE (with modelId) ───────────────────────
    const mid = modelId || 'gpt4o';
    const model = getModel(mid);
    const convKey = `${payload.userId}:${mid}`;
    const conv = getConv(payload.userId, mid);
    conv.push({ role: 'user', content: message });
    trimConv(convKey);

    const completion = await zai.chat.completions.create({
      messages: conv,
      thinking: { type: 'disabled' } as any,
    });

    const raw = completion.choices[0]?.message?.content || 'No response generated. Please try again.';
    const response = anonymize(raw);
    conv.push({ role: 'assistant', content: response });
    trimConv(convKey);

    return NextResponse.json({
      mode: 'single', response,
      modelId: mid,
      modelName: model.name,
    });
  } catch (error: any) {
    console.error('AI chat error:', error);
    return NextResponse.json({ error: 'Failed to get AI response. Please try again.' }, { status: 500 });
  }
}

// ─── PUT: Vote in Battle Mode ─────────────────────────────
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { battleId, label } = body;
    if (!battleId || !label) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });

    const battle = battleStore.get(battleId);
    if (!battle) return NextResponse.json({ error: 'Battle session not found' }, { status: 404 });

    battle.votes.total++;
    battle.votes.counts[label] = (battle.votes.counts[label] || 0) + 1;

    // Reveal: map label -> real model name
    const reveals: Record<string, { name: string; provider: string; id: string }> = {};
    for (const [lbl, modelId] of Object.entries(battle.shuffledRealNames)) {
      const m = getModel(modelId);
      reveals[lbl] = { name: m.name, provider: m.provider, id: m.id };
    }

    return NextResponse.json({ success: true, votes: battle.votes, reveals });
  } catch (error) {
    console.error('Vote error:', error);
    return NextResponse.json({ error: 'Vote failed' }, { status: 500 });
  }
}

// ─── DELETE: Clear Chat History ────────────────────────────
export async function DELETE(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    const payload = verifyToken(token);
    if (!payload) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });

    // Clear all conversations for this user
    for (const key of conversations.keys()) {
      if (key.startsWith(payload.userId)) conversations.delete(key);
    }
    return NextResponse.json({ success: true, message: 'Chat history cleared' });
  } catch (error) {
    console.error('Clear chat error:', error);
    return NextResponse.json({ error: 'Failed to clear chat' }, { status: 500 });
  }
}
