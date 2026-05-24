import { NextResponse } from 'next/server';
import { isGeminiAvailable } from '@/lib/ai/gemini';
import { isGroqAvailable } from '@/lib/ai/groq';
import { isOpenRouterAvailable } from '@/lib/ai/openrouter';

// ═══════════════════════════════════════════════════════════════════
// AI STATUS — Health check endpoint for AI providers
// No authentication required (public health check).
// NEVER exposes API keys or internal configuration.
// ═══════════════════════════════════════════════════════════════════

interface ProviderHealth {
  available: boolean;
  latency?: string;
  error?: string;
}

/** Create a timeout promise that rejects after ms */
function createTimeout(ms: number): Promise<never> {
  return new Promise((_resolve, reject) => {
    setTimeout(() => reject(new Error('timeout')), ms);
  });
}

/**
 * Quick availability check for a provider using a lightweight ping.
 * Returns the provider health object with latency if successful.
 */
async function checkProvider(
  name: string,
  checkFn: () => boolean,
): Promise<ProviderHealth> {
  const isAvailable = checkFn();

  if (!isAvailable) {
    return {
      available: false,
      error: 'API key not configured',
    };
  }

  // Key exists — do a quick connectivity check
  const start = Date.now();
  try {
    switch (name) {
      case 'gemini': {
        const { geminiChat } = await import('@/lib/ai/gemini');
        const result = await Promise.race([
          geminiChat(
            [{ role: 'user', content: 'ping' }],
            { systemInstruction: 'Reply with exactly: pong', maxTokens: 10 },
          ),
          createTimeout(5000),
        ]);
        const latency = `${Date.now() - start}ms`;
        return { available: !!(result && result.trim().length > 0), latency };
      }
      case 'groq': {
        const { groqChat } = await import('@/lib/ai/groq');
        const result = await Promise.race([
          groqChat(
            [
              { role: 'system', content: 'Reply with exactly: pong' },
              { role: 'user', content: 'ping' },
            ],
            { maxTokens: 10 },
          ),
          createTimeout(5000),
        ]);
        const latency = `${Date.now() - start}ms`;
        return { available: !!(result && result.trim().length > 0), latency };
      }
      case 'openrouter': {
        const { openrouterChat } = await import('@/lib/ai/openrouter');
        const result = await Promise.race([
          openrouterChat(
            [
              { role: 'system', content: 'Reply with exactly: pong' },
              { role: 'user', content: 'ping' },
            ],
            { maxTokens: 10 },
          ),
          createTimeout(5000),
        ]);
        const latency = `${Date.now() - start}ms`;
        return { available: !!(result && result.trim().length > 0), latency };
      }
      default:
        return { available: false, error: 'Unknown provider' };
    }
  } catch (err) {
    const latency = `${Date.now() - start}ms`;
    const errorMsg = err instanceof Error ? err.message : 'Connection failed';

    // Timeout is a special case — provider key exists but can't reach
    if (errorMsg === 'timeout') {
      return { available: false, error: `Connection timeout (${latency})` };
    }

    return { available: false, error: errorMsg.slice(0, 100) };
  }
}

/**
 * Determine overall AI service status based on provider availability.
 */
function getOverallStatus(
  providers: Record<string, ProviderHealth>,
): 'ok' | 'degraded' | 'down' {
  const entries = Object.values(providers);
  const availableCount = entries.filter((p) => p.available).length;

  if (availableCount === 0) return 'down';
  if (availableCount < entries.length) return 'degraded';
  return 'ok';
}

// ═══════════════════════════════════════════════════════════════════
// GET: Health check for all AI providers
// ═══════════════════════════════════════════════════════════════════
export async function GET() {
  try {
    // Run all provider checks in parallel for speed
    const [gemini, groq, openrouter] = await Promise.all([
      checkProvider('gemini', isGeminiAvailable),
      checkProvider('groq', isGroqAvailable),
      checkProvider('openrouter', isOpenRouterAvailable),
    ]);

    const providers = { gemini, groq, openrouter };
    const status = getOverallStatus(providers);

    return NextResponse.json({
      status,
      providers,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error(
      '[AI Status] Health check error:',
      error instanceof Error ? error.message : error,
    );

    // Return a degraded status rather than crashing
    return NextResponse.json({
      status: 'down' as const,
      providers: {
        gemini: { available: false, error: 'Health check failed' },
        groq: { available: false, error: 'Health check failed' },
        openrouter: { available: false, error: 'Health check failed' },
      },
      timestamp: new Date().toISOString(),
    });
  }
}
