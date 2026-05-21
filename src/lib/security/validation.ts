import { z } from 'zod';

/**
 * Shared Zod validation schemas for API input validation
 * Prevents malformed data from reaching the database
 */

export const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().email('Invalid email format'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Must contain at least one special character'),
  role: z.enum(['STUDENT', 'TEACHER', 'ADMIN', 'CR']).default('STUDENT'),
  batch: z.string().optional(),
  department: z.string().optional(),
  rollNumber: z.string().optional(),
});

export const profileUpdateSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  phone: z.string().optional(),
  bio: z.string().max(500).optional(),
  avatar: z.string().url().optional().or(z.literal('')),
  coverPhoto: z.string().url().optional().or(z.literal('')),
  batch: z.string().optional(),
  department: z.string().optional(),
});

export const assignmentSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(200),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  subjectId: z.string().min(1, 'Subject is required'),
  type: z.enum(['ASSIGNMENT', 'LAB_REPORT']),
  batch: z.string().optional(),
  deadline: z.string().min(1, 'Deadline is required'),
  fileUrl: z.string().url().optional().or(z.literal('')),
});

export const subjectSchema = z.object({
  name: z.string().min(2, 'Subject name must be at least 2 characters').max(100),
  code: z.string().min(1, 'Subject code is required').max(20),
  batch: z.string().optional(),
});

export const quizCategorySchema = z.object({
  name: z.string().min(2, 'Category name required').max(100),
  department: z.string().min(1, 'Department required'),
  icon: z.string().max(10).optional(),
  description: z.string().max(500).optional(),
  difficulty: z.enum(['EASY', 'MEDIUM', 'HARD']).default('MEDIUM'),
});

export const quizQuestionSchema = z.object({
  categoryId: z.string().min(1),
  question: z.string().min(5, 'Question must be at least 5 characters').max(1000),
  optionA: z.string().min(1, 'Option A is required').max(500),
  optionB: z.string().min(1, 'Option B is required').max(500),
  optionC: z.string().min(1, 'Option C is required').max(500),
  optionD: z.string().min(1, 'Option D is required').max(500),
  correctOption: z.enum(['A', 'B', 'C', 'D']),
  explanation: z.string().max(1000).optional(),
  difficulty: z.enum(['EASY', 'MEDIUM', 'HARD']).default('MEDIUM'),
  points: z.number().int().min(5).max(50).default(10),
});

export const chatMessageSchema = z.object({
  content: z.string().max(2000, 'Message too long'),
  messageType: z.enum(['TEXT', 'IMAGE', 'FILE']).default('TEXT'),
  roomId: z.string().min(1),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;
export type AssignmentInput = z.infer<typeof assignmentSchema>;
export type SubjectInput = z.infer<typeof subjectSchema>;
export type QuizCategoryInput = z.infer<typeof quizCategorySchema>;
export type QuizQuestionInput = z.infer<typeof quizQuestionSchema>;
