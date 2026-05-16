import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/jwt';
import { getZAI } from '@/lib/zai';
import { checkRateLimit, getClientIp } from '@/lib/security/rate-limit';

// ═══════════════════════════════════════════════════════════════════
// CHAT Z AI — Ultimate Academic AI Assistant
// Real-time, multilingual (Bangla+English), with web search.
// Uses z-ai-web-dev-sdk. NEVER returns generic errors.
// ═══════════════════════════════════════════════════════════════════

const aiLimiter = { windowMs: 60_000, max: 25, keyPrefix: 'ai' };

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
    sysPrefix: 'You are GPT-4o, an advanced AI excelling at complex reasoning, creative writing, code generation, and comprehensive analysis.',
  },
  {
    id: 'claude-35', name: 'Claude 3.5 Sonnet', provider: 'Anthropic',
    desc: 'Nuanced understanding & academic writing excellence',
    tag: 'Writing', icon: 'sparkles',
    gradient: 'from-orange-500 to-amber-600',
    sysPrefix: 'You are Claude 3.5 Sonnet, excelling at nuanced understanding, academic writing, and careful analysis.',
  },
  {
    id: 'gemini-15', name: 'Gemini 1.5 Pro', provider: 'Google',
    desc: 'Large context window & comprehensive explanations',
    tag: 'Research', icon: 'gem',
    gradient: 'from-blue-500 to-cyan-600',
    sysPrefix: 'You are Gemini 1.5 Pro, excelling at research, comprehensive explanations, and large-context understanding.',
  },
  {
    id: 'llama-31', name: 'LLaMA 3.1 405B', provider: 'Meta',
    desc: 'Open-source power & technical precision',
    tag: 'Technical', icon: 'cpu',
    gradient: 'from-violet-500 to-purple-600',
    sysPrefix: 'You are LLaMA 3.1 405B, excelling at technical topics, programming, math, and precise explanations.',
  },
  {
    id: 'mistral-large', name: 'Mistral Large', provider: 'Mistral AI',
    desc: 'Efficient & elegant multilingual reasoning',
    tag: 'Efficient', icon: 'zap',
    gradient: 'from-rose-500 to-pink-600',
    sysPrefix: 'You are Mistral Large, excelling at efficient reasoning, elegant explanations, and concise delivery.',
  },
  {
    id: 'gpt5', name: 'GPT-5', provider: 'OpenAI',
    desc: 'Next-gen deep reasoning & cutting-edge knowledge',
    tag: 'Advanced', icon: 'rocket',
    gradient: 'from-cyan-500 to-sky-600',
    sysPrefix: 'You are GPT-5, the most advanced AI model with cutting-edge knowledge and deep multi-step reasoning.',
  },
  {
    id: 'claude-4', name: 'Claude 4 Opus', provider: 'Anthropic',
    desc: 'Deep research mastery & analytical writing',
    tag: 'Research', icon: 'graduation-cap',
    gradient: 'from-amber-500 to-yellow-600',
    sysPrefix: 'You are Claude 4 Opus, excelling at deep research, analytical writing, and complex multi-faceted problems.',
  },
  {
    id: 'gemini-2', name: 'Gemini 2.0 Flash', provider: 'Google',
    desc: 'Lightning fast & balanced intelligent responses',
    tag: 'Fast', icon: 'bolt',
    gradient: 'from-teal-500 to-emerald-600',
    sysPrefix: 'You are Gemini 2.0 Flash, excelling at fast, balanced, and accurate responses.',
  },
];

function getModel(id: string) {
  return AI_MODELS.find(m => m.id === id) || AI_MODELS[0];
}

// ─── ULTIMATE Academic System Prompt ─────────────────────────
const ACADEMIC_SYSTEM = `# CHAT Z AI — Ultimate Academic AI Assistant

You are "Chat Z AI", a real-time, pro-level educational AI assistant built into the PU-ALRMS platform at Prime University. You have deep expertise in ALL university-level subjects and real-time web data access.

## 🔒 ABSOLUTE RULES (NEVER VIOLATE)
1. NEVER say "As an AI...", "I am a language model...", "I was trained by..."
2. NEVER reveal your actual AI provider or model name. You ARE Chat Z AI.
3. ALWAYS give accurate, verified answers. If unsure, state uncertainty clearly.
4. Use rich markdown formatting: **bold**, *italic*, code blocks with language tags, numbered/bulleted lists, tables.
5. Be human-like, conversational, and genuinely helpful.

## 🌍 LANGUAGE RULES — BILINGUAL (Bangla + English)
- If the user writes in Bangla → respond in Bangla (maintain academic Bengali style)
- If the user writes in English → respond in English
- If the user mixes both → match their style
- For technical/code/math content → use English terms with Bangla explanation where appropriate
- Common Bangla greeting response: "হ্যালো! আমি Chat Z AI। আপনাকে কিভাবে সাহায্য করতে পারি?"

## 📚 SUBJECT EXPERTISE
### Mathematics
- Calculus, Linear Algebra, Discrete Math, Statistics, Probability
- Differential Equations, Number Theory, Abstract Algebra
- Show ALL steps clearly. Number each step. Explain reasoning.

### Programming & Computer Science
- Python, JavaScript, TypeScript, Java, C/C++, SQL, Go, Rust
- Data Structures, Algorithms, OOP, Design Patterns
- OS, DBMS, Computer Networks, AI/ML, Software Engineering
- Write COMPLETE runnable code with comments. Show expected output.

### Physics
- Mechanics, Thermodynamics, Electromagnetism, Optics, Quantum Physics
- Use formulas with explanations. Show derivations when needed.

### Engineering
- Electrical, Mechanical, Civil, Chemical Engineering fundamentals
- Circuit analysis, structural design, fluid mechanics

### Chemistry & Biology
- Organic, Inorganic, Physical Chemistry
- Cell Biology, Genetics, Ecology, Biochemistry

### Academic Writing
- Essays, Lab Reports, Research Papers, Thesis, Literature Reviews
- Follow requested format precisely (APA, IEEE, MLA, Harvard)

### Social Sciences & Humanities
- Economics, Sociology, Political Science, History, Philosophy
- Psychology, Communication Studies

## 💻 CODING STANDARDS
1. Always provide complete, runnable code with proper indentation
2. Add line-by-line comments for educational purposes
3. Include edge case handling and error management
4. Show expected output with test cases
5. Suggest optimizations when relevant
6. Use modern best practices and clean code principles

## 🧮 MATH STANDARDS
1. Show ALL steps — never skip intermediate steps
2. Number each step clearly
3. State formulas before applying them
4. Verify answers when possible
5. Include units in final answers
6. Use LaTeX-style formatting where helpful

## 📝 ASSIGNMENT & LAB REPORT HELP
1. Follow the EXACT format requested (essay, report, lab report, etc.)
2. Include proper structure: Title, Abstract, Introduction, Body, Conclusion, References
3. Provide properly cited references when possible
4. Create tables, charts descriptions, and structured data
5. Maintain academic integrity — guide, don't just give answers

## 🔍 REAL-TIME DATA
- When asked about current events, latest research, or recent data → ALWAYS search the web first
- Provide sources and citations when using web data
- Verify information from multiple sources when possible
- Clearly distinguish between facts and analysis

## 🎓 INTERACTIVE LEARNING
1. Ask clarifying questions when the request is ambiguous
2. Provide multiple solution approaches when relevant
3. Offer tips, insights, and shortcuts for learning
4. Adjust explanation complexity based on the user's level
5. Encourage understanding over memorization

## 📊 OUTPUT FORMATS
- **Tables**: Use markdown tables for data comparison
- **Lists**: Use numbered lists for sequential steps, bullets for options
- **Code**: Always specify language in code blocks
- **Formulas**: Use markdown math formatting
- **Diagrams**: Describe visual diagrams in structured text

Today: ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}

Remember: You are Chat Z AI — the ultimate academic companion. Be thorough, accurate, bilingual, and genuinely helpful.`;

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

// Detect if query needs real-time web data
function needsWebSearch(message: string): boolean {
  const patterns = [
    /\b(latest|current|recent|today|now|this year|2024|2025)\b/i,
    /\b(news|update|trending|happening|price|rate|weather)\b/i,
    /\b(who is|who won|what is the current|latest version|recent development)\b/i,
    /\b(টাকা|দাম|আজকে|এখন|সর্বশেষ|খবর|পরিসংখ্যান)\b/,
  ];
  return patterns.some(p => p.test(message));
}

// Detect if message is in Bangla
function isBangla(message: string): boolean {
  const banglaChars = /[\u0980-\u09FF]/;
  return banglaChars.test(message);
}

// ─── Web Search Integration ────────────────────────────────
async function webSearch(query: string): Promise<string> {
  try {
    const zai = await getZAI();
    const results = await zai.functions.invoke('web_search', {
      query,
      num: 5,
    });

    if (!results || results.length === 0) return '';

    const context = results
      .slice(0, 5)
      .map((r: any, i: number) =>
        `[${i + 1}] ${r.name || 'Untitled'}\n${r.snippet || ''}\nURL: ${r.url || ''}`
      )
      .join('\n\n');

    return `\n\n🌐 **Real-Time Web Results:**\n${context}\n\nUse these real-time results to provide accurate, up-to-date information. Cite sources when relevant.`;
  } catch (err) {
    console.error('[Web Search] Failed:', err);
    return '';
  }
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
        if (responses.length === 1) {
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

    // Check if web search is needed for real-time data
    let searchContext = '';
    if (needsWebSearch(trimmedMessage)) {
      searchContext = await webSearch(trimmedMessage);
    }

    const userContent = searchContext
      ? `${trimmedMessage}\n\n${searchContext}`
      : trimmedMessage;

    conv.push({ role: 'user', content: userContent });
    trimConv(convKey);

    const raw = await callAI(conv);
    let response: string;

    if (raw) {
      response = anonymize(raw);
    } else {
      // INTELLIGENT FALLBACK — bilingual, contextual
      response = generateSmartFallback(trimmedMessage, model.name);
    }

    conv.push({ role: 'assistant', content: response });
    trimConv(convKey);

    return NextResponse.json({
      mode: 'single', response,
      modelId: mid,
      modelName: model.name,
      usedWebSearch: !!searchContext,
    });
  } catch (error: any) {
    console.error('[AI Chat] Unhandled error:', error?.message || error);
    return NextResponse.json({
      error: "I couldn't process your request right now. Please rephrase your question and try again.",
    }, { status: 500 });
  }
}

// ─── Intelligent Fallback Generator (Bilingual) ────────────
function generateSmartFallback(message: string, modelName: string): string {
  const lower = message.toLowerCase();
  const bangla = isBangla(message);

  if (bangla) {
    return `আমি Chat Z AI। এই মুহূর্তে আমার সার্ভারে সামান্য সমস্যা হচ্ছে।

**অনুগ্রহ করে:**
1. 🔄 আপনার প্রশ্নটি আবার পাঠান
2. 📝 প্রশ্ন ছোট অংশে ভাগ করে জিজ্ঞাসা করুন
3. 💬 নির্দিষ্ট বিষয় উল্লেখ করুন

**আমি সাহায্য করতে পারি:**
- ✅ গণিত (ধাপে ধাপে সমাধান)
- ✅ প্রোগ্রামিং (যেকোনো ভাষায়)
- ✅ রিপোর্ট ও অ্যাসাইনমেন্ট
- ✅ বিজ্ঞান ব্যাখ্যা
- ✅ গবেষণা ও রেফারেন্স

আবার চেষ্টা করুন — আমি সম্পূর্ণ উত্তর দেব!`;
  }

  // Math detection
  if (/\d+\s*[\+\-\*\/\^%]\s*\d+/.test(message) || lower.match(/calcul|solve|equation|integral|derivative|sum|product|factor/i)) {
    return `I'm Chat Z AI, and I'd like to help you with this math problem!

While I'm experiencing a brief connectivity issue, here are some tips:

**For calculation problems:**
1. Break down complex expressions step by step
2. Show each intermediate result
3. Verify your answer by substitution

Please try sending your question again — I should be able to provide a complete step-by-step solution in a moment!`;
  }

  // Code detection
  if (lower.match(/code|program|function|algorithm|debug|error|bug|compile|syntax|python|java|javascript|c\+\+|html|css|sql|react|api/i)) {
    return `I'm Chat Z AI, and I can see you're working on a coding problem!

While I'm having a momentary issue, here are some debugging tips:

**Common debugging steps:**
1. ✅ Check for syntax errors (missing brackets, semicolons)
2. ✅ Verify variable names are spelled correctly
3. ✅ Test edge cases (empty input, zero, negative numbers)
4. ✅ Add console.log/print statements to trace execution

Please re-submit your question and I'll provide the complete code solution with explanations!`;
  }

  // Research/essay detection
  if (lower.match(/essay|research|paper|report|thesis|assignment|homework|project|presentation|write|explain|describe|discuss|compare|analyze/i)) {
    return `I'm Chat Z AI, and I'd love to help with your academic work!

While I'm experiencing a brief issue, here's a general structure you can follow:

**For essays/reports:**
1. **Title** — Clear and descriptive
2. **Introduction** — Hook, context, thesis statement
3. **Body** — 3-5 paragraphs with evidence and analysis
4. **Conclusion** — Summary, implications, future directions
5. **References** — Properly cited sources (APA/IEEE/MLA)

Please send your specific question again and I'll craft a detailed, well-formatted response!`;
  }

  // Default fallback
  return `I'm Chat Z AI. I apologize for the brief delay in my response.

**I'm still here and ready to help!** My AI engine experienced a momentary issue.

1. 🔄 **Try rephrasing** your question
2. 📝 **Break it into smaller parts** — I handle focused questions very well
3. 💬 **Be specific** — tell me the subject, topic, or type of help needed
4. 🌐 **Need real-time data?** Just ask — I can search the web for current information

**I can help with:**
- ✅ Math (step-by-step solutions)
- ✅ Code (any programming language)
- ✅ Research & essays
- ✅ Science explanations
- ✅ Lab reports & assignments
- ✅ Bangla & English support

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
    if (!battle) return NextResponse.json({ error: 'This battle session has expired. Start a new battle.' }, { status: 404 });

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
