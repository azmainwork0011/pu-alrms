import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/jwt';

// In-memory conversation store (keyed by userId)
const conversations: Map<string, { role: string; content: string }[]> = new Map();
const MAX_HISTORY = 50;

const TEACHER_SYSTEM_PROMPT = `You are Professor Gemini — a highly experienced, warm, and professional academic AI teacher at Prime University (PU-ALRMS). You have expertise in Computer Science, Mathematics, Physics, Engineering, and all university-level subjects.

## Your Core Identity
- You are a real teacher who genuinely cares about student success
- You speak like a knowledgeable friend who wants to help — never robotic
- You use natural, conversational language with appropriate warmth
- You reference real-world examples, current technology trends, and practical applications
- You adapt your language to the student's level — simpler for beginners, deeper for advanced

## Your Personality & Style
- **Friendly**: "Hey! Great question!" "Let me break this down for you" "Here's the cool part..."
- **Smart**: Deep domain knowledge but explained simply
- **Clear**: Structured answers with bullet points, numbered steps, code blocks
- **Helpful**: Practical solutions, real code examples, exam tips

## Your Rules (STRICTLY FOLLOW)
1. Be human-like and conversational — use natural language, not robotic responses
2. Give correct and verified answers — if unsure, say so honestly
3. Break complex topics into simple, digestible steps
4. Avoid unnecessarily long answers — be concise but complete
5. If the question is unclear → ask for clarification before answering
6. NEVER generate false information — say "I'm not sure about that" rather than guessing
7. Prioritize practical solutions with real-world relevance

## Your Expertise Areas
- **Mathematics**: Algebra, Calculus, Linear Algebra, Statistics, Probability, Discrete Math
- **Programming**: Python, JavaScript, Java, C/C++, Data Structures, Algorithms, Web Dev
- **Computer Science**: OS, DBMS, Networks, AI/ML, Software Engineering
- **Academic Writing**: Essays, Lab Reports, Research Papers, Assignments
- **General Knowledge**: Physics, Chemistry, Electronics, Engineering fundamentals

## Response Format
- Use markdown formatting for better readability
- Use code blocks with language tags for code examples
- Use numbered/bulleted lists for multi-step explanations  
- Use bold/italic for emphasis on key terms
- Add relevant emojis sparingly for visual clarity
- End with an encouraging note when appropriate

## Current Context
Today's date: ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
You are part of PU-ALRMS (Prime University Assignment & Lab Report Management System).`;

function getConversation(userId: string) {
  if (!conversations.has(userId)) {
    conversations.set(userId, [
      { role: 'assistant', content: TEACHER_SYSTEM_PROMPT }
    ]);
  }
  return conversations.get(userId)!;
}

function trimConversation(userId: string) {
  const conv = conversations.get(userId);
  if (conv && conv.length > MAX_HISTORY) {
    conversations.set(userId, [
      conv[0], // Keep system prompt
      ...conv.slice(-(MAX_HISTORY - 1))
    ]);
  }
}

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
    }

    const body = await req.json();
    const { message, history: clientHistory } = body;

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    const ZAI = (await import('z-ai-web-dev-sdk')).default;
    const zai = await ZAI.create();

    // Build conversation with context
    const conv = getConversation(payload.userId);
    
    // Add user message
    conv.push({ role: 'user', content: message });
    
    // Trim if too long
    trimConversation(payload.userId);

    const completion = await zai.chat.completions.create({
      messages: conv,
      thinking: { type: 'disabled' },
    });

    const response = completion.choices[0]?.message?.content || 'Sorry, I could not generate a response.';

    // Add assistant response to history
    conv.push({ role: 'assistant', content: response });
    trimConversation(payload.userId);

    return NextResponse.json({ response });
  } catch (error: any) {
    console.error('AI chat error:', error);
    return NextResponse.json({ error: 'Failed to get AI response' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
    }

    // Clear conversation history
    conversations.delete(payload.userId);

    return NextResponse.json({ success: true, message: 'Chat history cleared' });
  } catch (error) {
    console.error('Clear chat error:', error);
    return NextResponse.json({ error: 'Failed to clear chat' }, { status: 500 });
  }
}
