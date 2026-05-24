

/**
 * Google Gemini API wrapper — server-only.
 *
 * Uses the Gemini REST API directly (no SDK).
 * Supports both streaming and non-streaming generation.
 */

export interface GeminiMessage {
  role: 'user' | 'model';
  content: string;
}

export interface GeminiOptions {
  /** Model ID — defaults to 'gemini-2.0-flash' */
  model?: string;
  /** System instruction (Gemini-specific field) */
  systemInstruction?: string;
  /** Sampling temperature 0–1 */
  temperature?: number;
  /** Max output tokens */
  maxTokens?: number;
}

const DEFAULT_MODEL = 'gemini-2.0-flash';
const TIMEOUT_MS = 20_000;
const BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models';

/* ------------------------------------------------------------------ */

function getKey(): string | undefined {
  return process.env.GEMINI_API_KEY;
}

export function isGeminiAvailable(): boolean {
  return !!getKey();
}

/* ------------------------------------------------------------------ */
/*  Non-streaming                                                      */
/* ------------------------------------------------------------------ */

export async function geminiChat(
  messages: GeminiMessage[],
  options?: GeminiOptions,
): Promise<string> {
  const key = getKey();
  if (!key) throw new Error('GEMINI_API_KEY is not configured');

  const model = options?.model ?? DEFAULT_MODEL;
  const url = `${BASE_URL}/${model}:generateContent?key=${key}`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const body: Record<string, unknown> = {};

    if (options?.systemInstruction) {
      body.systemInstruction = {
        parts: [{ text: options.systemInstruction }],
      };
    }

    body.contents = messages.map((m) => ({
      role: m.role,
      parts: [{ text: m.content }],
    }));

    const generationConfig: Record<string, unknown> = {};
    if (options?.temperature !== undefined)
      generationConfig.temperature = options.temperature;
    if (options?.maxTokens !== undefined)
      generationConfig.maxOutputTokens = options.maxTokens;
    if (Object.keys(generationConfig).length > 0) {
      body.generationConfig = generationConfig;
    }

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    if (!res.ok) {
      const errorBody = await res.text().catch(() => 'unknown error');
      throw new Error(
        `Gemini API error ${res.status}: ${errorBody.slice(0, 200)}`,
      );
    }

    const data = await res.json();
    const text =
      data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
    return text;
  } finally {
    clearTimeout(timer);
  }
}

/* ------------------------------------------------------------------ */
/*  Streaming                                                          */
/* ------------------------------------------------------------------ */

export async function geminiChatStream(
  messages: GeminiMessage[],
  options?: GeminiOptions,
): Promise<ReadableStream<string>> {
  const key = getKey();
  if (!key) throw new Error('GEMINI_API_KEY is not configured');

  const model = options?.model ?? DEFAULT_MODEL;
  const url = `${BASE_URL}/${model}:streamGenerateContent?alt=sse&key=${key}`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const body: Record<string, unknown> = {};

    if (options?.systemInstruction) {
      body.systemInstruction = {
        parts: [{ text: options.systemInstruction }],
      };
    }

    body.contents = messages.map((m) => ({
      role: m.role,
      parts: [{ text: m.content }],
    }));

    const generationConfig: Record<string, unknown> = {};
    if (options?.temperature !== undefined)
      generationConfig.temperature = options.temperature;
    if (options?.maxTokens !== undefined)
      generationConfig.maxOutputTokens = options.maxTokens;
    if (Object.keys(generationConfig).length > 0) {
      body.generationConfig = generationConfig;
    }

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    if (!res.ok) {
      const errorBody = await res.text().catch(() => 'unknown error');
      throw new Error(
        `Gemini stream error ${res.status}: ${errorBody.slice(0, 200)}`,
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
              const chunk =
                parsed?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
              if (chunk) await writer.write(chunk);
            } catch {
              // skip malformed JSON chunks
            }
          }
        }

        // Process any remaining buffer
        if (buffer.trim().startsWith('data:')) {
          const jsonStr = buffer.trim().slice(5).trim();
          try {
            const parsed = JSON.parse(jsonStr);
            const chunk =
              parsed?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
            if (chunk) await writer.write(chunk);
          } catch {
            // skip
          }
        }
      } catch (err) {
        // Pipe stream errors are non-fatal; caller gets what was written
        console.error('[Gemini] Stream error:', err instanceof Error ? err.message : err);
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
