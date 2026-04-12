import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/jwt';
import { getZAI } from '@/lib/zai';

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

    const { image, question } = await req.json();

    if (!image || !question) {
      return NextResponse.json({ error: 'Image and question are required' }, { status: 400 });
    }

    // Validate image is a data URL
    if (!image.startsWith('data:image/')) {
      return NextResponse.json({ error: 'Invalid image format. Please upload a valid image.' }, { status: 400 });
    }

    const zai = await getZAI();

    // Use standard completions.create with vision content blocks
    const completion = await zai.chat.completions.create({
      messages: [
        {
          role: 'assistant',
          content: 'You are Professor Gemini, an expert academic AI teacher at Prime University. Analyze images and answer questions thoroughly, accurately, and educationally. Use clear formatting with markdown.',
        },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `Analyze this image and answer the question. Be thorough, accurate, and educational. Use clear formatting.\n\nQuestion: ${question}\n\nProvide your analysis with: 1) Description of what you see 2) Detailed answer to the question 3) Relevant educational context`,
            },
            {
              type: 'image_url',
              image_url: {
                url: image,
              },
            },
          ],
        },
      ],
      thinking: { type: 'disabled' } as any,
    });

    const response = completion.choices?.[0]?.message?.content || 'Could not analyze the image. Please try again with a clearer image.';

    return NextResponse.json({ response });
  } catch (error: any) {
    console.error('Image scan error:', error.message || error);
    return NextResponse.json({ error: 'Failed to scan image. Please try again.' }, { status: 500 });
  }
}
