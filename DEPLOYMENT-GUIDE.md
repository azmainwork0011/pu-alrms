# PU-ALRMS — Complete Firebase Deployment Guide

> এই document-টি অন্য AI assistant-কে দেওয়ার জন্য তৈরি। এতে পুরো project structure, code, এবং deployment instructions আছে।

---

## 1. PROJECT SUMMARY

**PU-ALRMS = Prime University Assignment & Lab Report Management System**

এটি একটি university-level academic management web application যেটাতে:

### App-এর Main Purpose:
- **Teachers/Professors** assignment, lab report, notice তৈরি করতে পারবেন
- **Students** assignment submit করতে পারবে, notice দেখতে পারবে, quiz দিতে পারবে
- **Admin** সবার account manage করতে পারবেন
- Dashboard, Leaderboard, AI Chat, Digital Library, Quiz Battle — সব আছে

### Framework & Tech Stack:
| Property | Value |
|----------|-------|
| **Framework** | **Next.js 16.1.1** (App Router, React 19) |
| **Language** | TypeScript 5 |
| **Styling** | Tailwind CSS 4 + shadcn/ui (Radix UI) + Lucide icons |
| **State** | Zustand (client) + TanStack Query (server) |
| **Database** | SQLite via Prisma ORM (18 models) |
| **Auth** | Custom JWT + Firebase Google Auth (optional) |
| **Runtime** | Bun (also npm compatible) |
| **Output** | `standalone` (Node.js server, NOT static) |

### ⚠️ CRITICAL: এটি Full-Stack App
এটি শুধু static HTML নয়। এর:
- **44টা server-side API route** আছে (`/api/*`)
- **Local SQLite database** আছে
- **Socket.IO mini-services** আছে (2টা, ports 3001/3002)
- Firebase Hosting আলাদা static files সার্ভ করতে পারবে, কিন্তু API routes চালাতে হলে **Firebase Cloud Functions** বা **Firebase App Hosting** লাগবে

---

## 2. USER ROLES & PERMISSIONS

### Role System (6 roles):
```typescript
export type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'DEVELOPER' | 'TEACHER' | 'STUDENT' | 'CR';
```

### প্রতিটা Role কী কী করতে পারে:

| Feature | Student | CR | Teacher | Admin | Super Admin |
|---------|:-------:|:--:|:-------:|:-----:|:-----------:|
| Dashboard দেখা | ✅ | ✅ | ✅ | ✅ | ✅ |
| Assignment দেখা | ✅ | ✅ | ✅ | ✅ | ✅ |
| Assignment Submit | ✅ | ✅ | ❌ | ✅ | ✅ |
| Assignment Create | ❌ | ✅ | ✅ | ✅ | ✅ |
| Submission Grade | ❌ | ❌ | ✅ | ✅ | ✅ |
| Lab Report দেখা | ✅ | ✅ | ✅ | ✅ | ✅ |
| Quiz দেওয়া | ✅ | ✅ | ✅ | ✅ | ✅ |
| Leaderboard | ✅ | ✅ | ❌ | ✅ | ✅ |
| Announcements | ✅ | ✅ | ✅ | ✅ | ✅ |
| Community Chat | ✅ | ✅ | ✅ | ✅ | ✅ |
| AI Chat | ✅ | ✅ | ✅ | ✅ | ✅ |
| Digital Library | ✅ | ✅ | ✅ | ✅ | ✅ |
| Profile Edit | ✅ | ✅ | ✅ | ✅ | ✅ |
| Notifications | ✅ | ✅ | ✅ | ✅ | ✅ |
| Admin Panel | ❌ | ❌ | ❌ | ❌ | ✅ |
| User Management | ❌ | ❌ | ❌ | ❌ | ✅ |
| Course/Subject Create | ❌ | ❌ | ✅ | ✅ | ✅ |

### Login Methods:
1. **Email + Password** — POST `/api/auth/login`
2. **Firebase Google Sign-In** — Google popup → token exchange → JWT
3. **Google Manual** — POST `/api/auth/google` (fallback dialog)
4. **Temp Email** — POST `/api/auth/temp-email` (demo/guest access)

### Demo Mode:
- Demo users: read-only access (সব POST/PUT/DELETE blocked frontend + backend)
- Community Chat এবং AI Chat hidden for demo users
- Admin Panel restricted

---

## 3. FULL FOLDER/FILE STRUCTURE

```
pu-alrms/
├── package.json
├── next.config.ts
├── tsconfig.json
├── tailwind.config.ts
├── postcss.config.mjs
├── components.json
├── eslint.config.mjs
├── .gitignore
├── setup-firebase.sh              # Kali Linux Firebase setup
├── setup-firebase.ps1             # Windows Firebase setup
│
├── prisma/
│   ├── schema.prisma              # 18 DB models
│   ├── seed.ts                    # Demo data seeder
│   └── db/custom.db               # SQLite file
│
├── public/
│   ├── logo.png, logo.svg
│   ├── hero-campus.png
│   ├── robots.txt
│   ├── sounds/fahhh.mp3
│   └── uploads/profiles/          # User uploaded photos
│
├── src/
│   ├── app/
│   │   ├── layout.tsx             # Root layout
│   │   ├── page.tsx               # SPA entry (single route)
│   │   ├── globals.css            # Global styles
│   │   └── api/                   # 44 API route files
│   │       ├── route.ts           # Health check
│   │       ├── auth/
│   │       │   ├── login/route.ts
│   │       │   ├── register/route.ts
│   │       │   ├── firebase/route.ts
│   │       │   ├── google/route.ts
│   │       │   ├── temp-email/route.ts
│   │       │   ├── seed/route.ts
│   │       │   ├── profile/route.ts
│   │       │   └── profile/photo/route.ts
│   │       ├── assignments/       # CRUD + [id]
│   │       ├── submissions/       # CRUD + [id]/grade
│   │       ├── announcements/     # CRUD + [id]
│   │       ├── notifications/     # List + [id]/read
│   │       ├── comments/
│   │       ├── subjects/
│   │       ├── batches/
│   │       ├── leaderboard/
│   │       ├── dashboard/
│   │       ├── admin/stats, users, logs
│   │       ├── ai/chat, generate-image, scan, token
│   │       ├── quiz/categories, questions, profile, seed, battle, leaderboard
│   │       ├── cq/profile, friends, battle, leaderboard
│   │       ├── chat/rooms, rooms/join, messages
│   │       └── books/search, saved
│   │
│   ├── components/
│   │   ├── ui/                    # 60+ shadcn/ui components
│   │   ├── pages/                 # 18 page components
│   │   │   ├── AuthPage.tsx       # Login/register
│   │   │   ├── DashboardPage.tsx
│   │   │   ├── AssignmentsPage.tsx
│   │   │   ├── AssignmentDetailPage.tsx
│   │   │   ├── CreateAssignmentPage.tsx
│   │   │   ├── SubmissionsPage.tsx
│   │   │   ├── QuizPage.tsx
│   │   │   ├── LeaderboardPage.tsx
│   │   │   ├── AIChatPage.tsx
│   │   │   ├── StudentCommunityPage.tsx
│   │   │   ├── AnnouncementsPage.tsx
│   │   │   ├── NotificationsPage.tsx
│   │   │   ├── ProfilePage.tsx
│   │   │   ├── BooksPage.tsx
│   │   │   ├── CodeQuestArena.tsx
│   │   │   ├── LearnWithGame.tsx
│   │   │   ├── BattlePage.tsx
│   │   │   └── AdminPanelPage.tsx
│   │   ├── layout/
│   │   │   ├── AppLayout.tsx      # Sidebar + header + page router
│   │   │   └── LoadingOverlay.tsx
│   │   ├── theme-provider.tsx
│   │   └── pu-helpers.tsx
│   │
│   ├── store/
│   │   └── app.ts                 # Zustand: auth, nav, UI state
│   │
│   ├── providers/
│   │   ├── firebase-provider.tsx  # Firebase Auth context
│   │   └── api-provider.tsx       # TanStack Query
│   │
│   └── lib/
│       ├── api.ts                 # API client (fetch + retry)
│       ├── db.ts                  # Prisma client
│       ├── firebase.ts            # Firebase SDK init
│       ├── jwt.ts                 # JWT sign/verify
│       ├── utils.ts               # cn() helper
│       ├── demo-guard.ts          # Demo mode guard
│       ├── query-client.ts
│       ├── zai.ts                 # AI SDK
│       ├── chat-encryption.ts
│       ├── security/              # validation, sanitize, rate-limit, audit
│       └── hooks/use-queries.ts
│
└── mini-services/
    ├── chat-service/              # Socket.IO (port 3001)
    └── battle-service/            # Quiz battle (port 3002)
```

---

## 4. IMPORTANT FILE CODES

### 4.1 `package.json`
```json
{
  "name": "nextjs_tailwind_shadcn_ts",
  "version": "0.2.0",
  "private": true,
  "scripts": {
    "dev": "next dev -p 3000",
    "build": "next build && cp -r .next/static .next/standalone/.next/ && cp -r public .next/standalone/",
    "start": "NODE_ENV=production bun .next/standalone/server.js 2>&1 | tee server.log",
    "lint": "eslint .",
    "db:push": "prisma db push",
    "db:generate": "prisma generate"
  },
  "dependencies": {
    "@prisma/client": "^6.11.1",
    "bcryptjs": "^3.0.3",
    "date-fns": "^4.1.0",
    "firebase": "^12.12.1",
    "firebase-admin": "^13.8.0",
    "framer-motion": "^12.23.2",
    "jsonwebtoken": "^9.0.3",
    "lucide-react": "^0.525.0",
    "next": "^16.1.1",
    "next-themes": "^0.4.6",
    "prisma": "^6.11.1",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "recharts": "^2.15.4",
    "sharp": "^0.34.3",
    "socket.io-client": "^4.8.3",
    "sonner": "^2.0.6",
    "z-ai-web-dev-sdk": "^0.0.17",
    "zod": "^4.0.2",
    "zustand": "^5.0.6",
    "@tanstack/react-query": "^5.82.0",
    "@tanstack/react-table": "^8.21.3",
    "react-hook-form": "^7.60.0",
    "next-auth": "^4.24.11"
  },
  "devDependencies": {
    "@tailwindcss/postcss": "^4",
    "@types/bcryptjs": "^3.0.0",
    "@types/jsonwebtoken": "^9.0.10",
    "@types/react": "^19",
    "@types/react-dom": "^19",
    "eslint": "^9",
    "eslint-config-next": "^16.1.1",
    "tailwindcss": "^4",
    "typescript": "^5"
  }
}
```

### 4.2 `next.config.ts`
```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  typescript: { ignoreBuildErrors: true },
  reactStrictMode: false,
  allowedDevOrigins: ['*.space.z.ai', '*.z.ai'],
  async headers() {
    return [{
      source: '/((?!_next/static|_next/image|favicon.ico|logo.png|sounds).*)',
      headers: [
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'X-XSS-Protection', value: '1; mode=block' },
        { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
      ],
    }];
  },
};
export default nextConfig;
```

### 4.3 `prisma/schema.prisma`
```prisma
generator client { provider = "prisma-client-js" }

datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

model User {
  id          String   @id @default(cuid())
  name        String
  email       String   @unique
  password    String
  role        String   @default("STUDENT")   // SUPER_ADMIN|ADMIN|DEVELOPER|TEACHER|STUDENT|CR
  verified    Boolean  @default(false)
  status      String   @default("ACTIVE")     // ACTIVE|SUSPENDED|BANNED
  avatar      String?
  coverPhoto  String?
  rollNumber  String?
  batch       String?
  department  String?
  phone       String?
  bio         String?
  lastLogin   DateTime?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  // 15+ relations...
}

model Subject {
  id        String   @id @default(cuid())
  name      String
  code      String
  teacherId String
  batch     String?
  teacher   User        @relation(fields: [teacherId], references: [id])
  assignments Assignment[]
}

model Assignment {
  id          String   @id @default(cuid())
  title       String
  description String
  subjectId   String
  type        String   @default("ASSIGNMENT")  // ASSIGNMENT|LAB_REPORT
  batch       String?
  deadline    DateTime
  status      String   @default("ACTIVE")
  createdBy   String
  subject     Subject     @relation(fields: [subjectId], references: [id])
  creator     User        @relation(fields: [createdBy], references: [id])
  submissions Submission[]
  comments    Comment[]
}

model Submission {
  id           String    @id @default(cuid())
  assignmentId String
  studentId    String
  fileName     String
  fileUrl      String?
  status       String    @default("SUBMITTED")  // SUBMITTED|GRADED|LATE
  marks        Float?
  feedback     String?
  submittedAt  DateTime  @default(now())
  gradedAt     DateTime?
}

model Comment { id, assignmentId, userId, content, createdAt }
model Notification { id, userId, title, message, type, isRead, createdAt }
model Announcement { id, title, message, type, priority, createdBy, createdAt }
model ChatRoom { id, name, type, batch, department, isPrivate, encryptionKey, messages }
model ChatMessage { id, roomId, userId, content, messageType, fileUrl, createdAt }
model QuizCategory { id, name, department, icon, difficulty, questions, attempts }
model QuizQuestion { id, categoryId, question, optionA-D, correctOption, points }
model QuizAttempt { id, userId, categoryId, score, totalPoints, correctCount, accuracy, timeTaken }
model QuizProfile { id, userId, totalXP, dailyStreak, totalQuizzes, totalCorrect }
model SavedBook { id, userId, bookId, title, authors, coverUrl, category, language }
model BattleRoom { id, player1Id, player2Id, categoryId, status, scores, winnerId }
model CQProfile { id, userId, level, totalXP, battlesWon, battlesLost, title }
model CQFriend { id, userId, friendId, status }
model CQBattleSession { id, player1Id, player2Id, language, status, rounds, scores }
```

### 4.4 `src/app/page.tsx` (Entry Point)
```typescript
'use client';
import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { useAppStore } from '@/store/app';

const AuthPage = dynamic(() => import('@/components/pages/AuthPage'), { ssr: false });
const AppLayout = dynamic(() => import('@/components/layout/AppLayout'), { ssr: false });

export default function Home() {
  const mounted = useAppStore((s) => s.mounted);
  const isAuthenticated = useAppStore((s) => s.isAuthenticated);

  useEffect(() => {
    document.documentElement.classList.add('hydrated');
    useAppStore.getState().hydrate();
  }, []);

  if (!mounted) return null;
  return isAuthenticated ? <AppLayout /> : <AuthPage />;
}
```

### 4.5 `src/app/layout.tsx` (Root Layout)
```typescript
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/theme-provider";
import { ApiProvider } from "@/providers/api-provider";
import { FirebaseProvider } from "@/providers/firebase-provider";

export const metadata: Metadata = {
  title: "PU-ALRMS | Prime University",
  description: "Prime University Assignment & Lab Report Management System",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
          <FirebaseProvider>
            <ApiProvider>
              {children}
              <Toaster />
            </ApiProvider>
          </FirebaseProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
```

### 4.6 `src/store/app.ts` (Auth & Navigation)
```typescript
import { create } from 'zustand';

export type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'DEVELOPER' | 'TEACHER' | 'STUDENT' | 'CR';

export type PageView =
  | 'admin-panel' | 'dashboard' | 'assignments' | 'lab-reports'
  | 'assignment-detail' | 'create-assignment' | 'submissions'
  | 'ai-chat' | 'leaderboard' | 'notifications' | 'profile'
  | 'student-community' | 'announcements' | 'quiz'
  | 'code-quest' | 'books';

export const useAppStore = create((set) => ({
  user: null, token: null, isAuthenticated: false, mounted: false,
  isDemoUser: false, currentPage: 'dashboard', sidebarOpen: false,

  setAuth: (user, token, isDemo = false) => {
    set({ user, token, isAuthenticated: true, isDemoUser: isDemo });
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    set({ user: null, token: null, isAuthenticated: false });
  },

  hydrate: () => {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    if (token && user) {
      set({ user: JSON.parse(user), token, isAuthenticated: true, mounted: true });
    } else {
      set({ mounted: true });
    }
  },

  setPage: (page) => set({ currentPage: page, sidebarOpen: false }),
}));
```

### 4.7 `src/lib/jwt.ts` (Authentication)
```typescript
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || (process.env.NODE_ENV === 'production' ? '' : 'pu-alrms-dev-key-2024-local');

export function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token) {
  try { return jwt.verify(token, JWT_SECRET); }
  catch { return null; }
}
```

### 4.8 `src/lib/db.ts` (Database)
```typescript
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined }

export const db: PrismaClient = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
})

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = db
}
```

### 4.9 `src/lib/firebase.ts` (Firebase Init)
```typescript
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut as firebaseSignOut,
  onAuthStateChanged, type User as FirebaseUser } from 'firebase/auth';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || '',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '',
};

function isFirebaseConfigured() {
  return !!(firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.appId);
}

export const firebase = {
  isConfigured: isFirebaseConfigured,
  signInWithGoogle: async () => {
    const result = await signInWithPopup(getAuth(getApps().length ? getApp() : initializeApp(firebaseConfig)),
      Object.assign(new GoogleAuthProvider(), { customParameters: { prompt: 'select_account' } }));
    return result.user;
  },
  signOut: async () => await firebaseSignOut(getAuth(getApp())),
  getIdToken: (user, forceRefresh) => user.getIdToken(forceRefresh),
  onAuthStateChanged: (cb) => onAuthStateChanged(getAuth(getApp()), cb),
};
```

### 4.10 `src/lib/demo-guard.ts` (Backend Security)
```typescript
import { NextResponse } from 'next/server';

const ALLOWED_ENDPOINTS = ['/api/auth/login','/api/auth/register','/api/auth/seed','/api/auth/temp-email','/api/auth/google'];
const WRITE_METHODS = ['POST', 'PUT', 'DELETE', 'PATCH'];

export function demoGuard(request: Request): NextResponse | null {
  if (!WRITE_METHODS.includes(request.method)) return null;
  const path = new URL(request.url).pathname;
  if (ALLOWED_ENDPOINTS.some(ep => path.startsWith(ep))) return null;
  if (request.headers.get('X-Demo-Mode') === 'true') {
    return NextResponse.json({ error: 'Write operations disabled in demo mode.', code: 'DEMO_MODE_BLOCKED' }, { status: 403 });
  }
  return null;
}
```

### 4.11 `.env.example`
```bash
# Database
DATABASE_URL="file:./db/custom.db"

# JWT Auth
JWT_SECRET="your-random-40-char-secret"

# Firebase Client (PUBLIC — safe to expose)
NEXT_PUBLIC_FIREBASE_API_KEY="your-api-key"
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="your-project.firebaseapp.com"
NEXT_PUBLIC_FIREBASE_PROJECT_ID="your-project-id"
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="your-project.appspot.com"
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="123456789"
NEXT_PUBLIC_FIREBASE_APP_ID="1:123456789:web:abcdef"

# Firebase Admin SDK (SERVER ONLY — KEEP SECRET!)
FIREBASE_PROJECT_ID="your-project-id"
FIREBASE_CLIENT_EMAIL="your-service-account@iam.gserviceaccount.com"
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_KEY_HERE\n-----END PRIVATE KEY-----"
```

### 4.12 `firebase.json` (তৈরি করতে হবে)
```json
{
  "hosting": {
    "public": "out",
    "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
    "rewrites": [
      { "source": "/api/**", "function": "api" },
      { "source": "**", "destination": "/index.html" }
    ]
  }
}
```

### 4.13 `.firebaserc` (তৈরি করতে হবে)
```json
{
  "projects": {
    "default": "pu-alrms"
  }
}
```

---

## 5. BUILD & OUTPUT

### Build Command:
```bash
npm install                    # Install dependencies
npx prisma generate           # Generate Prisma client
npm run build                 # Build production app
```

Build script: `next build && cp -r .next/static .next/standalone/.next/ && cp -r public .next/standalone/`

### Output Folder: `.next/standalone/`
এটা static `dist/` বা `out/` নয় — এটা একটা **Node.js server**:
```
.next/standalone/
├── server.js           # ← Run this: node server.js or bun server.js
├── .next/              # Compiled Next.js code
├── node_modules/       # Required dependencies
└── public/             # Static files
```

### Start Commands:
```bash
# Production
node .next/standalone/server.js
# or: bun .next/standalone/server.js

# Development
npm run dev   # next dev -p 3000
```

---

## 6. AUTHENTICATION

### Login Flow:
```
Student/Teacher opens app → AuthPage shown
    │
    ├─→ Email + Password → POST /api/auth/login → JWT token
    │
    ├─→ "Sign in with Google" → Firebase popup → POST /api/auth/firebase → JWT token
    │
    ├─→ Google (manual dialog) → POST /api/auth/google → JWT token
    │
    └─→ "Try as Guest" → POST /api/auth/temp-email → JWT token (demo mode)

JWT token → stored in localStorage → sent as Authorization: Bearer header
Server verifies JWT on every API request → returns 401 if expired
```

### Server-side Auth Verification (every API route):
```typescript
import { verifyToken } from '@/lib/jwt';
import { db } from '@/lib/db';

const token = request.headers.get('authorization')?.replace('Bearer ', '');
const payload = verifyToken(token);
if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
// payload = { userId, email, role, name }
```

---

## 7. DATABASE REQUIREMENTS

### Data stored in SQLite:
| Data Type | Models | Details |
|-----------|--------|---------|
| **Student/Teacher Data** | User | name, email, password, role, avatar, rollNumber, batch, department, phone, bio |
| **Course Data** | Subject | name, code, teacherId, batch |
| **Assignments** | Assignment | title, description, deadline, type, status, batch |
| **Submissions** | Submission | fileName, fileUrl, status, marks, feedback, gradedAt |
| **Notices** | Announcement | title, message, type, priority |
| **Messages** | ChatRoom, ChatMessage | room-based encrypted messaging |
| **Quiz Data** | QuizCategory, QuizQuestion, QuizAttempt, QuizProfile | categories, questions, scores, XP, streaks |
| **Notifications** | Notification | title, message, type, isRead |
| **Comments** | Comment | on assignments |
| **Digital Library** | SavedBook | saved books with metadata |
| **Battle/Leaderboard** | BattleRoom, CQProfile, CQBattleSession | quiz battles, XP, levels |

### ⚠️ SQLite Deployment Issue:
SQLite হলো local file database — Firebase Hosting-এ কাজ করবে না। Production-এর জন্য migrate করতে হবে:
- **Firestore** (Firebase native — best option)
- **PostgreSQL** (via Supabase, Neon)
- **MySQL** (via PlanetScale)

---

## 8. FIREBASE SERVICES NEEDED

| Service | Needed? | Purpose |
|---------|:-------:|---------|
| **Firebase Hosting** | ✅ YES | Frontend serve করতে |
| **Firebase Authentication** | ✅ YES | Google Sign-In provider |
| **Firebase Cloud Functions** | ✅ YES | API routes server-side run করতে |
| **Firebase App Hosting** | ✅ BEST | Next.js full-stack এর জন্য সবচেয়ে suitable |
| **Firestore** | ✅ YES* | Database migration target (*SQLite replace করতে হবে) |
| **Realtime Database** | ❌ No | ব্যবহার হয় না |
| **Cloud Storage** | ⚠️ MAYBE | File uploads-এর জন্য (এখন local filesystem) |
| **Functions (2nd Gen)** | ⚠️ MAYBE | Socket.IO mini-services host করতে |

---

## 9. SECURITY NOTES

### Role-Based Access:
- **Frontend**: Sidebar nav items filtered by role (`roles: ['TEACHER', 'CR', 'ADMIN']`)
- **Backend**: API routes check `payload.role` from JWT
- **Admin Panel**: Only `SUPER_ADMIN` can access
- **Create Assignment**: Only `TEACHER`, `CR`, `ADMIN`
- **Grade Submissions**: Only `TEACHER`, `ADMIN`

### Demo Mode Security:
- Frontend: `DemoModeError` thrown for all POST/PUT/DELETE
- Backend: `demoGuard()` checks `X-Demo-Mode: true` header → returns 403
- Auth endpoints always allowed (login, register, seed)

### Password Security:
- Passwords hashed with `bcryptjs` (12 salt rounds)
- Password never sent in API responses (`password: _` destructured)
- JWT tokens expire in 7 days

### Sensitive Variables (HIDDEN — variable names only shown):
```
JWT_SECRET                        # Random 40-char string
FIREBASE_PRIVATE_KEY              # RSA private key (-----BEGIN PRIVATE KEY-----)
FIREBASE_CLIENT_EMAIL             # service-account@iam.gserviceaccount.com
NEXT_PUBLIC_FIREBASE_API_KEY      # Firebase API key (public but project-specific)
DATABASE_URL                      # file:./db/custom.db
```

### Security Headers (configured in next.config.ts):
- `X-Content-Type-Options: nosniff`
- `X-XSS-Protection: 1; mode=block`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: camera=(), microphone=(), geolocation=()`

---

## 10. DEPLOYMENT WARNINGS

### ⛔ Critical Blockers:

1. **SQLite will NOT work on Firebase Hosting**
   - SQLite = local file → serverless environments have read-only filesystem
   - MUST migrate to Firestore or external PostgreSQL
   - Prisma schema needs `provider = "postgresql"` or custom Firestore client

2. **`output: "standalone"` ≠ static files**
   - Produces a Node.js server (`.next/standalone/server.js`)
   - Firebase Hosting serves static files only
   - Need Firebase App Hosting or Cloud Functions

3. **2 Mini-services need separate hosting**
   - `chat-service` (Socket.IO, port 3001) — real-time chat
   - `battle-service` (Socket.IO, port 3002) — quiz battles
   - Options: Cloud Run, Railway, Fly.io

4. **`z-ai-web-dev-sdk` is proprietary**
   - AI chat/image features may not work outside dev environment
   - These API routes (`/api/ai/*`) will return errors

### ⚠️ Minor Issues:

5. **`next-auth` listed but NOT used** — custom JWT auth is used instead. Can be removed.
6. **`sharp` (native module)** — may need special build config on Cloud Functions
7. **No `firebase.json` or `.firebaserc`** — need to create for deployment
8. **`setup-firebase.sh`** — for local setup only, not for deployment

---

## 11. RECOMMENDED DEPLOYMENT APPROACH

### Best Option: Firebase App Hosting
Firebase App Hosting natively supports Next.js full-stack apps:

```bash
# 1. Install Firebase CLI
npm install -g firebase-tools

# 2. Login
firebase login

# 3. Initialize (choose App Hosting)
firebase init

# 4. Deploy
firebase deploy
```

**But first you must:**
1. Migrate SQLite → Firestore
2. Create `firebase.json` with hosting config
3. Set all env vars in Firebase console

### Alternative: Vercel (Simplest)
```bash
npx vercel
```
Vercel natively handles Next.js API routes + standalone output. But you still need to migrate the database.

---

## SHORT SUMMARY FOR AI ASSISTANT

> **আমার PU-ALRMS Next.js 16 full-stack app-টি Firebase-এ deploy করতে সাহায্য দরকার।**
>
> - **Framework**: Next.js 16.1.1, React 19, TypeScript 5, Tailwind CSS 4
> - **Architecture**: SPA-style single route (`/`), Zustand state-based navigation
> - **Build**: `npm run build` → `.next/standalone/` (Node.js server, NOT static)
> - **Database**: SQLite via Prisma ORM (18 models) — needs Firestore migration
> - **Auth**: Custom JWT + Firebase Google Auth (5 login methods)
> - **Roles**: 6 roles (SUPER_ADMIN, ADMIN, DEVELOPER, TEACHER, STUDENT, CR)
> - **API Routes**: 44 endpoints
> - **Pages**: 18 pages (Dashboard, Assignments, Quiz, AI Chat, Community, etc.)
> - **Mini-services**: 2 Socket.IO services (chat port 3001, battle port 3002)
> - **Firebase needs**: Hosting + Cloud Functions + Authentication + Firestore
> - **Sensitive env vars**: JWT_SECRET, FIREBASE_PRIVATE_KEY, FIREBASE_CLIENT_EMAIL
> - ** Biggest blocker**: SQLite → Firestore database migration required
