import { hash } from 'bcryptjs';
import { db } from '../src/lib/db';

async function main() {
  const adminPass = await hash('admin123', 12);
  const teacherPass = await hash('teacher123', 12);
  const studentPass = await hash('student123', 12);

  const admin = await db.user.upsert({
    where: { email: 'admin@pu.edu' },
    update: {},
    create: {
      name: 'System Admin',
      email: 'admin@pu.edu',
      password: adminPass,
      role: 'ADMIN',
      avatar: 'https://api.dicebear.com/9.x/initials/svg?seed=SA&backgroundColor=c0392b',
    },
  });

  const teacher1 = await db.user.upsert({
    where: { email: 'dr.smith@pu.edu' },
    update: {},
    create: {
      name: 'Dr. Sarah Smith',
      email: 'dr.smith@pu.edu',
      password: teacherPass,
      role: 'TEACHER',
      avatar: 'https://api.dicebear.com/9.x/initials/svg?seed=SS&backgroundColor=27ae60',
    },
  });

  const teacher2 = await db.user.upsert({
    where: { email: 'prof.johnson@pu.edu' },
    update: {},
    create: {
      name: 'Prof. Mark Johnson',
      email: 'prof.johnson@pu.edu',
      password: teacherPass,
      role: 'TEACHER',
      avatar: 'https://api.dicebear.com/9.x/initials/svg?seed=MJ&backgroundColor=2980b9',
    },
  });

  // CR user
  const crPass = await hash('cr123', 12);
  const cr = await db.user.upsert({
    where: { email: 'cr@stu.pu.edu' },
    update: {},
    create: {
      name: 'Rafiq Ahmed',
      email: 'cr@stu.pu.edu',
      password: crPass,
      role: 'CR',
      batch: 'CSE-2024',
      avatar: 'https://api.dicebear.com/9.x/initials/svg?seed=RA&backgroundColor=e74c3c',
    },
  });

  // Super Admin (separate from the regular admin)
  const superAdminPass = await hash('super123', 12);
  const superAdmin = await db.user.upsert({
    where: { email: 'super@pu.edu' },
    update: {},
    create: {
      name: 'Super Admin',
      email: 'super@pu.edu',
      password: superAdminPass,
      role: 'SUPER_ADMIN',
      avatar: 'https://api.dicebear.com/9.x/initials/svg?seed=SUP&backgroundColor=e74c3c',
    },
  });

  const students = [];
  const studentData = [
    { name: 'Alice Chen', email: 'alice@stu.pu.edu', seed: 'AC', color: '8e44ad' },
    { name: 'Bob Martinez', email: 'bob@stu.pu.edu', seed: 'BM', color: 'd35400' },
    { name: 'Carol Williams', email: 'carol@stu.pu.edu', seed: 'CW', color: '16a085' },
    { name: 'David Kim', email: 'david@stu.pu.edu', seed: 'DK', color: '2c3e50' },
    { name: 'Emma Wilson', email: 'emma@stu.pu.edu', seed: 'EW', color: 'c0392b' },
    { name: 'Frank Lee', email: 'frank@stu.pu.edu', seed: 'FL', color: '7f8c8d' },
    { name: 'Grace Taylor', email: 'grace@stu.pu.edu', seed: 'GT', color: 'f39c12' },
    { name: 'Henry Brown', email: 'henry@stu.pu.edu', seed: 'HB', color: '1abc9c' },
  ];

  for (const s of studentData) {
    const student = await db.user.upsert({
      where: { email: s.email },
      update: { batch: 'CSE-2024' },
      create: {
        name: s.name,
        email: s.email,
        password: studentPass,
        role: 'STUDENT',
        batch: 'CSE-2024',
        avatar: `https://api.dicebear.com/9.x/initials/svg?seed=${s.seed}&backgroundColor=${s.color}`,
      },
    });
    students.push(student);
  }

  // Subjects
  const subject1 = await db.subject.create({
    data: {
      name: 'Data Structures & Algorithms',
      code: 'CS201',
      teacherId: teacher1.id,
    },
  });

  const subject2 = await db.subject.create({
    data: {
      name: 'Database Management Systems',
      code: 'CS301',
      teacherId: teacher1.id,
    },
  });

  const subject3 = await db.subject.create({
    data: {
      name: 'Web Development',
      code: 'CS401',
      teacherId: teacher2.id,
    },
  });

  const subject4 = await db.subject.create({
    data: {
      name: 'Operating Systems',
      code: 'CS302',
      teacherId: teacher2.id,
    },
  });

  // Assignments
  const now = new Date();
  const assignments = [
    {
      title: 'Binary Tree Implementation',
      description: 'Implement a binary search tree with insert, delete, search, and traversal operations. Include proper error handling and write unit tests for each operation.',
      subjectId: subject1.id,
      type: 'ASSIGNMENT',
      deadline: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      createdBy: teacher1.id,
    },
    {
      title: 'Graph Algorithms Lab',
      description: 'Implement BFS and DFS algorithms. Analyze time complexity for different graph representations (adjacency matrix vs adjacency list).',
      subjectId: subject1.id,
      type: 'LAB_REPORT',
      deadline: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000),
      createdBy: teacher1.id,
    },
    {
      title: 'Normalization Exercise',
      description: 'Given an unnormalized table, normalize it to 3NF. Document each step of the normalization process and explain the functional dependencies.',
      subjectId: subject2.id,
      type: 'ASSIGNMENT',
      deadline: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000),
      createdBy: teacher1.id,
    },
    {
      title: 'SQL Query Optimization Lab',
      description: 'Write optimized SQL queries for given scenarios. Explain the query execution plan and suggest improvements using indexes.',
      subjectId: subject2.id,
      type: 'LAB_REPORT',
      deadline: new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000),
      createdBy: teacher1.id,
    },
    {
      title: 'React Dashboard Project',
      description: 'Build a responsive dashboard using React with Tailwind CSS. Include data visualization charts, filtering, and a responsive sidebar navigation.',
      subjectId: subject3.id,
      type: 'ASSIGNMENT',
      deadline: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000),
      createdBy: teacher2.id,
    },
    {
      title: 'REST API Development Lab',
      description: 'Develop a REST API using Next.js API routes. Include authentication, CRUD operations, proper error handling, and API documentation.',
      subjectId: subject3.id,
      type: 'LAB_REPORT',
      deadline: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000),
      createdBy: teacher2.id,
    },
    {
      title: 'Process Scheduling Simulation',
      description: 'Simulate FCFS, SJF, Round Robin, and Priority scheduling algorithms. Compare their performance with different workloads.',
      subjectId: subject4.id,
      type: 'ASSIGNMENT',
      deadline: new Date(now.getTime() + 12 * 24 * 60 * 60 * 1000),
      createdBy: teacher2.id,
    },
    {
      title: 'Memory Management Lab',
      description: 'Implement paging and segmentation algorithms. Simulate page replacement strategies (FIFO, LRU, Optimal).',
      subjectId: subject4.id,
      type: 'LAB_REPORT',
      deadline: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000), // Past deadline
      createdBy: teacher2.id,
    },
  ];

  const createdAssignments = [];
  for (const a of assignments) {
    const assignment = await db.assignment.create({ data: a });
    createdAssignments.push(assignment);
  }

  // Submissions (for some assignments and students)
  const submissionData = [
    { assignmentIdx: 0, studentIdx: 0, status: 'GRADED', marks: 92, feedback: 'Excellent implementation! Clean code and good test coverage.' },
    { assignmentIdx: 0, studentIdx: 1, status: 'GRADED', marks: 78, feedback: 'Good work. Could improve error handling in delete operation.' },
    { assignmentIdx: 0, studentIdx: 2, status: 'SUBMITTED' },
    { assignmentIdx: 1, studentIdx: 0, status: 'GRADED', marks: 88, feedback: 'Great analysis of time complexity.' },
    { assignmentIdx: 1, studentIdx: 3, status: 'SUBMITTED' },
    { assignmentIdx: 1, studentIdx: 4, status: 'SUBMITTED' },
    { assignmentIdx: 2, studentIdx: 0, status: 'GRADED', marks: 95, feedback: 'Perfect normalization steps!' },
    { assignmentIdx: 2, studentIdx: 1, status: 'GRADED', marks: 82, feedback: 'Good work, minor issues in 2NF step.' },
    { assignmentIdx: 2, studentIdx: 2, status: 'SUBMITTED' },
    { assignmentIdx: 2, studentIdx: 3, status: 'SUBMITTED' },
    { assignmentIdx: 2, studentIdx: 4, status: 'LATE', marks: 70, feedback: 'Late submission. Content was good.' },
    { assignmentIdx: 4, studentIdx: 0, status: 'SUBMITTED' },
    { assignmentIdx: 4, studentIdx: 5, status: 'SUBMITTED' },
    { assignmentIdx: 5, studentIdx: 6, status: 'SUBMITTED' },
    { assignmentIdx: 5, studentIdx: 7, status: 'SUBMITTED' },
    { assignmentIdx: 7, studentIdx: 0, status: 'GRADED', marks: 85, feedback: 'Good simulation results.' },
    { assignmentIdx: 7, studentIdx: 1, status: 'GRADED', marks: 90, feedback: 'Excellent work on page replacement!' },
    { assignmentIdx: 7, studentIdx: 2, status: 'LATE', marks: 65, feedback: 'Incomplete implementation.' },
  ];

  for (const sd of submissionData) {
    await db.submission.create({
      data: {
        assignmentId: createdAssignments[sd.assignmentIdx].id,
        studentId: students[sd.studentIdx].id,
        fileName: `${createdAssignments[sd.assignmentIdx].title.replace(/\s+/g, '_')}_${students[sd.studentIdx].name.split(' ')[0].toLowerCase()}.pdf`,
        status: sd.status,
        marks: sd.marks,
        feedback: sd.feedback,
        gradedAt: sd.status === 'GRADED' ? new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000) : null,
      },
    });
  }

  // Comments
  const commentsData = [
    { assignmentIdx: 0, userId: teacher1.id, content: 'Remember to include time complexity analysis in your submissions.' },
    { assignmentIdx: 0, userId: students[0].id, content: 'Should we also include space complexity?' },
    { assignmentIdx: 0, userId: teacher1.id, content: 'Yes, Alice. Space complexity analysis would be a great addition.' },
    { assignmentIdx: 2, userId: teacher1.id, content: 'Make sure to show all functional dependencies clearly.' },
    { assignmentIdx: 4, userId: teacher2.id, content: 'Feel free to use any charting library you prefer.' },
    { assignmentIdx: 4, userId: students[0].id, content: 'Can we use Chart.js or should we stick to Recharts?' },
    { assignmentIdx: 4, userId: teacher2.id, content: 'Either is fine. Recharts works well with React.' },
  ];

  for (const cd of commentsData) {
    await db.comment.create({
      data: {
        assignmentId: createdAssignments[cd.assignmentIdx].id,
        userId: cd.userId,
        content: cd.content,
      },
    });
  }

  // Notifications
  const notificationsData = [
    { userId: students[0].id, title: 'New Assignment', message: 'Binary Tree Implementation has been posted for CS201', type: 'ASSIGNMENT' },
    { userId: students[1].id, title: 'New Assignment', message: 'Binary Tree Implementation has been posted for CS201', type: 'ASSIGNMENT' },
    { userId: students[2].id, title: 'Deadline Approaching', message: 'Normalization Exercise is due in 3 days', type: 'DEADLINE' },
    { userId: students[3].id, title: 'Feedback Available', message: 'Your submission for Graph Algorithms Lab has been graded', type: 'FEEDBACK' },
    { userId: students[0].id, title: 'Feedback Available', message: 'Your submission for Binary Tree Implementation scored 92/100', type: 'FEEDBACK' },
    { userId: students[4].id, title: 'Deadline Passed', message: 'Memory Management Lab deadline has passed', type: 'DEADLINE' },
    { userId: teacher1.id, title: 'New Submission', message: 'Carol Williams submitted Binary Tree Implementation', type: 'INFO' },
    { userId: teacher2.id, title: 'New Submission', message: 'Grace Taylor submitted REST API Development Lab', type: 'INFO' },
  ];

  for (const nd of notificationsData) {
    await db.notification.create({
      data: nd,
    });
  }

  // Sample submission tasks for CR
  const now2 = new Date();
  const taskData = [
    {
      subjectName: 'Data Structures & Algorithms',
      subjectCode: 'CS201',
      batch: 'CSE-2024',
      type: 'ASSIGNMENT',
      description: 'Implement AVL Tree with all rotations. Submit code with proper comments.',
      dueDate: new Date(now2.getTime() + 5 * 24 * 60 * 60 * 1000),
      status: 'ACTIVE',
      createdBy: cr.id,
    },
    {
      subjectName: 'Database Management Systems',
      subjectCode: 'CS301',
      batch: 'CSE-2024',
      type: 'LAB_REPORT',
      description: 'Complete ER Diagram and Relational Schema for Library Management System.',
      dueDate: new Date(now2.getTime() + 3 * 24 * 60 * 60 * 1000),
      status: 'ACTIVE',
      createdBy: cr.id,
    },
    {
      subjectName: 'Operating Systems',
      subjectCode: 'CS302',
      batch: 'CSE-2024',
      type: 'PRESENTATION',
      description: 'Group presentation on Process Scheduling Algorithms (10 min per group).',
      dueDate: new Date(now2.getTime() + 10 * 24 * 60 * 60 * 1000),
      status: 'ACTIVE',
      createdBy: cr.id,
    },
  ];

  const createdTasks = [];
  for (const t of taskData) {
    const task = await db.submissionTask.create({ data: t });
    createdTasks.push(task);

    // Create batch notifications
    await db.batchNotification.create({
      data: {
        taskId: task.id,
        batch: t.batch,
        title: `New ${t.type.replace('_', ' ')}: ${t.subjectName}`,
        message: `A new ${t.type.replace('_', ' ').toLowerCase()} for ${t.subjectName} (${t.subjectCode}). Due: ${t.dueDate.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}.`,
        type: 'SUBMISSION',
        sentBy: cr.id,
      },
    });
  }

  // Sample student responses
  await db.taskResponse.create({
    data: {
      taskId: createdTasks[0].id,
      studentId: students[0].id,
      status: 'SUBMITTED',
      fileName: 'avl_tree_implementation.pdf',
      fileUrl: '/uploads/avl_tree_alice.pdf',
      submittedAt: new Date(now2.getTime() - 1 * 24 * 60 * 60 * 1000),
    },
  });
  await db.taskResponse.create({
    data: {
      taskId: createdTasks[0].id,
      studentId: students[1].id,
      status: 'SUBMITTED',
      fileName: 'avl_tree_bob.pdf',
      fileUrl: '/uploads/avl_tree_bob.pdf',
      submittedAt: new Date(now2.getTime() - 12 * 60 * 60 * 1000),
    },
  });

  console.log('Seed completed successfully!');
  console.log('--- Accounts ---');
  console.log('Admin: admin@pu.edu / admin123');
  console.log('Super Admin: super@pu.edu / super123');
  console.log('Teacher: dr.smith@pu.edu / teacher123');
  console.log('Teacher: prof.johnson@pu.edu / teacher123');
  console.log('CR: cr@stu.pu.edu / cr123');
  console.log('Student: alice@stu.pu.edu / student123');
  console.log('Student: bob@stu.pu.edu / student123');
  console.log('Student: carol@stu.pu.edu / student123');
}

main()
  .then(async () => {
    await db.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await db.$disconnect();
    process.exit(1);
  });
