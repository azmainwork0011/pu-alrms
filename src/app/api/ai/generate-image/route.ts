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

    const { prompt } = await req.json();

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    const ZAI = (await import('z-ai-web-dev-sdk')).default;
    const zai = await ZAI.create();

    // Enhance prompt with educational style
    const enhancedPrompt = `Educational illustration for university students: ${prompt}. Clean, modern, professional style, high quality, detailed.`;

    const response = await zai.images.generations.create({
      prompt: enhancedPrompt,
      size: '1024x1024',
    });

    // Handle both base64 and URL responses
    const imageData = response.data?.[0];
    if (!imageData) {
      return NextResponse.json({ error: 'Failed to generate image' }, { status: 500 });
    }

    let imageUrl: string;
    if (imageData.base64) {
      imageUrl = `data:image/png;base64,${imageData.base64}`;
    } else if (imageData.url) {
      imageUrl = imageData.url;
    } else if (imageData.b64_json) {
      imageUrl = `data:image/png;base64,${imageData.b64_json}`;
    } else {
      return NextResponse.json({ error: 'No image data in response' }, { status: 500 });
    }

    return NextResponse.json({
      image: imageUrl,
      prompt: enhancedPrompt,
    });
  } catch (error: any) {
    console.error('Image generation error:', error);
    return NextResponse.json({ error: 'Failed to generate image. Please try again.' }, { status: 500 });
  }
}
