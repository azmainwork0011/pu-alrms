// Stub: AI token management
let cachedToken: string | null = null;

export function getTokenStatus(): { hasToken: boolean; source: string } {
  return { hasToken: !!process.env.Z_AI_API_KEY, source: process.env.Z_AI_API_KEY ? 'env' : 'none' };
}

export function setToken(_token: string): void {
  cachedToken = _token;
}

export function clearToken(): void {
  cachedToken = null;
}

export function resetCache(): void {
  cachedToken = null;
}
