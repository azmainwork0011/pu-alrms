/**
 * Simple in-memory rate limiter for API protection
 * Prevents brute force attacks and DDoS
 */

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const store = new Map<string, RateLimitEntry>();

// Clean up expired entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store.entries()) {
    if (entry.resetTime <= now) {
      store.delete(key);
    }
  }
}, 5 * 60 * 1000);

export interface RateLimitConfig {
  /** Time window in milliseconds */
  windowMs: number;
  /** Max requests per window */
  max: number;
  /** Custom identifier (defaults to IP) */
  keyPrefix?: string;
}

/**
 * Check if a request should be rate limited
 * @returns true if the request is allowed, false if rate limited
 */
export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): { allowed: boolean; remaining: number; retryAfterMs: number } {
  const { windowMs, max, keyPrefix = 'global' } = config;
  const key = `${keyPrefix}:${identifier}`;
  const now = Date.now();

  const entry = store.get(key);

  if (!entry || entry.resetTime <= now) {
    // New window
    store.set(key, { count: 1, resetTime: now + windowMs });
    return { allowed: true, remaining: max - 1, retryAfterMs: 0 };
  }

  if (entry.count >= max) {
    // Rate limited
    return {
      allowed: false,
      remaining: 0,
      retryAfterMs: entry.resetTime - now,
    };
  }

  entry.count++;
  return {
    allowed: true,
    remaining: max - entry.count,
    retryAfterMs: 0,
  };
}

/**
 * Get client IP from request headers
 */
export function getClientIp(request: Request): string {
  const headers = new Headers(request.headers);
  
  // Check common proxy headers
  const forwarded = headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  const realIp = headers.get('x-real-ip');
  if (realIp) return realIp.trim();

  const cfIp = headers.get('cf-connecting-ip');
  if (cfIp) return cfIp.trim();

  return 'unknown';
}

// Pre-configured rate limiters
export const authLimiter = {
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 20,                     // 20 attempts per 15 min
  keyPrefix: 'auth',
};

export const apiLimiter = {
  windowMs: 60 * 1000,        // 1 minute
  max: 100,                    // 100 requests per minute
  keyPrefix: 'api',
};

export const quizLimiter = {
  windowMs: 60 * 1000,        // 1 minute
  max: 30,                     // 30 quiz actions per minute
  keyPrefix: 'quiz',
};
