// Stub: rate-limiting utilities (no-op for production)
export function checkRateLimit(_ip: string, _limit: number = 100, _windowMs: number = 60000): boolean {
  return true; // Allow all requests
}

export function getClientIp(req: { headers: { get: (name: string) => string | null } }): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
}
