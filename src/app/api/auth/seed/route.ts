import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { hash } from 'bcryptjs';

const DEMO_ACCOUNTS = [
  // ─── Super Admin (exclusive control) ───
  {
    name: 'Diya Jain',
    email: 'diya.jainazmain9086@example.com',
    password: 'superadmin2024',
    role: 'SUPER_ADMIN',
    verified: true,
  },
  // ─── Developer accounts ───
  {
    name: 'Dev Alpha',
    email: 'dev.alpha@pu.edu',
    password: 'dev123',
    role: 'DEVELOPER',
    verified: false,
  },
  {
    name: 'Dev Beta',
    email: 'dev.beta@pu.edu',
    password: 'dev123',
    role: 'DEVELOPER',
    verified: false,
  },
  // ─── Platform Admin ───
  {
    name: 'System Admin',
    email: 'admin@pu.edu',
    password: 'admin123',
    role: 'SUPER_ADMIN',
    verified: true,
  },
  // ─── Teacher ───
  {
    name: 'Dr. Sarah Smith',
    email: 'dr.smith@pu.edu',
    password: 'teacher123',
    role: 'TEACHER',
    verified: false,
  },
  {
    name: 'Prof. Mark Johnson',
    email: 'prof.johnson@pu.edu',
    password: 'teacher123',
    role: 'TEACHER',
    verified: false,
  },
  // ─── Student ───
  {
    name: 'Alice Chen',
    email: 'alice@stu.pu.edu',
    password: 'student123',
    role: 'STUDENT',
    verified: false,
  },
  {
    name: 'Bob Martinez',
    email: 'bob@stu.pu.edu',
    password: 'student123',
    role: 'STUDENT',
    verified: false,
  },
  {
    name: 'Carol Williams',
    email: 'carol@stu.pu.edu',
    password: 'student123',
    role: 'STUDENT',
    verified: false,
  },
  {
    name: 'David Kim',
    email: 'david@stu.pu.edu',
    password: 'student123',
    role: 'STUDENT',
    verified: false,
  },
  {
    name: 'Emma Wilson',
    email: 'emma@stu.pu.edu',
    password: 'student123',
    role: 'STUDENT',
    verified: false,
  },
];

export async function POST() {
  try {
    const results: { email: string; status: string }[] = [];

    for (const acc of DEMO_ACCOUNTS) {
      const existing = await db.user.findUnique({ where: { email: acc.email } });
      const hashedPassword = await hash(acc.password, 12);

      if (existing) {
        await db.user.update({
          where: { email: acc.email },
          data: {
            password: hashedPassword,
            role: acc.role,
            name: acc.name,
            verified: acc.verified,
            status: 'ACTIVE',
          },
        });
        results.push({ email: acc.email, status: 'updated' });
      } else {
        await db.user.create({
          data: {
            name: acc.name,
            email: acc.email,
            password: hashedPassword,
            role: acc.role,
            verified: acc.verified,
            status: 'ACTIVE',
            avatar: acc.role === 'SUPER_ADMIN'
              ? 'https://api.dicebear.com/9.x/initials/svg?seed=SA&backgroundColor=c0392b'
              : acc.role === 'TEACHER'
              ? `https://api.dicebear.com/9.x/initials/svg?seed=${acc.name.split(' ').map(n => n[0]).join('')}&backgroundColor=27ae60`
              : `https://api.dicebear.com/9.x/initials/svg?seed=${acc.name.split(' ').map(n => n[0]).join('')}&backgroundColor=8e44ad`,
          },
        });
        results.push({ email: acc.email, status: 'created' });
      }
    }

    return NextResponse.json({ success: true, results });
  } catch (error) {
    console.error('Seed error:', error);
    return NextResponse.json({ error: 'Seed failed' }, { status: 500 });
  }
}
