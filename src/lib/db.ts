/**
 * Prisma Client Singleton — Postgres (Neon) + Fallback
 *
 * - Production (Vercel serverless): Uses @prisma/adapter-neon with @neondatabase/serverless
 *   for proper connection pooling in serverless environments.
 * - Development: Falls back to standard PrismaClient (direct Postgres connection).
 *
 * The Neon adapter is only loaded when a Neon connection string is detected,
 * avoiding unnecessary imports for non-Neon Postgres setups.
 */

import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

async function createPrismaClient(): Promise<PrismaClient> {
  const url = process.env.DATABASE_URL || ''

  // ── Neon Postgres (serverless-compatible) ──
  // Detect Neon URLs: postgres://...neon.tech or postgresql://...neon.tech
  if (url.includes('neon.tech') || process.env.USE_NEON_ADAPTER === 'true') {
    try {
      const { Pool, neonConfig } = await import('@neondatabase/serverless')
      const { PrismaNeon } = await import('@prisma/adapter-neon')

      // Disable fetch-based WebSocket for Node.js runtime (use native)
      if (typeof WebSocket !== 'undefined') {
        neonConfig.webSocketConstructor = WebSocket as any
      }

      const pool = new Pool({ connectionString: url })
      const adapter = new PrismaNeon(pool)

      return new PrismaClient({
        adapter,
        log: process.env.NODE_ENV === 'development'
          ? ['error', 'warn', 'query']
          : ['error'],
      })
    } catch (err) {
      console.error('[DB] Failed to initialize Neon adapter, falling back to standard PrismaClient:', err)
    }
  }

  // ── Standard Postgres (local dev, other providers) ──
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development'
      ? ['error', 'warn']
      : ['error'],
  })
}

// Use lazy initialization to avoid module-level async issues
let _prismaPromise: Promise<PrismaClient> | null = null

export function getDb(): PrismaClient {
  if (globalForPrisma.prisma) return globalForPrisma.prisma

  // Synchronous fallback during module load (shouldn't normally happen)
  // This ensures `db` is always available synchronously
  if (!_prismaPromise) {
    _prismaPromise = createPrismaClient().then((client) => {
      globalForPrisma.prisma = client
      return client
    })
    // Return a basic PrismaClient immediately for synchronous access
    // It will be replaced once the promise resolves
    globalForPrisma.prisma = new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    })
  }

  return globalForPrisma.prisma
}

// Synchronous db export (for backward compatibility with existing code)
export const db: PrismaClient = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    const client = getDb()
    const value = (client as any)[prop]
    if (typeof value === 'function') {
      return value.bind(client)
    }
    return value
  },
})

// Async initialization — call this early in the app lifecycle (e.g., in layout.tsx or a startup script)
export async function initDb(): Promise<PrismaClient> {
  if (_prismaPromise) {
    return _prismaPromise
  }
  _prismaPromise = createPrismaClient().then((client) => {
    globalForPrisma.prisma = client
    return client
  })
  return _prismaPromise
}

// Keep the hot-reload guard for development
if (process.env.NODE_ENV !== 'production') {
  // In dev, we recreate the client each time the module is reloaded
  if (globalForPrisma.prisma) {
    globalForPrisma.prisma = undefined
    _prismaPromise = null
  }
}
