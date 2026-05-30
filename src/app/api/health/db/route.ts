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

    // Use Prisma's built-in query instead of raw SQL (more compatible with adapters)
    await db.user.count({ take: 0 });

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
    console.error('[DB Health] Error code:', err?.code);
    console.error('[DB Health] Stack:', err?.stack?.substring(0, 200));
    return NextResponse.json(
      { ok: false, error: 'Database is not configured or unreachable', debug: msg.substring(0, 200) },
      { status: 503 },
    );
  }
}
