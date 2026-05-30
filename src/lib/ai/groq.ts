

/**
 * Groq API wrapper — server-only.
 *
 * Uses the OpenAI-compatible REST API.
 * Supports both streaming and non-streaming generation.
 */

export interface GroqMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface GroqOptions {
  /** Model ID — defaults to 'llama-3.1-8b-instant' */
  model?: string;
  /** Sampling temperature 0–2 */
  temperature?: number;
  /** Max output tokens */
  maxTokens?: number;
}

const DEFAULT_MODEL = 'llama-3.1-8b-instant';
const TIMEOUT_MS = 20_000;
const BASE_URL = 'https://api.groq.com/openai/v1/chat/completions';

/* ------------------------------------------------------------------ */

function getKey(): string | undefined {
  return process.env.GROQ_API_KEY;
}

export function isGroqAvailable(): boolean {
  return !!getKey();
}

/* ------------------------------------------------------------------ */
/*  Non-streaming                                                      */
/* ------------------------------------------------------------------ */

export async function groqChat(
  messages: GroqMessage[],
  options?: GroqOptions,
): Promise<string> {
  const key = getKey();
  if (!key) throw new Error('GROQ_API_KEY is not configured');

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
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    if (!res.ok) {
      const errorBody = await res.text().catch(() => 'unknown error');
      throw new Error(
        `Groq API error ${res.status}: ${errorBody.slice(0, 200)}`,
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

export async function groqChatStream(
  messages: GroqMessage[],
  options?: GroqOptions,
): Promise<ReadableStream<string>> {
  const key = getKey();
  if (!key) throw new Error('GROQ_API_KEY is not configured');

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
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    if (!res.ok) {
      const errorBody = await res.text().catch(() => 'unknown error');
      throw new Error(
        `Groq stream error ${res.status}: ${errorBody.slice(0, 200)}`,
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
        console.error('[Groq] Stream error:', err instanceof Error ? err.message : err);
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
