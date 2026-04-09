import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/jwt';

// In-memory conversation store
const conversations: Map<string, { role: string; content: string }[]> = new Map();
const MAX_HISTORY = 50;

// Battle mode store
interface BattleSession {
  models: Record<string, string>;
  votes: { total: number; responseA: number; responseB: number; responseC: number };
}
const battleStore: Map<string, BattleSession> = new Map();

// Available AI models (displayed AFTER response — identity hidden during reading)
const AI_MODELS = [
  'GPT-4o',
  'Claude 3.5 Sonnet',
  'Gemini 1.5 Pro',
  'Mistral Large',
  'LLaMA 3.1 405B',
  'GPT-5',
  'Claude 4 Opus',
  'Gemini 2.0 Flash',
];

function randomModel(): string {
  return AI_MODELS[Math.floor(Math.random() * AI_MODELS.length)];
}

function shuffleModels(count: number): string[] {
  const shuffled = [...AI_MODELS].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

// ─── System Prompt (Identity-neutral, professional academic) ─
const BASE_SYSTEM_PROMPT = `You are a highly knowledgeable academic AI assistant integrated into a university learning management system. You have deep expertise in Computer Science, Mathematics, Physics, Engineering, and all university-level subjects.

## CRITICAL RULES (STRICTLY FOLLOW)
1. NEVER reveal or hint at which AI model, provider, or company you are. Act as a unified academic assistant.
2. NEVER say phrases like "As an AI...", "I am a language model...", "I was trained by...", or anything similar.
3. Be human-like and conversational — natural language, not robotic
4. Give correct and verified answers — if unsure, say so honestly
5. Break complex topics into simple, digestible steps
6. Be concise but complete — avoid unnecessarily long answers
7. Use markdown formatting, code blocks with language tags, numbered/bulleted lists
8. Add relevant emojis sparingly for visual clarity
9. Prioritize practical solutions with real-world relevance
10. Never generate false information

## Expertise
- Mathematics: Algebra, Calculus, Linear Algebra, Statistics, Probability, Discrete Math
- Programming: Python, JavaScript, Java, C/C++, Data Structures, Algorithms, Web Dev
- Computer Science: OS, DBMS, Networks, AI/ML, Software Engineering
- Academic Writing: Essays, Lab Reports, Research Papers, Assignments
- Physics, Chemistry, Electronics, Engineering fundamentals

Today's date: ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`;

function getConversation(userId: string) {
  if (!conversations.has(userId)) {
    conversations.set(userId, [
      { role: 'assistant', content: BASE_SYSTEM_PROMPT },
    ]);
  }
  return conversations.get(userId)!;
}

function trimConversation(userId: string) {
  const conv = conversations.get(userId);
  if (conv && conv.length > MAX_HISTORY) {
    conversations.set(userId, [conv[0], ...conv.slice(-(MAX_HISTORY - 1))]);
  }
}

// ─── Response Anonymizer ────────────────────────────────────
function anonymizeResponse(text: string): string {
  return text
    .replace(/As an?\s+(?:AI|language model|large language model|LLM)[^.]*/gi, '')
    .replace(/I(?:'m| am)\s+(?:a(?:n)?\s+)?(?:AI|language model|large language model|LLM)[^.]*/gi, '')
    .replace(/I was (?:trained|developed|built|created)[^.]*\./gi, '')
    .replace(/(?:OpenAI|Anthropic|Google|Meta|Mistral|Gemini|GPT|Claude|LLaMA|ChatGPT)[^.,]*/gi, '')
    .replace(/powered by[^.,]*/gi, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

// ─── POST: Single Mode & Battle Mode Chat ──────────────────
export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });

    const payload = verifyToken(token);
    if (!payload) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });

    const body = await req.json();
    const { message, mode } = body;

    if (!message) return NextResponse.json({ error: 'Message is required' }, { status: 400 });

    const ZAI = (await import('z-ai-web-dev-sdk')).default;
    const zai = await ZAI.create();

    // ─── BATTLE MODE ──────────────────────────────────────
    if (mode === 'battle') {
      const conv = getConversation(`${payload.userId}:battle`);
      conv.push({ role: 'user', content: message });
      trimConversation(`${payload.userId}:battle`);

      // Different system prompts to simulate different AI perspectives
      const systemVariants = [
        `You are an analytical academic assistant. Focus on structured, logical explanations with step-by-step breakdowns. Use clear formatting.\n\n${BASE_SYSTEM_PROMPT}`,
        `You are a creative academic assistant. Focus on intuitive explanations, analogies, and real-world examples. Be engaging and memorable.\n\n${BASE_SYSTEM_PROMPT}`,
        `You are a concise academic assistant. Focus on direct answers, key formulas, and essential information. Be to the point.\n\n${BASE_SYSTEM_PROMPT}`,
      ];

      // Generate responses with retries
      const responses: string[] = [];
      for (let i = 0; i < 3; i++) {
        try {
          const completion = await zai.chat.completions.create({
            messages: [
              { role: 'assistant', content: systemVariants[i] },
              { role: 'user', content: message },
            ],
            thinking: { type: 'disabled' },
          });
          const text = completion.choices[0]?.message?.content;
          if (text) responses.push(anonymizeResponse(text));
        } catch (err) {
          console.error(`Battle response ${i} error:`, err);
        }
      }

      if (responses.length === 0) {
        return NextResponse.json({ error: 'Could not generate responses. Please try again.' }, { status: 500 });
      }

      // Shuffle response order for anonymity
      const shuffled = [...responses].sort(() => Math.random() - 0.5);
      const labels = shuffled.map((_, i) => String.fromCharCode(65 + i)); // A, B, C

      // Assign random model names to each response (revealed after vote)
      const models = shuffleModels(shuffled.length);
      const modelMap: Record<string, string> = {};
      labels.forEach((label, i) => { modelMap[label] = models[i]; });

      // Store battle session for voting
      const battleId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      battleStore.set(battleId, {
        models: modelMap,
        votes: { total: 0, responseA: 0, responseB: 0, responseC: 0 },
      });

      conv.push({ role: 'assistant', content: `[Battle Mode] ${shuffled.join('\n\n---SEPARATOR---\n\n')}` });
      trimConversation(`${payload.userId}:battle`);

      return NextResponse.json({
        mode: 'battle',
        battleId,
        responses: shuffled.map((text, i) => ({
          label: labels[i],
          content: text,
        })),
      });
    }

    // ─── SINGLE MODE (default) ────────────────────────────
    const conv = getConversation(payload.userId);
    conv.push({ role: 'user', content: message });
    trimConversation(payload.userId);

    const completion = await zai.chat.completions.create({
      messages: conv,
      thinking: { type: 'disabled' },
    });

    const rawResponse = completion.choices[0]?.message?.content || 'Sorry, I could not generate a response. Please try again.';
    const response = anonymizeResponse(rawResponse);
    const model = randomModel(); // Assigned randomly — revealed when user taps

    conv.push({ role: 'assistant', content: response });
    trimConversation(payload.userId);

    return NextResponse.json({ mode: 'single', response, model });
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

    if (!battleId || !label) {
      return NextResponse.json({ error: 'Battle ID and label are required' }, { status: 400 });
    }

    const battle = battleStore.get(battleId);
    if (!battle) {
      return NextResponse.json({ error: 'Battle session not found' }, { status: 404 });
    }

    // Record vote
    battle.votes.total++;
    if (label === 'A') battle.votes.responseA++;
    else if (label === 'B') battle.votes.responseB++;
    else if (label === 'C') battle.votes.responseC++;

    return NextResponse.json({
      success: true,
      votes: battle.votes,
      reveals: battle.models, // Reveal all AI model identities
    });
  } catch (error) {
    console.error('Vote error:', error);
    return NextResponse.json({ error: 'Failed to record vote' }, { status: 500 });
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

    conversations.delete(payload.userId);
    conversations.delete(`${payload.userId}:battle`);

    return NextResponse.json({ success: true, message: 'Chat history cleared' });
  } catch (error) {
    console.error('Clear chat error:', error);
    return NextResponse.json({ error: 'Failed to clear chat' }, { status: 500 });
  }
}
