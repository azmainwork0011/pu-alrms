/**
 * Simple in-memory cache for API routes.
 * Provides TTL-based caching with automatic invalidation.
 * Suitable for serverless environments (lives per-instance).
 */

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

class MemoryCache {
  private store = new Map<string, CacheEntry<unknown>>();
  private cleanupInterval: ReturnType<typeof setInterval> | null = null;

  constructor() {
    // Clean up expired entries every 5 minutes
    if (typeof globalThis !== 'undefined') {
      this.cleanupInterval = setInterval(() => this.cleanup(), 5 * 60 * 1000);
      // Don't prevent process exit
      if (this.cleanupInterval.unref) this.cleanupInterval.unref();
    }
  }

  get<T>(key: string): T | null {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }
    return entry.data as T;
  }

  set<T>(key: string, data: T, ttlMs: number): void {
    this.store.set(key, {
      data,
      expiresAt: Date.now() + ttlMs,
    });
  }

  delete(key: string): void {
    this.store.delete(key);
  }

  deleteByPrefix(prefix: string): void {
    for (const key of this.store.keys()) {
      if (key.startsWith(prefix)) this.store.delete(key);
    }
  }

  has(key: string): boolean {
    return this.get(key) !== null;
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.store) {
      if (now > entry.expiresAt) this.store.delete(key);
    }
  }

  get size(): number {
    return this.store.size;
  }
}

// Singleton instance
export const apiCache = new MemoryCache();

// Cache TTL presets (in ms)
export const CACHE_TTL = {
  DASHBOARD: 30_000,       // 30s — dashboard stats
  ASSIGNMENTS: 20_000,     // 20s — assignment lists
  ANNOUNCEMENTS: 30_000,   // 30s — announcements
  SUBJECTS: 60_000,        // 60s — subjects (rarely change)
  BATCHES: 60_000,         // 60s — batches (rarely change)
  LEADERBOARD: 60_000,     // 60s — leaderboard
  NOTIFICATIONS: 10_000,   // 10s — notifications (should be fresh)
  QUIZ_CATEGORIES: 60_000, // 60s — quiz categories
};
