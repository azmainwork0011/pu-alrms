import ZAI from 'z-ai-web-dev-sdk';

// Singleton ZAI instance — SDK auto-reads config from /etc/.z-ai-config
let zaiInstance: InstanceType<typeof ZAI> | null = null;

/**
 * Create or return cached ZAI instance.
 * The SDK automatically reads config from:
 *   1. process.cwd()/.z-ai-config
 *   2. ~/.z-ai-config
 *   3. /etc/.z-ai-config
 *
 * No manual config loading or X-Token forwarding needed —
 * the config already contains baseUrl, apiKey, token, chatId, userId.
 */
export async function getZAI(): Promise<InstanceType<typeof ZAI>> {
  if (!zaiInstance) {
    zaiInstance = await ZAI.create();
  }
  return zaiInstance;
}
