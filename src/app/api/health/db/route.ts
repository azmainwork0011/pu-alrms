/**
 * Database Health Check Endpoint
 *
 * Probes whether the database is reachable and functional.
 * Works with both local SQLite and Turso LibSQL.
 *
 * Response:
 *   { ok: true, mode: "sqlite"|"libsql", latency: "12ms" }
 *   { ok: false, error: "..." }
 */
import { NextResponse } from 'next/server';

export async function GET() {
  const start = Date.now();
  try {
    const { db, getDbMode } = await import('@/lib/db');

    // SELECT 1 works on both SQLite and LibSQL
    await db.$queryRaw`SELECT 1`;

    const latency = Date.now() - start;
    const mode = getDbMode();

    return NextResponse.json({
      ok: true,
      mode,
      latency: `${latency}ms`,
    });
  } catch (err: any) {
    const msg = err?.message || String(err);
    // Log internally but don't expose details to client
    console.error('[DB Health] Check failed:', msg);
    return NextResponse.json(
      { ok: false, error: 'Database is not configured or unreachable' },
      { status: 503 },
    );
  }
}
