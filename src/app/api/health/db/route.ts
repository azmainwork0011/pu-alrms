/**
 * Database Health Check Endpoint
 *
 * Probes whether the database is reachable and functional.
 * Used by the frontend to toggle feature availability.
 *
 * Response:
 *   { ok: true,  latency: "12ms" }       — DB is connected
 *   { ok: false, error: "..." }           — DB is unavailable
 */
import { NextResponse } from 'next/server';

export async function GET() {
  const start = Date.now();
  try {
    const { db } = await import('@/lib/db');
    // Run a lightweight query to verify database connectivity
    await db.$queryRaw`SELECT 1`;
    const latency = Date.now() - start;
    return NextResponse.json({ ok: true, latency: `${latency}ms` });
  } catch (err: any) {
    const msg = err?.message || String(err);
    // Don't expose internal errors to the client
    return NextResponse.json(
      { ok: false, error: 'Database is not configured or unreachable' },
      { status: 503 },
    );
  }
}
