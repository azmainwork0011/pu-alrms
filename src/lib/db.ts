/**
 * Prisma Client — Smart Dual-Mode (SQLite / Turso LibSQL)
 *
 * Automatically detects the database backend from DATABASE_URL:
 * - `libsql:` or `*.turso.tech` → Turso LibSQL (production on Vercel)
 * - `file:` or anything else    → Local SQLite (development)
 *
 * For Turso, uses @prisma/adapter-libsql + @libsql/client with auth token.
 * For local SQLite, uses plain PrismaClient (no adapter needed).
 *
 * The exported `db` is a synchronous Proxy that lazily initializes the client.
 */

import { PrismaClient } from '@prisma/client'

// ─── Connection Mode Detection ───────────────────────────────
type DbMode = 'libsql' | 'sqlite'

function detectMode(url: string): DbMode {
  if (!url) return 'sqlite'
  const lower = url.toLowerCase()
  if (lower.startsWith('libsql:') || lower.includes('turso.tech')) return 'libsql'
  return 'sqlite'
}

function getDbUrl(): string {
  return process.env.DATABASE_URL || 'file:./db/custom.db'
}

function getDbAuthToken(): string {
  return process.env.DATABASE_AUTH_TOKEN || ''
}

// ─── Global Singleton ────────────────────────────────────────
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
  dbInitialized: boolean
}

// ─── Client Factory ──────────────────────────────────────────
async function createPrismaClient(): Promise<PrismaClient> {
  const url = getDbUrl()
  const mode = detectMode(url)

  if (mode === 'libsql') {
    try {
      const { createClient } = await import('@libsql/client')
      const { PrismaLibSQL } = await import('@prisma/adapter-libsql')

      const authToken = getDbAuthToken()

      const libsql = createClient({
        url,
        ...(authToken ? { authToken } : {}),
      })

      const adapter = new PrismaLibSQL(libsql)

      const client = new PrismaClient({
        adapter,
        log: process.env.NODE_ENV === 'production'
          ? ['error']
          : ['error', 'warn'],
      })

      console.log(`[DB] ✅ Turso LibSQL connected`)
      return client
    } catch (err) {
      console.error('[DB] ❌ Failed to connect to Turso LibSQL:', err)
      console.error('[DB] Falling back to local SQLite...')
      return createLocalClient()
    }
  }

  return createLocalClient()
}

function createLocalClient(): PrismaClient {
  console.log('[DB] ✅ Using local SQLite')
  const client = new PrismaClient({
    log: process.env.NODE_ENV === 'development'
      ? ['error', 'warn']
      : ['error'],
  })
  // Ensure schema exists — safe to call multiple times (idempotent)
  // This creates tables if they don't exist
  if (!globalForPrisma.dbInitialized) {
    client.$connect().then(() => {
      console.log('[DB] SQLite connected, schema ready')
    }).catch((err) => {
      console.error('[DB] SQLite $connect failed:', err)
    })
    globalForPrisma.dbInitialized = true
  }
  return client
}

// ─── Lazy Initialization ─────────────────────────────────────
let _initPromise: Promise<PrismaClient> | null = null

function ensureInit(): void {
  if (_initPromise || globalForPrisma.prisma) return
  _initPromise = createPrismaClient().then((client) => {
    globalForPrisma.prisma = client
    return client
  })
}

function getPrismaClient(): PrismaClient {
  if (globalForPrisma.prisma) return globalForPrisma.prisma
  // Create a plain client immediately for sync access
  // It will be replaced once the async init completes
  globalForPrisma.prisma = createLocalClient()
  ensureInit()
  return globalForPrisma.prisma
}

// ─── Synchronous Export (Proxy) ─────────────────────────────
// All 47+ API routes and auth.ts import `db` synchronously.
// The Proxy ensures it always resolves to a valid PrismaClient.
export const db: PrismaClient = new Proxy({} as PrismaClient, {
  get(_target, prop, receiver) {
    const client = getPrismaClient()
    const value = (client as any)[prop]
    if (typeof value === 'function') {
      return value.bind(client)
    }
    return value
  },
})

// ─── Async Initialization (call early in app lifecycle) ─────
export async function initDb(): Promise<PrismaClient> {
  if (globalForPrisma.prisma && globalForPrisma.dbInitialized) {
    return globalForPrisma.prisma
  }

  const client = await createPrismaClient()
  globalForPrisma.prisma = client
  globalForPrisma.dbInitialized = true

  try {
    await client.$connect()
    console.log('[DB] Connection established')
  } catch (err) {
    console.error('[DB] $connect() failed:', err)
  }

  return client
}

// ─── Connection Info Helper ──────────────────────────────────
export function getDbMode(): DbMode {
  return detectMode(getDbUrl())
}

// ─── Hot-Reload Guard (development only) ─────────────────────
if (process.env.NODE_ENV !== 'production') {
  if (globalForPrisma.prisma) {
    globalForPrisma.prisma = undefined
    globalForPrisma.dbInitialized = false
    _initPromise = null
  }
}
