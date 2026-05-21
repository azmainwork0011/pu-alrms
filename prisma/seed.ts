/**
 * PU-ALRMS Database Seed Script
 *
 * Seeds the database with:
 * 1. Super Admin (from SUPER_ADMIN_EMAIL env var)
 * 2. Demo accounts (CR, Student, Teacher) for development/testing
 * 3. Demo batch (CSE-2024) and sample subjects
 * 4. Quiz categories and sample questions
 *
 * Usage:
 *   bun run db:seed          # Seed all data
 *   SUPER_ADMIN_EMAIL=you@email.com bun run db:seed  # With custom admin email
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// ─── Configuration ──────────────────────────────────────────
const SUPER_ADMIN_EMAIL = process.env.SUPER_ADMIN_EMAIL || '';
const BATCH = 'CSE-2024';
const DEPARTMENT = 'Computer Science & Engineering';

// ─── Demo Accounts ──────────────────────────────────────────
const DEMO_ACCOUNTS = [
  {
    email: 'cr@stu.pu.edu',
    name: 'CR User',
    password: 'cr123',
    role: 'CR',
    rollNumber: 'CSE-2024-001',
    batch: BATCH,
    department: DEPARTMENT,
  },
  {
    email: 'alice@stu.pu.edu',
    name: 'Alice Student',
    password: 'student123',
    role: 'STUDENT',
    rollNumber: 'CSE-2024-002',
    batch: BATCH,
    department: DEPARTMENT,
  },
  {
    email: 'teacher@pu.edu',
    name: 'Dr. Teacher',
    password: 'teacher123',
    role: 'TEACHER',
    batch: BATCH,
    department: DEPARTMENT,
  },
  {
    email: 'admin@pu.edu',
    name: 'Admin User',
    password: 'admin123',
    role: 'ADMIN',
    batch: BATCH,
    department: DEPARTMENT,
  },
];

// ─── Demo Subjects ──────────────────────────────────────────
const DEMO_SUBJECTS = [
  { name: 'Data Structures', code: 'CSE-201', batch: BATCH },
  { name: 'Algorithms', code: 'CSE-202', batch: BATCH },
  { name: 'Database Management', code: 'CSE-203', batch: BATCH },
  { name: 'Operating Systems', code: 'CSE-204', batch: BATCH },
  { name: 'Software Engineering', code: 'CSE-205', batch: BATCH },
];

// ─── Demo Quiz Categories ───────────────────────────────────
const DEMO_QUIZ_CATEGORIES = [
  { name: 'Data Structures', department: 'CSE', icon: '🌳', difficulty: 'MEDIUM' },
  { name: 'Algorithms', department: 'CSE', icon: '🧮', difficulty: 'HARD' },
  { name: 'Database', department: 'CSE', icon: '🗃️', difficulty: 'MEDIUM' },
  { name: 'Operating Systems', department: 'CSE', icon: '💻', difficulty: 'HARD' },
  { name: 'Physics', department: 'GEN', icon: '⚛️', difficulty: 'MEDIUM' },
  { name: 'Mathematics', department: 'GEN', icon: '📐', difficulty: 'EASY' },
];

// ─── Helpers ────────────────────────────────────────────────
async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

async function upsertUser(data: {
  email: string;
  name: string;
  password: string;
  role: string;
  rollNumber?: string;
  batch?: string;
  department?: string;
  verified?: boolean;
  avatar?: string;
}) {
  const hashedPassword = await hashPassword(data.password);

  return prisma.user.upsert({
    where: { email: data.email },
    update: {
      name: data.name,
      role: data.role,
      ...(data.rollNumber ? { rollNumber: data.rollNumber } : {}),
      ...(data.batch ? { batch: data.batch } : {}),
      ...(data.department ? { department: data.department } : {}),
    },
    create: {
      email: data.email,
      name: data.name,
      password: hashedPassword,
      role: data.role,
      authProvider: 'EMAIL',
      verified: data.verified ?? false,
      status: 'ACTIVE',
      rollNumber: data.rollNumber,
      batch: data.batch,
      department: data.department,
      avatar: data.avatar || `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(data.name)}&backgroundColor=059669`,
    },
  });
}

// ─── Seed Functions ─────────────────────────────────────────

async function seedSuperAdmin() {
  if (!SUPER_ADMIN_EMAIL) {
    console.log('⚠️  SUPER_ADMIN_EMAIL not set — skipping super admin seed');
    console.log('   Set SUPER_ADMIN_EMAIL env var to create a super admin');
    return;
  }

  const name = 'Super Admin';
  const avatar = `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(name)}&backgroundColor=dc2626`;

  const superAdmin = await upsertUser({
    email: SUPER_ADMIN_EMAIL,
    name,
    password: 'super123',
    role: 'SUPER_ADMIN',
    verified: true,
    avatar,
  });

  console.log(`✅ Super Admin: ${SUPER_ADMIN_EMAIL} (${superAdmin.role})`);
}

async function seedDemoAccounts() {
  console.log('\n--- Seeding Demo Accounts ---');

  for (const account of DEMO_ACCOUNTS) {
    const user = await upsertUser(account);
    console.log(`✅ ${account.name}: ${account.email} (${user.role})`);
  }

  // Also create super admin as demo if SUPER_ADMIN_EMAIL is set
  if (SUPER_ADMIN_EMAIL && SUPER_ADMIN_EMAIL !== 'admin@pu.edu') {
    await upsertUser({
      email: SUPER_ADMIN_EMAIL,
      name: 'Super Admin',
      password: 'super123',
      role: 'SUPER_ADMIN',
      verified: true,
    });
    console.log(`✅ Super Admin: ${SUPER_ADMIN_EMAIL}`);
  }
}

async function seedSubjects() {
  console.log('\n--- Seeding Subjects ---');

  // Find the teacher user
  const teacher = await prisma.user.findFirst({
    where: { role: 'TEACHER' },
  });

  if (!teacher) {
    console.log('⚠️  No teacher found — skipping subjects');
    return;
  }

  for (const subject of DEMO_SUBJECTS) {
    const s = await prisma.subject.upsert({
      where: {
        id: `${subject.code}-${subject.batch}`,
      },
      update: {
        name: subject.name,
        teacherId: teacher.id,
      },
      create: {
        id: `${subject.code}-${subject.batch}`,
        name: subject.name,
        code: subject.code,
        teacherId: teacher.id,
        batch: subject.batch,
      },
    });
    console.log(`✅ Subject: ${s.name} (${s.code})`);
  }
}

async function seedQuizCategories() {
  console.log('\n--- Seeding Quiz Categories ---');

  for (const cat of DEMO_QUIZ_CATEGORIES) {
    const category = await prisma.quizCategory.upsert({
      where: {
        id: `quiz-${cat.name.toLowerCase().replace(/\s+/g, '-')}`,
      },
      update: {},
      create: {
        id: `quiz-${cat.name.toLowerCase().replace(/\s+/g, '-')}`,
        name: cat.name,
        department: cat.department,
        icon: cat.icon,
        difficulty: cat.difficulty,
      },
    });
    console.log(`✅ Quiz Category: ${category.name}`);
  }
}

async function seedBatchNotifications() {
  console.log('\n--- Seeding Welcome Notification ---');

  const cr = await prisma.user.findFirst({ where: { role: 'CR' } });
  if (!cr) {
    console.log('⚠️  No CR found — skipping notifications');
    return;
  }

  await prisma.batchNotification.upsert({
    where: { id: 'welcome-notification' },
    update: {},
    create: {
      id: 'welcome-notification',
      batch: BATCH,
      title: 'Welcome to PU-ALRMS!',
      message: 'Welcome to the Presidency University Academic Lab Report Management System. Use this platform to submit lab reports, check assignments, and stay connected with your batch.',
      type: 'GENERAL',
      sentBy: cr.id,
    },
  });

  console.log('✅ Welcome notification created');
}

// ─── Main ───────────────────────────────────────────────────
async function main() {
  console.log('╔══════════════════════════════════════════════╗');
  console.log('║       PU-ALRMS Database Seeder                ║');
  console.log('╚══════════════════════════════════════════════╝');
  console.log(`Database: ${process.env.DATABASE_URL ? 'Connected' : 'NOT CONFIGURED'}`);
  console.log(`Super Admin Email: ${SUPER_ADMIN_EMAIL || '(not set)'}`);
  console.log('');

  try {
    await seedSuperAdmin();
    await seedDemoAccounts();
    await seedSubjects();
    await seedQuizCategories();
    await seedBatchNotifications();

    console.log('\n══════════════════════════════════════════════');
    console.log('✅ Seed completed successfully!');
    console.log('══════════════════════════════════════════════');
  } catch (error) {
    console.error('\n❌ Seed failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
