

/**
 * PU-ALRMS Central AI Router
 *
 * Routes AI requests to the appropriate provider based on mode.
 * Implements a fallback chain: Gemini → Groq → OpenRouter.
 *
 * All providers are free-tier / no-cost models.
 */

import {
  geminiChat,
  geminiChatStream,
  isGeminiAvailable,
  type GeminiMessage,
} from './gemini';
import {
  groqChat,
  groqChatStream,
  isGroqAvailable,
  type GroqMessage,
} from './groq';
import {
  openrouterChat,
  openrouterChatStream,
  isOpenRouterAvailable,
  type OpenRouterMessage,
} from './openrouter';
import { ACADEMIC_PROMPT, VOICE_PROMPT } from './system-prompts';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export type AIMode =
  | 'academic'
  | 'coding'
  | 'math'
  | 'assignment'
  | 'labReport'
  | 'fastChat'
  | 'reasoning'
  | 'bangla'
  | 'voice';

export interface AIMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface AIRouterResponse {
  text: string;
  provider: string;
  model: string;
  mode: AIMode;
  fallback: boolean;
}

export interface ProviderStatus {
  name: string;
  available: boolean;
  model: string;
}

/* ------------------------------------------------------------------ */
/*  Configuration                                                      */
/* ------------------------------------------------------------------ */

const FALLBACK_CHAIN: string[] = ['gemini', 'groq', 'openrouter'];

/** Map each mode to its primary provider */
const MODE_PRIMARY: Record<AIMode, string> = {
  academic: 'gemini',
  math: 'gemini',
  bangla: 'gemini',
  assignment: 'gemini',
  labReport: 'gemini',
  reasoning: 'gemini',
  coding: 'groq',
  fastChat: 'groq',
  voice: 'gemini',
};

const PROVIDER_MODELS: Record<string, string> = {
  gemini: 'gemini-2.0-flash',
  groq: 'llama-3.1-8b-instant',
  openrouter: 'meta-llama/llama-3.1-8b-instruct:free',
};

/** System prompt per mode */
function getSystemPrompt(mode: AIMode): string {
  if (mode === 'voice') return VOICE_PROMPT;
  return ACADEMIC_PROMPT;
}

/* ------------------------------------------------------------------ */
/*  Output Sanitization                                                */
/* ------------------------------------------------------------------ */

/**
 * Strips dangerous HTML tags and javascript: URLs from AI output.
 * Preserves safe markdown formatting.
 */
export function sanitizeOutput(text: string): string {
  let clean = text;

  // Remove <script>...</script> (case-insensitive, dotall)
  clean = clean.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gis, '');

  // Remove <iframe>...</iframe>
  clean = clean.replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gis, '');

  // Remove <object>...</object>
  clean = clean.replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gis, '');

  // Remove <embed> tags (self-closing or with attributes)
  clean = clean.replace(/<embed\b[^>]*\/?>/gi, '');

  // Remove javascript: URLs in href/src attributes
  clean = clean.replace(/(href|src)\s*=\s*["']?\s*javascript:[^"'>\s]*/gis, '$1=""');

  // Remove event handler attributes (onclick, onload, onerror, etc.)
  clean = clean.replace(/\s*on\w+\s*=\s*["'][^"']*["']/gis, '');

  // Remove any remaining <style>...</style>
  clean = clean.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gis, '');

  return clean.trim();
}

/* ------------------------------------------------------------------ */
/*  Message Conversion                                                 */
/* ------------------------------------------------------------------ */

function toGeminiMessages(
  messages: AIMessage[],
  systemPrompt: string,
): GeminiMessage[] {
  const filtered = messages.filter((m) => m.role !== 'system');
  // Gemini uses 'model' role for assistant
  return filtered.map((m) => ({
    role: m.role === 'assistant' ? ('model' as const) : ('user' as const),
    content: m.content,
  }));
}

function toOpenAIMessages(
  messages: AIMessage[],
  systemPrompt: string,
): GroqMessage[] {
  const result: GroqMessage[] = [{ role: 'system', content: systemPrompt }];
  for (const m of messages) {
    if (m.role === 'system') continue; // skip user-provided system, use ours
    result.push({ role: m.role as 'user' | 'assistant', content: m.content });
  }
  return result;
}

/* ------------------------------------------------------------------ */
/*  Provider Calls (with retry)                                        */
/* ------------------------------------------------------------------ */

async function tryProviderNonStream(
  provider: string,
  messages: AIMessage[],
  mode: AIMode,
): Promise<{ text: string; provider: string; model: string }> {
  const systemPrompt = getSystemPrompt(mode);
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= 1; attempt++) {
    try {
      let text: string;
      switch (provider) {
        case 'gemini':
          text = await geminiChat(
            toGeminiMessages(messages, systemPrompt),
            {
              model: PROVIDER_MODELS.gemini,
              systemInstruction: systemPrompt,
            },
          );
          return { text: sanitizeOutput(text), provider, model: PROVIDER_MODELS.gemini };

        case 'groq':
          text = await groqChat(
            toOpenAIMessages(messages, systemPrompt),
            { model: PROVIDER_MODELS.groq },
          );
          return { text: sanitizeOutput(text), provider, model: PROVIDER_MODELS.groq };

        case 'openrouter':
          text = await openrouterChat(
            toOpenAIMessages(messages, systemPrompt),
            { model: PROVIDER_MODELS.openrouter },
          );
          return { text: sanitizeOutput(text), provider, model: PROVIDER_MODELS.openrouter };

        default:
          throw new Error(`Unknown provider: ${provider}`);
      }
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      console.error(
        `[AI Router] ${provider} attempt ${attempt + 1} failed:`,
        lastError.message,
      );
      // If first attempt, retry once
      if (attempt === 0) continue;
      throw lastError;
    }
  }

  throw lastError ?? new Error(`${provider} failed`);
}

async function tryProviderStream(
  provider: string,
  messages: AIMessage[],
  mode: AIMode,
): Promise<{ stream: ReadableStream<string>; provider: string; model: string }> {
  const systemPrompt = getSystemPrompt(mode);

  switch (provider) {
    case 'gemini': {
      const stream = await geminiChatStream(
        toGeminiMessages(messages, systemPrompt),
        {
          model: PROVIDER_MODELS.gemini,
          systemInstruction: systemPrompt,
        },
      );
      return { stream, provider, model: PROVIDER_MODELS.gemini };
    }

    case 'groq': {
      const stream = await groqChatStream(
        toOpenAIMessages(messages, systemPrompt),
        { model: PROVIDER_MODELS.groq },
      );
      return { stream, provider, model: PROVIDER_MODELS.groq };
    }

    case 'openrouter': {
      const stream = await openrouterChatStream(
        toOpenAIMessages(messages, systemPrompt),
        { model: PROVIDER_MODELS.openrouter },
      );
      return { stream, provider, model: PROVIDER_MODELS.openrouter };
    }

    default:
      throw new Error(`Unknown provider: ${provider}`);
  }
}

/* ------------------------------------------------------------------ */
/*  Main Router API                                                    */
/* ------------------------------------------------------------------ */

/**
 * Send messages to the AI. Returns either a ReadableStream (streaming)
 * or a plain string (non-streaming), depending on options.
 */
export async function chatAI(
  messages: AIMessage[],
  mode: AIMode,
  options?: { stream?: boolean },
): Promise<ReadableStream<string> | string> {
  const primaryProvider = MODE_PRIMARY[mode] ?? 'gemini';

  // Build ordered chain: primary first, then others in fallback order
  const chain = [primaryProvider];
  for (const p of FALLBACK_CHAIN) {
    if (p !== primaryProvider) chain.push(p);
  }

  if (options?.stream) {
    return chatAIStream(messages, mode, chain);
  }

  return chatAINonStream(messages, mode, chain);
}

/* ------------------------------------------------------------------ */
/*  Non-streaming path                                                  */
/* ------------------------------------------------------------------ */

async function chatAINonStream(
  messages: AIMessage[],
  mode: AIMode,
  chain: string[],
): Promise<string> {
  let usedFallback = false;

  for (const provider of chain) {
    try {
      const result = await tryProviderNonStream(provider, messages, mode);
      console.log(
        `[AI Router] Success: ${provider} (${result.model})${usedFallback ? ' (fallback)' : ''}`,
      );
      return result.text;
    } catch {
      usedFallback = true;
      // Try next provider
    }
  }

  return 'AI server busy. Please try again later.';
}

/* ------------------------------------------------------------------ */
/*  Streaming path                                                      */
/* ------------------------------------------------------------------ */

async function chatAIStream(
  messages: AIMessage[],
  mode: AIMode,
  chain: string[],
): Promise<ReadableStream<string>> {
  const { readable, writable } = new TransformStream<string, string>();
  const writer = writable.getWriter();
  const encoder = new TextEncoder();

  (async () => {
    let fallbackUsed = false;

    for (const provider of chain) {
      try {
        const { stream, model } = await tryProviderStream(
          provider,
          messages,
          mode,
        );

        console.log(
          `[AI Router] Streaming: ${provider} (${model})${fallbackUsed ? ' (fallback)' : ''}`,
        );

        // Pipe provider stream through sanitizer
        const reader = stream.getReader();
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            // Sanitize each chunk — lightweight strip for streaming
            const sanitized = value
              .replace(/<script[\s\S]*?<\/script>/gi, '')
              .replace(/<iframe[\s\S]*?<\/iframe>/gi, '')
              .replace(/<embed[^>]*>/gi, '')
              .replace(/javascript:[^\s"'>]*/gi, '');
            if (sanitized) await writer.write(sanitized);
          }
        } catch (streamErr) {
          console.error(
            `[AI Router] Stream interrupted on ${provider}:`,
            streamErr instanceof Error ? streamErr.message : streamErr,
          );
          // Return whatever we have so far — don't try to fallback mid-stream
          return;
        } finally {
          reader.releaseLock();
        }

        // Success — exit the chain
        return;
      } catch (err) {
        fallbackUsed = true;
        console.error(
          `[AI Router] ${provider} stream setup failed:`,
          err instanceof Error ? err.message : err,
        );
        // Try next provider
      }
    }

    // All providers failed
    await writer.write('AI server busy. Please try again later.');
  })();

  return readable;
}

/* ------------------------------------------------------------------ */
/*  Status & Metadata                                                  */
/* ------------------------------------------------------------------ */

export function getProviderStatuses(): ProviderStatus[] {
  return [
    { name: 'Gemini', available: isGeminiAvailable(), model: PROVIDER_MODELS.gemini },
    { name: 'Groq', available: isGroqAvailable(), model: PROVIDER_MODELS.groq },
    { name: 'OpenRouter', available: isOpenRouterAvailable(), model: PROVIDER_MODELS.openrouter },
  ];
}

export function getFallbackChain(mode: AIMode): string[] {
  const primary = MODE_PRIMARY[mode] ?? 'gemini';
  const chain = [primary];
  for (const p of FALLBACK_CHAIN) {
    if (p !== primary) chain.push(p);
  }
  return chain;
}

export function getModesList(): {
  mode: AIMode;
  label: string;
  icon: string;
  description: string;
}[] {
  return [
    {
      mode: 'academic',
      label: 'Academic',
      icon: 'GraduationCap',
      description: 'General academic help — essays, research, explanations',
    },
    {
      mode: 'math',
      label: 'Mathematics',
      icon: 'Calculator',
      description: 'Step-by-step math solutions with formulas',
    },
    {
      mode: 'coding',
      label: 'Coding',
      icon: 'Code',
      description: 'Code assistance — debugging, writing, explaining',
    },
    {
      mode: 'assignment',
      label: 'Assignment',
      icon: 'FileText',
      description: 'Help structure and write assignments',
    },
    {
      mode: 'labReport',
      label: 'Lab Report',
      icon: 'FlaskConical',
      description: 'Lab report formatting and content guidance',
    },
    {
      mode: 'reasoning',
      label: 'Reasoning',
      icon: 'Brain',
      description: 'Logical reasoning and critical thinking',
    },
    {
      mode: 'bangla',
      label: 'Bangla',
      icon: 'Languages',
      description: 'Academic assistance in Bengali',
    },
    {
      mode: 'fastChat',
      label: 'Quick Chat',
      icon: 'Zap',
      description: 'Fast, casual Q&A',
    },
    {
      mode: 'voice',
      label: 'Voice Guide',
      icon: 'Mic',
      description: 'Platform navigation via voice commands',
    },
  ];
}
