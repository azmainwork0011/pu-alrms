import ZAI from 'z-ai-web-dev-sdk';

// ═══════════════════════════════════════════════════════════════════
// Z-AI SDK Singleton — Robust with retry and error handling.
// SDK auto-reads config from /etc/.z-ai-config, ~/.z-ai-config, etc.
// ═══════════════════════════════════════════════════════════════════

type ZAIInstance = Awaited<ReturnType<typeof ZAI.create>>;

let zaiInstance: ZAIInstance | null = null;
let zaiReady = false;
let zaiError: string | null = null;

/**
 * Create or return cached ZAI instance with retry.
 */
export async function getZAI(maxRetries = 2): Promise<ZAIInstance> {
  if (zaiReady && zaiInstance) return zaiInstance;
  if (zaiError) throw new Error(zaiError);

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      zaiInstance = await ZAI.create();
      zaiReady = true;
      zaiError = null;
      console.log('[Z-AI] SDK initialized successfully');
      return zaiInstance;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`[Z-AI] Init attempt ${attempt}/${maxRetries} failed:`, msg);
      if (attempt === maxRetries) {
        zaiError = `Z-AI SDK failed: ${msg}`;
        throw new Error(zaiError);
      }
      await new Promise(r => setTimeout(r, 500 * attempt));
    }
  }
  throw new Error('Z-AI SDK initialization failed');
}

/**
 * Check if Z-AI is available (non-throwing).
 */
export async function isZAIReady(): Promise<boolean> {
  try {
    await getZAI();
    return true;
  } catch {
    return false;
  }
}

/**
 * Reset the singleton (useful if config changes).
 */
export function resetZAI(): void {
  zaiInstance = null;
  zaiReady = false;
  zaiError = null;
}
