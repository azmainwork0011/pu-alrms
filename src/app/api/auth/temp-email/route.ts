import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

const rateLimit = new Map<string, { count: number; resetAt: number }>();

function stableId(seed: string): string {
  let h = 0;
  for (let i = 0; i < seed.length; i++) { h = ((h << 5) - h) + seed.charCodeAt(i); h |= 0; }
  const c = 'abcdefghijklmnopqrstuvwxyz0123456789';
  const a = Math.abs(h);
  let r = '';
  for (let i = 0; i < 25; i++) r += c[(a * (i + 7) + i * 31) % c.length];
  return r;
}

async function makeToken(payload: object): Promise<string> {
  try {
    const { signToken } = await import('@/lib/jwt');
    return signToken(payload as any);
  } catch {
    const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
    const body = btoa(JSON.stringify({ ...payload, iat: Math.floor(Date.now() / 1000), exp: Math.floor(Date.now() / 1000) + 86400 * 7 }));
    let sig = 0;
    const secret = process.env.JWT_SECRET || 'pu-alrms-secret-2024';
    const combined = header + '.' + body + '.' + secret;
    for (let i = 0; i < combined.length; i++) sig = ((sig << 5) - sig + combined.charCodeAt(i)) | 0;
    return header + '.' + body + '.' + btoa(String(Math.abs(sig)));
  }
}

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    const now = Date.now();
    const record = rateLimit.get(ip);
    if (record) {
      if (now > record.resetAt) rateLimit.set(ip, { count: 1, resetAt: now + 3600000 });
      else if (record.count >= 10) return NextResponse.json({ error: 'Too many temporary accounts. Please try again later.' }, { status: 429 });
      else record.count++;
    } else {
      rateLimit.set(ip, { count: 1, resetAt: now + 3600000 });
    }

    const { name } = await req.json();
    const randomId = crypto.randomBytes(4).toString('hex');
    const tempEmail = `temp.${randomId}${Date.now().toString(36)}@student.pu.edu`;
    const displayName = name || `Student-${randomId.toUpperCase()}`;

    const userId = stableId(tempEmail);
    const token = await makeToken({ userId, email: tempEmail, role: 'STUDENT', name: displayName });
    const iso = new Date().toISOString();

    return NextResponse.json({
      token,
      user: {
        id: userId, name: displayName, email: tempEmail, role: 'STUDENT', verified: false, status: 'ACTIVE',
        avatar: `https://api.dicebear.com/9.x/identicon/svg?seed=${randomId}&backgroundColor=059669`,
        coverPhoto: null, rollNumber: null, batch: null, department: null, phone: null, bio: null,
        lastLogin: iso, createdAt: iso, updatedAt: iso,
      },
      tempEmail,
    });
  } catch (error) {
    console.error('Temp email auth error:', error);
    return NextResponse.json({ error: 'Temp login failed' }, { status: 500 });
  }
}
