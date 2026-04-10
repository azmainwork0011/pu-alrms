import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/jwt';
import { getTokenStatus, setToken, clearToken, resetCache } from '@/lib/ai-token';

/**
 * Helper to authenticate and authorize requests
 */
function authenticate(req: NextRequest): { success: true; payload: any } | { success: false; error: string; status: number } {
  const authHeader = req.headers.get('authorization');
  const jwtToken = authHeader?.replace('Bearer ', '');
  if (!jwtToken) return { success: false, error: 'Authentication required', status: 401 };

  const payload = verifyToken(jwtToken);
  if (!payload) return { success: false, error: 'Invalid token', status: 401 };

  return { success: true, payload };
}

/**
 * Helper to check admin/teacher role
 */
function isAdminOrTeacher(role: string): boolean {
  return role === 'ADMIN' || role === 'TEACHER';
}

// ─── GET: Token status (no token value exposed) ──────────
export async function GET(req: NextRequest) {
  const auth = authenticate(req);
  if (!auth.success) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const status = getTokenStatus();
  return NextResponse.json({
    success: true,
    hasToken: status.hasToken,
    isConfigured: status.isConfigured,
    source: status.source,
    sourceDescription: status.sourceDescription,
  });
}

// ─── POST: Set/update token (ADMIN or TEACHER only) ──────
export async function POST(req: NextRequest) {
  const auth = authenticate(req);
  if (!auth.success) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  if (!isAdminOrTeacher(auth.payload.role)) {
    return NextResponse.json({ error: 'Only administrators and teachers can configure the AI token' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { token } = body;

    if (!token || typeof token !== 'string' || !token.trim()) {
      return NextResponse.json({ error: 'A non-empty token string is required' }, { status: 400 });
    }

    setToken(token.trim());
    resetCache();

    return NextResponse.json({
      success: true,
      message: 'AI token saved successfully',
    });
  } catch (error: any) {
    console.error('Token save error:', error);
    return NextResponse.json({ error: 'Failed to save token' }, { status: 500 });
  }
}

// ─── DELETE: Clear token (ADMIN or TEACHER only) ─────────
export async function DELETE(req: NextRequest) {
  const auth = authenticate(req);
  if (!auth.success) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  if (!isAdminOrTeacher(auth.payload.role)) {
    return NextResponse.json({ error: 'Only administrators and teachers can remove the AI token' }, { status: 403 });
  }

  try {
    clearToken();
    resetCache();

    return NextResponse.json({
      success: true,
      message: 'AI token removed successfully',
    });
  } catch (error: any) {
    console.error('Token clear error:', error);
    return NextResponse.json({ error: 'Failed to clear token' }, { status: 500 });
  }
}
