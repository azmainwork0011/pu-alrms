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

    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const question = formData.get('question') as string | null;

    if (!file) {
      return NextResponse.json({ error: 'File is required' }, { status: 400 });
    }

    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'File size must be less than 10MB' }, { status: 400 });
    }

    // Check if it's an image file
    if (file.type.startsWith('image/')) {
      // Convert to base64 for vision model
      const bytes = await file.arrayBuffer();
      const base64 = Buffer.from(bytes).toString('base64');
      const dataUrl = `data:${file.type};base64,${base64}`;

      const ZAI = (await import('z-ai-web-dev-sdk')).default;
      const zai = await ZAI.create();

      const completion = await zai.chat.completions.createVision({
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `You are Professor Gemini, an expert academic AI teacher at Prime University. A student has uploaded a file named "${file.name}". ${question ? `They ask: ${question}` : 'Please analyze this image thoroughly and provide educational insights.'}\n\nProvide: 1) What you observe 2) Educational analysis 3) Suggestions or explanations`,
              },
              {
                type: 'image_url',
                image_url: { url: dataUrl },
              },
            ],
          },
        ],
        thinking: { type: 'disabled' },
      });

      const response = completion.choices[0]?.message?.content || 'Could not analyze the uploaded file.';

      return NextResponse.json({ response, fileName: file.name });
    }

    // For non-image files, use text-based analysis
    const text = await file.text();
    const truncatedText = text.slice(0, 8000);

    const ZAI = (await import('z-ai-web-dev-sdk')).default;
    const zai = await ZAI.create();

    const completion = await zai.chat.completions.create({
      messages: [
        {
          role: 'assistant',
          content: 'You are Professor Gemini, an expert academic AI teacher. Analyze uploaded student files and provide helpful educational feedback.',
        },
        {
          role: 'user',
          content: `A student has uploaded a file named "${file.name}" (${file.type}). ${question ? `They ask: ${question}` : 'Please analyze this file content.'}\n\nFile content (first 8000 chars):\n${truncatedText}\n\nProvide: 1) Summary of content 2) Analysis and feedback 3) Suggestions for improvement`,
        },
      ],
      thinking: { type: 'disabled' },
    });

    const response = completion.choices[0]?.message?.content || 'Could not analyze the uploaded file.';

    return NextResponse.json({ response, fileName: file.name });
  } catch (error: any) {
    console.error('File upload error:', error);
    return NextResponse.json({ error: 'Failed to process file' }, { status: 500 });
  }
}
