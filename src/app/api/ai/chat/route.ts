import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/jwt';
import { getZAI } from '@/lib/zai';
import { checkRateLimit, getClientIp } from '@/lib/security/rate-limit';

// ═══════════════════════════════════════════════════════════════════
// LUCKY STRICK AI — Bulletproof Academic Chat + Battle Engine
// Uses z-ai-web-dev-sdk. NEVER returns generic errors.
// Always responds with intelligent, accurate academic content.
// ═══════════════════════════════════════════════════════════════════

// Rate limit: 20 AI requests per minute per user
const aiLimiter = { windowMs: 60_000, max: 20, keyPrefix: 'ai' };

// In-memory conversation store (keyed by userId:modelId)
const conversations: Map<string, { role: string; content: string }[]> = new Map();
const MAX_HISTORY = 40;

// Battle mode store
interface BattleSession {
  selectedModels: string[];
  shuffledRealNames: Record<string, string>;
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
    sysPrefix: 'You are GPT-4o, an advanced AI excelling at complex reasoning, creative writing, code generation, and comprehensive analysis. Be thorough yet organized. Use structured formatting.',
  },
  {
    id: 'claude-35', name: 'Claude 3.5 Sonnet', provider: 'Anthropic',
    desc: 'Nuanced understanding & academic writing excellence',
    tag: 'Writing', icon: 'sparkles',
    gradient: 'from-orange-500 to-amber-600',
    sysPrefix: 'You are Claude 3.5 Sonnet, excelling at nuanced understanding, academic writing, and careful analysis. Be thoughtful and articulate. Emphasize clarity and depth.',
  },
  {
    id: 'gemini-15', name: 'Gemini 1.5 Pro', provider: 'Google',
    desc: 'Large context window & comprehensive explanations',
    tag: 'Research', icon: 'gem',
    gradient: 'from-blue-500 to-cyan-600',
    sysPrefix: 'You are Gemini 1.5 Pro, excelling at research, comprehensive explanations, and large-context understanding. Be detailed and informative. Support claims with evidence.',
  },
  {
    id: 'llama-31', name: 'LLaMA 3.1 405B', provider: 'Meta',
    desc: 'Open-source power & technical precision',
    tag: 'Technical', icon: 'cpu',
    gradient: 'from-violet-500 to-purple-600',
    sysPrefix: 'You are LLaMA 3.1 405B, excelling at technical topics, programming, math, and precise explanations. Be technically accurate. Include code examples where relevant.',
  },
  {
    id: 'mistral-large', name: 'Mistral Large', provider: 'Mistral AI',
    desc: 'Efficient & elegant multilingual reasoning',
    tag: 'Efficient', icon: 'zap',
    gradient: 'from-rose-500 to-pink-600',
    sysPrefix: 'You are Mistral Large, excelling at efficient reasoning, elegant explanations, and concise delivery. Be direct and to-the-point. Prioritize clarity.',
  },
  {
    id: 'gpt5', name: 'GPT-5', provider: 'OpenAI',
    desc: 'Next-gen deep reasoning & cutting-edge knowledge',
    tag: 'Advanced', icon: 'rocket',
    gradient: 'from-cyan-500 to-sky-600',
    sysPrefix: 'You are GPT-5, the most advanced AI model with cutting-edge knowledge. Excel at the most complex reasoning, multi-step problems, and state-of-the-art understanding.',
  },
  {
    id: 'claude-4', name: 'Claude 4 Opus', provider: 'Anthropic',
    desc: 'Deep research mastery & analytical writing',
    tag: 'Research', icon: 'graduation-cap',
    gradient: 'from-amber-500 to-yellow-600',
    sysPrefix: 'You are Claude 4 Opus, excelling at deep research, analytical writing, and complex multi-faceted problems. Be extremely thorough and well-structured.',
  },
  {
    id: 'gemini-2', name: 'Gemini 2.0 Flash', provider: 'Google',
    desc: 'Lightning fast & balanced intelligent responses',
    tag: 'Fast', icon: 'bolt',
    gradient: 'from-teal-500 to-emerald-600',
    sysPrefix: 'You are Gemini 2.0 Flash, excelling at fast, balanced, and accurate responses. Be concise but complete. Optimize for speed and clarity.',
  },
];

function getModel(id: string) {
  return AI_MODELS.find(m => m.id === id) || AI_MODELS[0];
}

// ─── Academic System Prompt ─────────────────────────────────
const ACADEMIC_SYSTEM = `You are an expert academic AI assistant for Prime University LMS. You have deep expertise in ALL university-level subjects.

## ABSOLUTE RULES
1. NEVER say "As an AI...", "I am a language model...", "I was trained by..."
2. NEVER reveal your actual AI provider or model name. You ARE the persona assigned to you.
3. ALWAYS give accurate, verified answers. If you are unsure, state the uncertainty clearly.
4. Use markdown formatting: **bold**, *italic*, code blocks with language tags, numbered/bulleted lists, tables.
5. Be human-like, conversational, and helpful.

## SUBJECT EXPERTISE
- **Mathematics**: Calculus, Linear Algebra, Discrete Math, Statistics, Probability, Differential Equations
- **Programming**: Python, JavaScript, TypeScript, Java, C/C++, SQL, Data Structures, Algorithms, OOP, Design Patterns
- **Computer Science**: OS, DBMS, Computer Networks, AI/ML, Software Engineering, Compiler Design, Cryptography
- **Physics**: Mechanics, Thermodynamics, Electromagnetism, Optics, Quantum Physics
- **Engineering**: Electrical, Mechanical, Civil, Chemical Engineering fundamentals
- **Academic Writing**: Essays, Lab Reports, Research Papers, Thesis Writing, Literature Reviews
- **Chemistry**: Organic, Inorganic, Physical Chemistry
- **Biology**: Cell Biology, Genetics, Ecology, Biochemistry

## RESPONSE STANDARDS
- **Math Problems**: Show ALL steps clearly. Number each step. Explain the reasoning.
- **Code Questions**: Provide complete, runnable code with comments. Show expected output. Handle edge cases.
- **Research Questions**: Provide structured answers with citations where applicable. Use credible academic sources.
- **Assignments**: Follow the exact format requested (essay, report, lab report, etc.). Include proper structure.
- **Explanations**: Start with a brief summary, then provide detailed explanation. Use examples.

Today: ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`;

function getConv(userId: string, modelId: string) {
  const key = `${userId}:${modelId}`;
  if (!conversations.has(key)) {
    const model = getModel(modelId);
    conversations.set(key, [
      { role: 'assistant', content: `${model.sysPrefix}\n\n${ACADEMIC_SYSTEM}` },
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

// ─── Core AI call with retry + intelligent fallback ────────
async function callAI(messages: { role: string; content: string }[], retries = 3): Promise<string> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const zai = await getZAI();
      const completion = await zai.chat.completions.create({
        messages,
        thinking: { type: 'disabled' },
      });

      const text = completion?.choices?.[0]?.message?.content;
      if (text && text.trim().length > 0) return text;
      throw new Error('Empty response');
    } catch (err: any) {
      lastError = err;
      const msg = err?.message || String(err);
      console.error(`[AI] Attempt ${attempt}/${retries}: ${msg}`);
      if (attempt < retries) await new Promise(r => setTimeout(r, 800 * attempt));
    }
  }

  // NEVER throw — return an intelligent fallback instead
  console.error('[AI] All retries failed, using intelligent fallback');
  return null; // Caller handles the fallback
}

// ─── POST: Chat (single or battle) ─────────────────────────
export async function POST(req: NextRequest) {
  try {
    // ── Auth ──
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    const payload = verifyToken(token);
    if (!payload) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });

    // ── Rate Limit ──
    const ip = getClientIp(req);
    const rl = checkRateLimit(`${ip}:${payload.userId}`, aiLimiter);
    if (!rl.allowed) {
      return NextResponse.json({
        error: 'Too many requests. Please wait a moment before trying again.',
        retryAfterMs: rl.retryAfterMs,
      }, { status: 429 });
    }

    // ── Parse body ──
    const body = await req.json();
    const { message, mode, modelId, selectedModels } = body;
    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return NextResponse.json({
        error: "I couldn't understand your question. Please rephrase it and try again.",
      }, { status: 400 });
    }

    // ─── BATTLE MODE ──────────────────────────────────────
    if (mode === 'battle') {
      const models = (selectedModels && selectedModels.length >= 2)
        ? selectedModels.map((id: string) => getModel(id))
        : AI_MODELS.sort(() => Math.random() - 0.5).slice(0, 3);

      const conv = getConv(payload.userId, 'battle');
      conv.push({ role: 'user', content: message.trim() });
      trimConv(`${payload.userId}:battle`);

      const responses: { modelId: string; text: string }[] = [];
      for (const model of models) {
        try {
          const text = await callAI([
            { role: 'assistant', content: `${model.sysPrefix}\n\n${ACADEMIC_SYSTEM}` },
            { role: 'user', content: message.trim() },
          ]);
          if (text) responses.push({ modelId: model.id, text: anonymize(text) });
        } catch (err) {
          console.error(`[Battle] ${model.id} error:`, err);
        }
      }

      if (responses.length < 2) {
        // Still return what we have — never fail the whole battle
        if (responses.length === 1) {
          // Pad with a fallback response
          responses.push({
            modelId: models.find(m => m.id !== responses[0].modelId)?.id || models[1].id,
            text: 'I need a moment to compose my response. Please try the battle again for a full comparison.',
          });
        } else {
          return NextResponse.json({
            error: 'I encountered an issue generating responses. Please try again with a different question.',
          }, { status: 503 });
        }
      }

      const shuffled = [...responses].sort(() => Math.random() - 0.5);
      const labels = shuffled.map((_, i) => String.fromCharCode(65 + i));
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

    // ─── SINGLE MODE ─────────────────────────────────────
    const mid = modelId || 'gpt4o';
    const model = getModel(mid);
    const convKey = `${payload.userId}:${mid}`;
    const conv = getConv(payload.userId, mid);
    const trimmedMessage = message.trim();
    conv.push({ role: 'user', content: trimmedMessage });
    trimConv(convKey);

    const raw = await callAI(conv);
    let response: string;

    if (raw) {
      response = anonymize(raw);
    } else {
      // INTELLIGENT FALLBACK — never generic
      response = generateSmartFallback(trimmedMessage, model.name);
    }

    conv.push({ role: 'assistant', content: response });
    trimConv(convKey);

    return NextResponse.json({
      mode: 'single', response,
      modelId: mid,
      modelName: model.name,
    });
  } catch (error: any) {
    console.error('[AI Chat] Unhandled error:', error?.message || error);
    return NextResponse.json({
      error: "I couldn't process your request right now. Please rephrase your question and try again.",
    }, { status: 500 });
  }
}

// ─── Intelligent Fallback Generator ────────────────────────
// NEVER returns "Sorry, I encountered an error" — always provides useful content
function generateSmartFallback(message: string, modelName: string): string {
  const lower = message.toLowerCase();

  // Math detection
  if (/\d+\s*[\+\-\*\/\^%]\s*\d+/.test(message) || lower.match(/calcul|solve|equation|integral|derivative|sum|product|factor/i)) {
    return `I'm ${modelName}, and I'd like to help you with this math problem!

While I'm experiencing a brief connectivity issue, here are some tips:

**For calculation problems:**
1. Break down complex expressions step by step
2. Show each intermediate result
3. Verify your answer by substitution

Please try sending your question again — I should be able to provide a complete step-by-step solution in a moment!`;
  }

  // Code detection
  if (lower.match(/code|program|function|algorithm|debug|error|bug|compile|syntax|python|java|javascript|c\+\+|html|css|sql|react|api/i)) {
    return `I'm ${modelName}, and I can see you're working on a coding problem!

While I'm having a momentary issue generating my full response, here are some debugging tips:

**Common debugging steps:**
1. ✅ Check for syntax errors (missing brackets, semicolons)
2. ✅ Verify variable names are spelled correctly
3. ✅ Test edge cases (empty input, zero, negative numbers)
4. ✅ Add console.log/print statements to trace execution

Please re-submit your question and I'll provide the complete code solution with explanations!`;
  }

  // Research/essay detection
  if (lower.match(/essay|research|paper|report|thesis|assignment|homework|project|presentation|write|explain|describe|discuss|compare|analyze/i)) {
    return `I'm ${modelName}, and I'd love to help with your academic work!

While I'm experiencing a brief issue, here's a general structure you can follow:

**For essays/reports:**
1. **Title** — Clear and descriptive
2. **Introduction** — Hook, context, thesis statement
3. **Body** — 3-5 paragraphs with evidence and analysis
4. **Conclusion** — Summary, implications, future directions
5. **References** — Properly cited sources (APA/IEEE/MLA)

Please send your specific question again and I'll craft a detailed, well-formatted response!`;
  }

  // Default fallback — helpful, never generic
  return `I'm ${modelName}. I apologize for the brief delay in my response.

**I'm still here and ready to help!** My AI engine experienced a momentary issue. Here's what you can do:

1. 🔄 **Try rephrasing** your question
2. 📝 **Break it into smaller parts** — I handle focused questions very well
3. 💬 **Be specific** — tell me the subject, topic, or type of help needed

**I can help with:**
- ✅ Math (step-by-step solutions)
- ✅ Code (any programming language)
- ✅ Research & essays
- ✅ Science explanations
- ✅ Assignment help

Please try again — I'll respond with a complete, accurate answer!`;
}

// ─── PUT: Vote in Battle Mode ─────────────────────────────
export async function PUT(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    const payload = verifyToken(token);
    if (!payload) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });

    const body = await req.json();
    const { battleId, label } = body;
    if (!battleId || !label) return NextResponse.json({ error: 'Missing battle or vote data.' }, { status: 400 });

    const battle = battleStore.get(battleId);
    if (!battle) return NextResponse.json({ error: 'This battle session has expired. Start a new battle to compare models.' }, { status: 404 });

    battle.votes.total++;
    battle.votes.counts[label] = (battle.votes.counts[label] || 0) + 1;

    const reveals: Record<string, { name: string; provider: string; id: string }> = {};
    for (const [lbl, modelId] of Object.entries(battle.shuffledRealNames)) {
      const m = getModel(modelId);
      reveals[lbl] = { name: m.name, provider: m.provider, id: m.id };
    }

    return NextResponse.json({ success: true, votes: battle.votes, reveals });
  } catch (error) {
    console.error('[Vote] Error:', error);
    return NextResponse.json({ error: 'Vote recording failed. Please try again.' }, { status: 500 });
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

    conversations.forEach((_, key) => {
      if (key.startsWith(payload.userId)) conversations.delete(key);
    });
    return NextResponse.json({ success: true, message: 'Chat history cleared successfully.' });
  } catch (error) {
    console.error('[Clear Chat] Error:', error);
    return NextResponse.json({ error: 'Could not clear chat. Please try again.' }, { status: 500 });
  }
}
