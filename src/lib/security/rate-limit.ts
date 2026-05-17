// In-memory rate limiter (works in single server instance)
const store = new Map<string, { count: number; resetAt: number }>();

// Cleanup stale entries every 5 minutes
if (typeof globalThis !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, val] of store) {
      if (val.resetAt <= now) store.delete(key);
    }
  }, 300_000);
}

export function checkRateLimit(
  key: string,
  config: { windowMs: number; max: number },
): { allowed: boolean; retryAfterMs?: number } {
  const now = Date.now();
  let entry = store.get(key);

  if (!entry || entry.resetAt <= now) {
    entry = { count: 0, resetAt: now + config.windowMs };
    store.set(key, entry);
  }

  entry.count++;
  if (entry.count > config.max) {
    return { allowed: false, retryAfterMs: entry.resetAt - now };
  }
  return { allowed: true };
}

export function getClientIp(req: { headers: { get: (name: string) => string | null } }): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
}
