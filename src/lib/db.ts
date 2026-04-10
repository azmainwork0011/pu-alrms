import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

let prisma: PrismaClient

try {
  prisma = globalForPrisma.prisma ?? new PrismaClient({
    log: ['error', 'warn'],
  })
} catch {
  // If cached client is stale, create a new one
  prisma = new PrismaClient({
    log: ['error', 'warn'],
  })
}

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}

export const db = prisma
