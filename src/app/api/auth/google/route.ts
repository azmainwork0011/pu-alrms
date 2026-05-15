import { NextRequest, NextResponse } from 'next/server';

const ACCOUNTS: Record<string, { name: string; role: string; verified: boolean; avatar: string }> = {
  'admin@pu.edu': { name: 'System Admin', role: 'SUPER_ADMIN', verified: true, avatar: 'https://api.dicebear.com/9.x/initials/svg?seed=SA&backgroundColor=c0392b' },
  'diya.jainazmain9086@example.com': { name: 'Diya Jain', role: 'SUPER_ADMIN', verified: true, avatar: 'https://api.dicebear.com/9.x/initials/svg?seed=DJ&backgroundColor=c0392b' },
  'dr.smith@pu.edu': { name: 'Dr. Sarah Smith', role: 'TEACHER', verified: false, avatar: 'https://api.dicebear.com/9.x/initials/svg?seed=SS&backgroundColor=27ae60' },
  'prof.johnson@pu.edu': { name: 'Prof. Mark Johnson', role: 'TEACHER', verified: false, avatar: 'https://api.dicebear.com/9.x/initials/svg?seed=MJ&backgroundColor=2980b9' },
  'alice@stu.pu.edu': { name: 'Alice Chen', role: 'STUDENT', verified: false, avatar: 'https://api.dicebear.com/9.x/initials/svg?seed=AC&backgroundColor=8e44ad' },
  'bob@stu.pu.edu': { name: 'Bob Martinez', role: 'STUDENT', verified: false, avatar: 'https://api.dicebear.com/9.x/initials/svg?seed=BM&backgroundColor=d35400' },
  'carol@stu.pu.edu': { name: 'Carol Williams', role: 'STUDENT', verified: false, avatar: 'https://api.dicebear.com/9.x/initials/svg?seed=CW&backgroundColor=16a085' },
  'david@stu.pu.edu': { name: 'David Kim', role: 'STUDENT', verified: false, avatar: 'https://api.dicebear.com/9.x/initials/svg?seed=DK&backgroundColor=2c3e50' },
  'emma@stu.pu.edu': { name: 'Emma Wilson', role: 'STUDENT', verified: false, avatar: 'https://api.dicebear.com/9.x/initials/svg?seed=EW&backgroundColor=c0392b' },
  'dev.alpha@pu.edu': { name: 'Dev Alpha', role: 'DEVELOPER', verified: false, avatar: 'https://api.dicebear.com/9.x/initials/svg?seed=DA&backgroundColor=1abc9c' },
  'dev.beta@pu.edu': { name: 'Dev Beta', role: 'DEVELOPER', verified: false, avatar: 'https://api.dicebear.com/9.x/initials/svg?seed=DB&backgroundColor=9b59b6' },
};

function stableId(email: string): string {
  let h = 0;
  for (let i = 0; i < email.length; i++) { h = ((h << 5) - h) + email.charCodeAt(i); h |= 0; }
  const c = 'abcdefghijklmnopqrstuvwxyz0123456789';
  const a = Math.abs(h);
  let r = '';
  for (let i = 0; i < 25; i++) r += c[(a * (i + 7) + i * 31) % c.length];
  return r;
}

export async function POST(req: NextRequest) {
  try {
    const { name, email } = await req.json();

    if (!name || !email) {
      return NextResponse.json({ error: 'Name and email are required' }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const known = ACCOUNTS[normalizedEmail];

    try {
      const { signToken, verifyToken } = await import('@/lib/jwt');
      const { db } = await import('@/lib/db');

      // Check DB first
      const existingUser = await db.user.findUnique({ where: { email: normalizedEmail } });
      if (existingUser) {
        const token = signToken({ userId: existingUser.id, email: existingUser.email, role: existingUser.role, name: existingUser.name });
        const { password: _, ...userWithoutPassword } = existingUser;
        return NextResponse.json({ token, user: userWithoutPassword, isExisting: true });
      }
    } catch {
      // DB unavailable
    }

    // Fallback: use hardcoded account or create temporary
    const acc = known || { name, role: 'STUDENT', verified: false, avatar: `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(name)}&backgroundColor=059669` };
    const userId = known ? stableId(normalizedEmail) : stableId(normalizedEmail + '-' + Date.now());

    let token: string;
    try {
      const { signToken } = await import('@/lib/jwt');
      token = signToken({ userId, email: normalizedEmail, role: acc.role, name: acc.name });
    } catch {
      const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
      const body = btoa(JSON.stringify({ userId, email: normalizedEmail, role: acc.role, name: acc.name, iat: Math.floor(Date.now() / 1000), exp: Math.floor(Date.now() / 1000) + 86400 * 7 }));
      let sig = 0;
      const secret = process.env.JWT_SECRET || 'pu-alrms-secret-2024';
      const combined = header + '.' + body + '.' + secret;
      for (let i = 0; i < combined.length; i++) sig = ((sig << 5) - sig + combined.charCodeAt(i)) | 0;
      token = header + '.' + body + '.' + btoa(String(Math.abs(sig)));
    }

    const now = new Date().toISOString();
    return NextResponse.json({
      token,
      user: { id: userId, name: acc.name, email: normalizedEmail, role: acc.role, verified: acc.verified, status: 'ACTIVE', avatar: acc.avatar, coverPhoto: null, rollNumber: null, batch: null, department: null, phone: null, bio: null, lastLogin: now, createdAt: now, updatedAt: now },
      isExisting: !!known,
    });
  } catch (error) {
    console.error('Google auth error:', error);
    return NextResponse.json({ error: 'Authentication failed' }, { status: 500 });
  }
}
