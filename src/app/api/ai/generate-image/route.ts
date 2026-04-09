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

    // Enhance prompt with educational/quality style
    const enhancedPrompt = `High quality, detailed, professional illustration: ${prompt}. Clean, modern style, well-composed, vibrant colors, sharp focus.`;

    // Try image generation with retry
    let lastError: any;
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const response = await zai.images.generations.create({
          prompt: enhancedPrompt,
          size: '1024x1024',
        });

        const imageData = response.data?.[0];
        if (!imageData) {
          throw new Error('No image data in response');
        }

        // Handle different response formats
        let imageUrl: string;

        if (imageData.base64) {
          imageUrl = `data:image/png;base64,${imageData.base64}`;
        } else if (imageData.url) {
          imageUrl = imageData.url;
        } else if (imageData.b64_json) {
          imageUrl = `data:image/png;base64,${imageData.b64_json}`;
        } else {
          // Try to convert whatever data we have
          const dataStr = JSON.stringify(imageData);
          const base64Match = dataStr.match(/["']([A-Za-z0-9+/=]{1000,})["']/);
          if (base64Match) {
            imageUrl = `data:image/png;base64,${base64Match[1]}`;
          } else {
            throw new Error('Could not extract image from response');
          }
        }

        return NextResponse.json({
          image: imageUrl,
          prompt: enhancedPrompt,
        });
      } catch (err: any) {
        lastError = err;
        console.error(`Image generation attempt ${attempt} error:`, err.message);
        if (attempt < 2) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    }

    return NextResponse.json({
      error: 'Image generation failed. Please try again with a different prompt.',
    }, { status: 500 });
  } catch (error: any) {
    console.error('Image generation error:', error);
    return NextResponse.json({ error: 'Failed to generate image. Please try again.' }, { status: 500 });
  }
}
