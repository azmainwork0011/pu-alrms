/**
 * Prisma Client — Smart Dual-Mode (SQLite / Turso LibSQL)
 *
 * Automatically detects the database backend from DATABASE_URL:
 * - `libsql:` or `*.turso.tech` → Turso LibSQL (production on Vercel)
 * - `file:` or anything else    → Local SQLite (development)
 *
 * For Turso, uses @prisma/adapter-libsql with a config object (NOT a client instance).
 * The adapter creates its own internal @libsql/client.
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
  initPromise: Promise<PrismaClient> | null
}

// ─── Client Factory ──────────────────────────────────────────
async function createPrismaClient(): Promise<PrismaClient> {
  const url = getDbUrl()
  const mode = detectMode(url)

  if (mode === 'libsql') {
    try {
      const { PrismaLibSQL } = await import('@prisma/adapter-libsql')

      const authToken = getDbAuthToken()

      // IMPORTANT: PrismaLibSQL expects a CONFIG object { url, authToken },
      // NOT a pre-created @libsql/client instance.
      // The adapter creates its own internal client via its bundled @libsql/client.
      const adapter = new PrismaLibSQL({
        url,
        ...(authToken ? { authToken } : {}),
      })

      const client = new PrismaClient({
        adapter,
        log: process.env.NODE_ENV === 'production'
          ? ['error']
          : ['error', 'warn'],
      })

      console.log(`[DB] ✅ Turso LibSQL connected: ${url.replace(/authToken=[^&]+/, 'authToken=***')}`)
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

  // CRITICAL: Temporarily override DATABASE_URL for PrismaClient construction.
  // On Vercel, DATABASE_URL is `libsql://...` but provider="sqlite" only
  // accepts `file:` URLs. The datasourceUrl config option in Prisma 6 still
  // validates the env variable at schema load time, so we must override
  // the env var directly to avoid: "URL must start with the protocol file:"
  const originalUrl = process.env.DATABASE_URL
  const localUrl = process.env.NODE_ENV === 'production'
    ? 'file:/tmp/pu-alrms-local.db'
    : 'file:./db/custom.db'
  process.env.DATABASE_URL = localUrl

  let client: PrismaClient
  try {
    client = new PrismaClient({
      log: process.env.NODE_ENV === 'development'
        ? ['error', 'warn']
        : ['error'],
    })
  } finally {
    // Restore original DATABASE_URL so Turso init picks it up correctly
    process.env.DATABASE_URL = originalUrl
  }

  // Ensure connection is established
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
function ensureInit(): void {
  if (globalForPrisma.initPromise || globalForPrisma.prisma) return
  globalForPrisma.initPromise = createPrismaClient().then((client) => {
    // Replace the local fallback client with the real one (Turso or SQLite)
    if (globalForPrisma.prisma && globalForPrisma.prisma !== client) {
      globalForPrisma.prisma.$disconnect().catch(() => {})
    }
    globalForPrisma.prisma = client
    return client
  }).catch((err) => {
    console.error('[DB] Init failed:', err)
    // Keep the local client as fallback
  })
}

function getPrismaClient(): PrismaClient {
  if (globalForPrisma.prisma) return globalForPrisma.prisma

  // Create a local client immediately for synchronous access.
  // It will be replaced once the async Turso init completes.
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
    globalForPrisma.initPromise = null
  }
}
