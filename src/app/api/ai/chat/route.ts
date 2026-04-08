import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/jwt';

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

    const { message, context } = await req.json();

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    const ZAI = (await import('z-ai-web-dev-sdk')).default;
    const zai = await ZAI.create();

    const systemPrompt = `You are an AI academic assistant for Prime University (PU-ALRMS). Help students with assignment questions, programming concepts, writing tips, lab report guidance, and academic support. Be helpful, educational, clear, and encouraging. When helping with code, provide well-commented examples. When helping with writing, suggest structure and improvements.

User context: Name: ${payload.name}, Role: ${payload.role}
${context ? `Additional context: ${context}` : ''}`;

    const completion = await zai.chat.completions.create({
      messages: [
        { role: 'assistant', content: systemPrompt },
        { role: 'user', content: message },
      ],
      thinking: { type: 'disabled' },
    });

    const response = completion.choices[0]?.message?.content;

    return NextResponse.json({ response });
  } catch (error) {
    console.error('AI chat error:', error);
    return NextResponse.json({ error: 'Failed to get AI response' }, { status: 500 });
  }
}
