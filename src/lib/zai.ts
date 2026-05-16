import ZAI from 'z-ai-web-dev-sdk';

type ZAIInstance = Awaited<ReturnType<typeof ZAI.create>>;

let zaiInstance: ZAIInstance | null = null;

/**
 * Create or return cached ZAI instance.
 * No retry — fail fast for speed.
 */
export async function getZAI(): Promise<ZAIInstance> {
  if (zaiInstance) return zaiInstance;

  const zai = await ZAI.create();
  zaiInstance = zai;
  console.log('[Z-AI] SDK initialized');
  return zai;
}

/**
 * Reset singleton (if config changes).
 */
export function resetZAI(): void {
  zaiInstance = null;
}
