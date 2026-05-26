

/**
 * OpenRouter API wrapper — server-only.
 *
 * Uses the OpenAI-compatible REST API.
 * Supports both streaming and non-streaming generation.
 */

export interface OpenRouterMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface OpenRouterOptions {
  /** Model ID — defaults to 'meta-llama/llama-3.1-8b-instruct:free' */
  model?: string;
  /** Sampling temperature 0–2 */
  temperature?: number;
  /** Max output tokens */
  maxTokens?: number;
}

const DEFAULT_MODEL = 'meta-llama/llama-3.1-8b-instruct:free';
const TIMEOUT_MS = 20_000;
const BASE_URL = 'https://openrouter.ai/api/v1/chat/completions';

/* ------------------------------------------------------------------ */

function getKey(): string | undefined {
  return process.env.OPENROUTER_API_KEY;
}

export function isOpenRouterAvailable(): boolean {
  return !!getKey();
}

/* ------------------------------------------------------------------ */
/*  Non-streaming                                                      */
/* ------------------------------------------------------------------ */

export async function openrouterChat(
  messages: OpenRouterMessage[],
  options?: OpenRouterOptions,
): Promise<string> {
  const key = getKey();
  if (!key) throw new Error('OPENROUTER_API_KEY is not configured');

  const model = options?.model ?? DEFAULT_MODEL;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const body: Record<string, unknown> = {
      model,
      messages,
      stream: false,
    };

    if (options?.temperature !== undefined) body.temperature = options.temperature;
    if (options?.maxTokens !== undefined) body.max_tokens = options.maxTokens;

    const res = await fetch(BASE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${key}`,
        'HTTP-Referer': 'https://pu-alrms.app',
        'X-Title': 'PU-ALRMS',
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    if (!res.ok) {
      const errorBody = await res.text().catch(() => 'unknown error');
      throw new Error(
        `OpenRouter API error ${res.status}: ${errorBody.slice(0, 200)}`,
      );
    }

    const data = await res.json();
    const text = data?.choices?.[0]?.message?.content ?? '';
    return text;
  } finally {
    clearTimeout(timer);
  }
}

/* ------------------------------------------------------------------ */
/*  Streaming                                                          */
/* ------------------------------------------------------------------ */

export async function openrouterChatStream(
  messages: OpenRouterMessage[],
  options?: OpenRouterOptions,
): Promise<ReadableStream<string>> {
  const key = getKey();
  if (!key) throw new Error('OPENROUTER_API_KEY is not configured');

  const model = options?.model ?? DEFAULT_MODEL;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const body: Record<string, unknown> = {
      model,
      messages,
      stream: true,
    };

    if (options?.temperature !== undefined) body.temperature = options.temperature;
    if (options?.maxTokens !== undefined) body.max_tokens = options.maxTokens;

    const res = await fetch(BASE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${key}`,
        'HTTP-Referer': 'https://pu-alrms.app',
        'X-Title': 'PU-ALRMS',
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    if (!res.ok) {
      const errorBody = await res.text().catch(() => 'unknown error');
      throw new Error(
        `OpenRouter stream error ${res.status}: ${errorBody.slice(0, 200)}`,
      );
    }

    const { readable, writable } = new TransformStream<string, string>();
    const writer = writable.getWriter();

    (async () => {
      try {
        const reader = res.body?.getReader();
        if (!reader) {
          await writer.close();
          return;
        }

        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });

          // SSE lines: "data: {...}\n\n"
          const lines = buffer.split('\n');
          buffer = lines.pop() ?? '';

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed.startsWith('data:')) continue;
            const jsonStr = trimmed.slice(5).trim();
            if (jsonStr === '[DONE]') continue;

            try {
              const parsed = JSON.parse(jsonStr);
              const delta = parsed?.choices?.[0]?.delta?.content ?? '';
              if (delta) await writer.write(delta);
            } catch {
              // skip malformed JSON chunks
            }
          }
        }

        // Process any remaining buffer
        if (buffer.trim().startsWith('data:')) {
          const jsonStr = buffer.trim().slice(5).trim();
          if (jsonStr !== '[DONE]') {
            try {
              const parsed = JSON.parse(jsonStr);
              const delta = parsed?.choices?.[0]?.delta?.content ?? '';
              if (delta) await writer.write(delta);
            } catch {
              // skip
            }
          }
        }
      } catch (err) {
        console.error('[OpenRouter] Stream error:', err instanceof Error ? err.message : err);
      } finally {
        clearTimeout(timer);
        await writer.close();
      }
    })();

    return readable;
  } catch (err) {
    clearTimeout(timer);
    throw err;
  }
}
