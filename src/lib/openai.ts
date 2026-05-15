import OpenAI from 'openai';

/**
 * OpenAI Client Singleton
 * 
 * Uses the official OpenAI SDK to power:
 * - ChatGPT (GPT-4o, GPT-4o-mini) for text chat
 * - GPT-4o Vision for image scanning
 * - DALL-E 3 for image generation
 * 
 * Requires: OPENAI_API_KEY in environment variables
 */

let openaiInstance: OpenAI | null = null;
let initError: string | null = null;

export function isOpenAIConfigured(): boolean {
  return !!process.env.OPENAI_API_KEY;
}

/**
 * Get or create the OpenAI client singleton.
 * Returns null if OPENAI_API_KEY is not configured.
 */
export function getOpenAI(): OpenAI | null {
  if (initError) return null;

  if (!openaiInstance) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      initError = 'OPENAI_API_KEY is not configured';
      console.warn(
        '[OpenAI] OPENAI_API_KEY not set. AI chat features will use fallback provider. ' +
        'Get your API key from: https://platform.openai.com/api-keys'
      );
      return null;
    }

    openaiInstance = new OpenAI({
      apiKey,
      // Use reasonable defaults
      timeout: 60000,
      maxRetries: 2,
    });

    console.log('[OpenAI] Client initialized successfully');
  }

  return openaiInstance;
}

/**
 * Map our model IDs to real OpenAI model names
 */
export function getOpenAIModelId(modelId: string): string {
  const modelMap: Record<string, string> = {
    'gpt4o': 'gpt-4o',
    'gpt5': 'gpt-4o',      // GPT-5 isn't available yet, use GPT-4o as best available
    'gpt-4o-mini': 'gpt-4o-mini',
    'gpt-4-turbo': 'gpt-4-turbo',
  };
  return modelMap[modelId] || 'gpt-4o';
}

/**
 * Check if a model ID should use OpenAI
 */
export function isOpenAIModel(modelId: string): boolean {
  return ['gpt4o', 'gpt5'].includes(modelId);
}

/**
 * Check if a model should use OpenAI Vision (GPT-4o has vision)
 */
export function isOpenAIVisionModel(modelId: string): boolean {
  return ['gpt4o', 'gpt5'].includes(modelId);
}
