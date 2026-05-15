import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { hash } from 'bcryptjs';

// ─── Vercel Auto-Setup ───────────────────────────────────
// This endpoint initializes the database schema and seeds demo data.
// On Vercel, call this once after deployment: /api/setup
// It uses Prisma db push internally to create tables, then seeds data.

export async function GET() {
  try {
    const startTime = Date.now();

    // 1. Check if already set up (try to find any user)
    try {
      const userCount = await db.user.count();
      if (userCount > 0) {
        return NextResponse.json({
          success: true,
          message: 'Database already initialized',
          userCount,
          time: `${Date.now() - startTime}ms`,
        });
      }
    } catch {
      // Database might not exist yet — continue with setup
    }

    // 2. Create admin account
    const adminPass = await hash('admin123', 12);
    const teacherPass = await hash('teacher123', 12);
    const studentPass = await hash('student123', 12);

    const admin = await db.user.create({
      data: {
        name: 'System Admin',
        email: 'admin@pu.edu',
        password: adminPass,
        role: 'SUPER_ADMIN',
        avatar: 'https://api.dicebear.com/9.x/initials/svg?seed=SA&backgroundColor=c0392b',
      },
    });

    // 3. Create teacher accounts
    const teacher1 = await db.user.create({
      data: {
        name: 'Dr. Sarah Smith',
        email: 'dr.smith@pu.edu',
        password: teacherPass,
        role: 'TEACHER',
        avatar: 'https://api.dicebear.com/9.x/initials/svg?seed=SS&backgroundColor=27ae60',
      },
    });

    const teacher2 = await db.user.create({
      data: {
        name: 'Prof. Mark Johnson',
        email: 'prof.johnson@pu.edu',
        password: teacherPass,
        role: 'TEACHER',
        avatar: 'https://api.dicebear.com/9.x/initials/svg?seed=MJ&backgroundColor=2980b9',
      },
    });

    // 4. Create student accounts
    const studentData = [
      { name: 'Alice Chen', email: 'alice@stu.pu.edu', seed: 'AC', color: '8e44ad' },
      { name: 'Bob Martinez', email: 'bob@stu.pu.edu', seed: 'BM', color: 'd35400' },
      { name: 'Carol Williams', email: 'carol@stu.pu.edu', seed: 'CW', color: '16a085' },
      { name: 'David Kim', email: 'david@stu.pu.edu', seed: 'DK', color: '2c3e50' },
      { name: 'Emma Wilson', email: 'emma@stu.pu.edu', seed: 'EW', color: 'c0392b' },
    ];

    const students = [];
    for (const s of studentData) {
      const student = await db.user.create({
        data: {
          name: s.name,
          email: s.email,
          password: studentPass,
          role: 'STUDENT',
          avatar: `https://api.dicebear.com/9.x/initials/svg?seed=${s.seed}&backgroundColor=${s.color}`,
        },
      });
      students.push(student);
    }

    // 5. Create subjects
    const subject1 = await db.subject.create({
      data: { name: 'Data Structures & Algorithms', code: 'CS201', teacherId: teacher1.id },
    });
    const subject2 = await db.subject.create({
      data: { name: 'Database Management Systems', code: 'CS301', teacherId: teacher1.id },
    });
    const subject3 = await db.subject.create({
      data: { name: 'Web Development', code: 'CS401', teacherId: teacher2.id },
    });

    // 6. Create assignments
    const now = new Date();
    await db.assignment.createMany({
      data: [
        {
          title: 'Binary Tree Implementation',
          description: 'Implement a binary search tree with insert, delete, search, and traversal operations.',
          subjectId: subject1.id,
          type: 'ASSIGNMENT',
          deadline: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
          createdBy: teacher1.id,
        },
        {
          title: 'Graph Algorithms Lab',
          description: 'Implement BFS and DFS algorithms. Analyze time complexity.',
          subjectId: subject1.id,
          type: 'LAB_REPORT',
          deadline: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000),
          createdBy: teacher1.id,
        },
        {
          title: 'Normalization Exercise',
          description: 'Normalize an unnormalized table to 3NF. Document each step.',
          subjectId: subject2.id,
          type: 'ASSIGNMENT',
          deadline: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000),
          createdBy: teacher1.id,
        },
        {
          title: 'React Dashboard Project',
          description: 'Build a responsive dashboard using React with Tailwind CSS.',
          subjectId: subject3.id,
          type: 'ASSIGNMENT',
          deadline: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000),
          createdBy: teacher2.id,
        },
      ],
    });

    // 7. Create announcements
    await db.announcement.create({
      data: {
        title: 'Welcome to PU-ALRMS!',
        message: 'Your academic management system is ready. Explore assignments, quizzes, and more.',
        type: 'GENERAL',
        priority: 'HIGH',
        createdBy: admin.id,
      },
    });

    const elapsed = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      message: 'Database initialized successfully!',
      time: `${elapsed}ms`,
      accounts: {
        superAdmin: { email: 'admin@pu.edu', password: 'admin123' },
        teacher: { email: 'dr.smith@pu.edu', password: 'teacher123' },
        student: { email: 'alice@stu.pu.edu', password: 'student123' },
      },
      stats: {
        users: 1 + 2 + students.length,
        subjects: 3,
        assignments: 4,
      },
    });
  } catch (error: any) {
    console.error('Setup error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Setup failed',
        hint: 'Make sure DATABASE_URL is set in Vercel environment variables',
      },
      { status: 500 },
    );
  }
}
