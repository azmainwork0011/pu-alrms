/**
 * Prisma Client Singleton — SQLite (Local Development)
 *
 * Simple, no-adapter setup for SQLite database.
 * For production on Vercel, switch provider to "postgresql" and use Neon adapter.
 */

import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const db = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development'
    ? ['error', 'warn']
    : ['error'],
})

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = db
}

export async function initDb(): Promise<PrismaClient> {
  try {
    await db.$connect()
    console.log('[DB] SQLite connected successfully')
    return db
  } catch (err) {
    console.error('[DB] Failed to connect to SQLite:', err)
    throw err
  }
}
