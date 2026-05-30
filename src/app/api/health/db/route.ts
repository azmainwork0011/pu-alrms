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
    const { initDb, getDbMode } = await import('@/lib/db');

    // Use initDb() to ensure the Turso client is fully initialized.
    // The sync Proxy might hit the local fallback before Turso is ready.
    const db = await initDb();

    // Use Prisma's built-in query
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
    console.error('[DB Health] Check failed:', msg);
    return NextResponse.json(
      { ok: false, error: 'Database is not configured or unreachable', debug: msg.substring(0, 300) },
      { status: 503 },
    );
  }
}
