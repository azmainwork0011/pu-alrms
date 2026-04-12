import fs from 'fs';
import path from 'path';

// ─── In-memory cache ─────────────────────────────────────
let cachedToken: string | null = null;
let tokenSource: string | null = null;

// ─── Config file paths ───────────────────────────────────
const LOCAL_CONFIG_PATH = path.join(process.cwd(), '.z-ai-config');
const ETC_CONFIG_PATH = '/etc/.z-ai-config';

/**
 * Read and parse a JSON config file safely
 */
function readConfigFile(filePath: string): { token?: string } | null {
  try {
    if (!fs.existsSync(filePath)) return null;
    const raw = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/**
 * Write token to local .z-ai-config file
 */
function writeLocalConfig(token: string | undefined) {
  try {
    let config: Record<string, string> = {};
    // Read existing config if available
    const existing = readConfigFile(LOCAL_CONFIG_PATH);
    if (existing) {
      config = { ...existing };
      delete (config as any).token; // remove old token
    }
    if (token) {
      config.token = token;
    }
    fs.writeFileSync(LOCAL_CONFIG_PATH, JSON.stringify(config, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to write local .z-ai-config:', err);
  }
}

/**
 * Get the current AI service token.
 * Priority: env var ZAI_TOKEN → in-memory cache → local .z-ai-config → /etc/.z-ai-config
 */
export function getToken(): string | null {
  // 1. Environment variable (highest priority)
  if (process.env.ZAI_TOKEN) {
    cachedToken = process.env.ZAI_TOKEN;
    tokenSource = 'env';
    return cachedToken;
  }

  // 2. In-memory cache
  if (cachedToken) {
    return cachedToken;
  }

  // 3. Local .z-ai-config
  const localConfig = readConfigFile(LOCAL_CONFIG_PATH);
  if (localConfig?.token) {
    cachedToken = localConfig.token;
    tokenSource = 'local';
    return cachedToken;
  }

  // 4. /etc/.z-ai-config
  const etcConfig = readConfigFile(ETC_CONFIG_PATH);
  if (etcConfig?.token) {
    cachedToken = etcConfig.token;
    tokenSource = 'etc';
    return cachedToken;
  }

  return null;
}

/**
 * Set a new token — writes to local .z-ai-config and in-memory cache
 */
export function setToken(token: string): void {
  const trimmed = token.trim();
  if (!trimmed) return;
  cachedToken = trimmed;
  tokenSource = 'local';
  writeLocalConfig(trimmed);
  console.log('✅ AI token saved to local .z-ai-config');
}

/**
 * Check if a valid (non-empty) token is configured
 */
export function hasToken(): boolean {
  return !!getToken();
}

/**
 * Clear the token from local config and in-memory cache
 */
export function clearToken(): void {
  cachedToken = null;
  tokenSource = null;
  writeLocalConfig(undefined);
  console.log('✅ AI token cleared from local .z-ai-config');
}

/**
 * Reset in-memory cache so next getToken() re-reads from files
 */
export function resetCache(): void {
  cachedToken = null;
  tokenSource = null;
}

/**
 * Get information about the current token status (without exposing the actual token value)
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
    env: 'Environment variable',
    local: 'Local project config',
    etc: 'System configuration',
    none: 'Not configured',
  };

  return {
    hasToken: !!token,
    isConfigured: !!token,
    source,
    sourceDescription: sourceDescriptions[source] || 'Unknown',
  };
}
