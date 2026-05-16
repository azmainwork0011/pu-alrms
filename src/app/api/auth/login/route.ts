import { NextRequest, NextResponse } from 'next/server';

// ═══════════════════════════════════════════════════════════════════
// PRODUCTION LOGIN — DB-first with hardcoded fallback
// 1. Checks the database (bcrypt) for any registered user
// 2. Falls back to hardcoded demo accounts (plain text)
// 3. Returns JWT + full user object
// ═══════════════════════════════════════════════════════════════════

// Hardcoded demo accounts — fallback if DB is unavailable
const DEMO_ACCOUNTS: Record<string, { password: string; name: string; role: string; verified: boolean; avatar: string }> = {
  'admin@pu.edu': {
    password: 'admin123',
    name: 'System Admin',
    role: 'SUPER_ADMIN',
    verified: true,
    avatar: 'https://api.dicebear.com/9.x/initials/svg?seed=SA&backgroundColor=c0392b',
  },
  'diya.jainazmain9086@example.com': {
    password: 'superadmin2024',
    name: 'Diya Jain',
    role: 'SUPER_ADMIN',
    verified: true,
    avatar: 'https://api.dicebear.com/9.x/initials/svg?seed=DJ&backgroundColor=c0392b',
  },
  'dr.smith@pu.edu': {
    password: 'teacher123',
    name: 'Dr. Sarah Smith',
    role: 'TEACHER',
    verified: false,
    avatar: 'https://api.dicebear.com/9.x/initials/svg?seed=SS&backgroundColor=27ae60',
  },
  'prof.johnson@pu.edu': {
    password: 'teacher123',
    name: 'Prof. Mark Johnson',
    role: 'TEACHER',
    verified: false,
    avatar: 'https://api.dicebear.com/9.x/initials/svg?seed=MJ&backgroundColor=2980b9',
  },
  'alice@stu.pu.edu': {
    password: 'student123',
    name: 'Alice Chen',
    role: 'STUDENT',
    verified: false,
    avatar: 'https://api.dicebear.com/9.x/initials/svg?seed=AC&backgroundColor=8e44ad',
  },
  'bob@stu.pu.edu': {
    password: 'student123',
    name: 'Bob Martinez',
    role: 'STUDENT',
    verified: false,
    avatar: 'https://api.dicebear.com/9.x/initials/svg?seed=BM&backgroundColor=d35400',
  },
  'carol@stu.pu.edu': {
    password: 'student123',
    name: 'Carol Williams',
    role: 'STUDENT',
    verified: false,
    avatar: 'https://api.dicebear.com/9.x/initials/svg?seed=CW&backgroundColor=16a085',
  },
  'david@stu.pu.edu': {
    password: 'student123',
    name: 'David Kim',
    role: 'STUDENT',
    verified: false,
    avatar: 'https://api.dicebear.com/9.x/initials/svg?seed=DK&backgroundColor=2c3e50',
  },
  'emma@stu.pu.edu': {
    password: 'student123',
    name: 'Emma Wilson',
    role: 'STUDENT',
    verified: false,
    avatar: 'https://api.dicebear.com/9.x/initials/svg?seed=EW&backgroundColor=c0392b',
  },
  'dev.alpha@pu.edu': {
    password: 'dev123',
    name: 'Dev Alpha',
    role: 'DEVELOPER',
    verified: false,
    avatar: 'https://api.dicebear.com/9.x/initials/svg?seed=DA&backgroundColor=1abc9c',
  },
  'dev.beta@pu.edu': {
    password: 'dev123',
    name: 'Dev Beta',
    role: 'DEVELOPER',
    verified: false,
    avatar: 'https://api.dicebear.com/9.x/initials/svg?seed=DB&backgroundColor=9b59b6',
  },
};

// Stable ID generator — same email always gets same ID
function stableId(email: string): string {
  let h = 0;
  for (let i = 0; i < email.length; i++) {
    h = ((h << 5) - h) + email.charCodeAt(i);
    h |= 0;
  }
  const c = 'abcdefghijklmnopqrstuvwxyz0123456789';
  const a = Math.abs(h);
  let r = '';
  for (let i = 0; i < 25; i++) r += c[(a * (i + 7) + i * 31) % c.length];
  return r;
}

// Inline JWT signing — fallback if jsonwebtoken fails
function makeJWT(payload: object): string {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = btoa(
    JSON.stringify({ ...payload, iat: Math.floor(Date.now() / 1000), exp: Math.floor(Date.now() / 1000) + 86400 * 7 })
  );
  const secret = process.env.JWT_SECRET || 'pu-alrms-secret-2024';
  let sig = 0;
  const combined = header + '.' + body + '.' + secret;
  for (let i = 0; i < combined.length; i++) {
    sig = ((sig << 5) - sig + combined.charCodeAt(i)) | 0;
  }
  return header + '.' + body + '.' + btoa(String(Math.abs(sig)));
}

function buildUserResponse(user: { id: string; name: string; email: string; role: string; verified: boolean; avatar?: string | null; status?: string; rollNumber?: string | null; batch?: string | null; department?: string | null; phone?: string | null; bio?: string | null; coverPhoto?: string | null; lastLogin?: Date | null; createdAt?: Date | null; updatedAt?: Date | null }) {
  const now = new Date().toISOString();
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    verified: user.verified,
    status: user.status || 'ACTIVE',
    avatar: user.avatar || null,
    coverPhoto: user.coverPhoto || null,
    rollNumber: user.rollNumber || null,
    batch: user.batch || null,
    department: user.department || null,
    phone: user.phone || null,
    bio: user.bio || null,
    lastLogin: user.lastLogin ? new Date(user.lastLogin).toISOString() : now,
    createdAt: user.createdAt ? new Date(user.createdAt).toISOString() : now,
    updatedAt: user.updatedAt ? new Date(user.updatedAt).toISOString() : now,
  };
}

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // ── Strategy 1: Try database authentication (bcrypt) ──
    try {
      const { db } = await import('@/lib/db');
      const { compare } = await import('bcryptjs');

      const dbUser = await db.user.findUnique({
        where: { email: normalizedEmail },
      });

      if (dbUser) {
        // Check if user is banned
        if (dbUser.status === 'BANNED') {
          return NextResponse.json({ error: 'Account has been banned. Contact support.' }, { status: 403 });
        }
        if (dbUser.status === 'SUSPENDED') {
          return NextResponse.json({ error: 'Account is suspended. Contact an administrator.' }, { status: 403 });
        }

        const passwordMatch = await compare(password, dbUser.password);
        if (passwordMatch) {
          // Update last login
          await db.user.update({
            where: { id: dbUser.id },
            data: { lastLogin: new Date() },
          });

          // Generate token
          let token: string;
          try {
            const { signToken } = await import('@/lib/jwt');
            token = signToken({
              userId: dbUser.id,
              email: dbUser.email,
              role: dbUser.role,
              name: dbUser.name,
            });
          } catch {
            token = makeJWT({
              userId: dbUser.id,
              email: dbUser.email,
              role: dbUser.role,
              name: dbUser.name,
            });
          }

          return NextResponse.json({
            token,
            user: buildUserResponse({
              ...dbUser,
              lastLogin: new Date(),
            }),
          });
        }
        // Password didn't match — fall through to check hardcoded accounts
        // (unlikely but handles edge case where same email exists in both)
      }
    } catch {
      // DB unavailable — fall through to hardcoded accounts
    }

    // ── Strategy 2: Hardcoded demo accounts (fallback) ──
    const demo = DEMO_ACCOUNTS[normalizedEmail];

    if (!demo) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    if (password !== demo.password) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    const userId = stableId(normalizedEmail);

    let token: string;
    try {
      const { signToken } = await import('@/lib/jwt');
      token = signToken({
        userId,
        email: normalizedEmail,
        role: demo.role,
        name: demo.name,
      });
    } catch {
      token = makeJWT({
        userId,
        email: normalizedEmail,
        role: demo.role,
        name: demo.name,
      });
    }

    const now = new Date().toISOString();

    return NextResponse.json({
      token,
      user: {
        id: userId,
        name: demo.name,
        email: normalizedEmail,
        role: demo.role,
        verified: demo.verified,
        status: 'ACTIVE',
        avatar: demo.avatar,
        coverPhoto: null,
        rollNumber: null,
        batch: null,
        department: null,
        phone: null,
        bio: null,
        lastLogin: now,
        createdAt: now,
        updatedAt: now,
      },
    });
  } catch (error) {
    console.error('[Login] Error:', error instanceof Error ? error.message : error);
    return NextResponse.json({ error: 'Login failed. Please try again.' }, { status: 500 });
  }
}
