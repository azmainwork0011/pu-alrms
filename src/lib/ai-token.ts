import path from 'path';

// ─── In-memory cache ─────────────────────────────────────
let cachedToken: string | null = null;
let tokenSource: string | null = null;

/**
 * Get the current AI service token.
 * Priority: env var ZAI_TOKEN → in-memory cache
 * On Vercel/serverless: only env vars and in-memory cache are used
 */
export function getToken(): string | null {
  // 1. Environment variable (highest priority, works on Vercel)
  if (process.env.ZAI_TOKEN) {
    cachedToken = process.env.ZAI_TOKEN;
    tokenSource = 'env';
    return cachedToken;
  }

  // 2. In-memory cache
  if (cachedToken) {
    return cachedToken;
  }

  return null;
}

/**
 * Set a new token — writes to in-memory cache
 */
export function setToken(token: string): void {
  const trimmed = token.trim();
  if (!trimmed) return;
  cachedToken = trimmed;
  tokenSource = 'memory';
  console.log('✅ AI token cached in memory');
}

/**
 * Check if a valid (non-empty) token is configured
 */
export function hasToken(): boolean {
  return !!getToken();
}

/**
 * Clear the token from in-memory cache
 */
export function clearToken(): void {
  cachedToken = null;
  tokenSource = null;
  console.log('✅ AI token cleared from memory');
}

/**
 * Reset in-memory cache
 */
export function resetCache(): void {
  cachedToken = null;
  tokenSource = null;
}

/**
 * Get information about the current token status
 */
export function getTokenStatus(): {
  hasToken: boolean;
  isConfigured: boolean;
  source: string | null;
  sourceDescription: string;
} {
  const token = getToken();
  const source = tokenSource || 'none';
  const sourceDescriptions: Record<string, string> = {
    env: 'Environment variable (ZAI_TOKEN)',
    memory: 'In-memory cache',
    none: 'Not configured',
  };

  return {
    hasToken: !!token,
    isConfigured: !!token,
    source,
    sourceDescription: sourceDescriptions[source] || 'Unknown',
  };
}
