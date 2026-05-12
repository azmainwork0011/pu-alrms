# PU-ALRMS — Complete Project Understanding Guide

> **Purpose:** This document is designed to give another AI assistant (like ChatGPT) complete understanding of every file, function, feature, and architecture decision in this project, so they can continue development, fix bugs, or add new features without any context loss.

---

## 📋 TABLE OF CONTENTS

1. [Project Overview](#1-project-overview)
2. [Technology Stack](#2-technology-stack)
3. [Project Architecture](#3-project-architecture)
4. [File Structure Map](#4-file-structure-map)
5. [Database Schema (All 18 Models)](#5-database-schema-all-18-models)
6. [State Management (Zustand Store)](#6-state-management-zustand-store)
7. [Authentication System](#7-authentication-system)
8. [Security Layers](#8-security-layers)
9. [API Routes — Complete Reference](#9-api-routes--complete-reference)
10. [Frontend Pages — Complete Reference](#10-frontend-pages--complete-reference)
11. [Firebase Integration](#11-firebase-integration)
12. [AI Features (z-ai-web-dev-sdk)](#12-ai-features)
13. [Real-Time Services (Mini Services)](#13-real-time-services)
14. [React Query Hooks](#14-react-query-hooks)
15. [Utility Libraries](#15-utility-libraries)
16. [Design System & UI](#16-design-system--ui)
17. [Environment Variables](#17-environment-variables)
18. [Deployment](#18-deployment)
19. [Seed Data & Demo Accounts](#19-seed-data--demo-accounts)
20. [Known Issues & Gotchas](#20-known-issues--gotchas)

---

## 1. PROJECT OVERVIEW

**PU-ALRMS** (Prime University — Assignment & Lab Report Management System) is a full-stack academic management platform built for a university. It supports multiple user roles, assignment lifecycle management, quizzes, AI chat, real-time community chat, digital library, gamified learning, and more.

**Key Stats:**
- **18 Prisma models** (SQLite database)
- **44 API routes** (Next.js App Router)
- **16 page components** (SPA-style navigation via Zustand)
- **6 user roles** with fine-grained RBAC
- **4 mini services** (chat, battle, pu-server, keepalive)
- **3 authentication methods** (Email/Password, Google OAuth via Firebase, Quick/Demo access)
- **8 AI models** supported in Battle Mode
- **4 academic departments** with 250+ quiz questions
- **6 programming languages** with 150+ CodeQuest questions

**Author:** Jain Azmain — CSE 66 Batch, Prime University

---

## 2. TECHNOLOGY STACK

| Category | Technology | Version |
|----------|-----------|---------|
| **Framework** | Next.js (App Router) | 16.1.1+ |
| **Language** | TypeScript | 5.x |
| **Runtime** | Bun | latest |
| **Styling** | Tailwind CSS | 4.x |
| **UI Components** | shadcn/ui (New York style) | latest |
| **Icons** | Lucide React | 0.525+ |
| **Animations** | Framer Motion | 12.x |
| **State Management** | Zustand | 5.x |
| **Server State** | TanStack React Query | 5.x |
| **Database** | SQLite via Prisma ORM | 6.x |
| **Auth** | JWT (jsonwebtoken) + Firebase Auth | — |
| **Password Hashing** | bcryptjs | 3.x |
| **Real-Time** | Socket.IO Client | 4.x |
| **AI** | z-ai-web-dev-sdk | 0.0.17 |
| **Firebase** | firebase (client) + firebase-admin | 12.x / 13.x |
| **Image Processing** | Sharp | 0.34.x |
| **Charts** | Recharts | 2.x |
| **Forms** | React Hook Form + Zod | 7.x / 4.x |
| **Toast** | Sonner | 2.x |
| **Theming** | next-themes | 0.4.x |
| **Validation** | Zod | 4.x |
| **Markdown** | react-markdown + react-syntax-highlighter | — |
| **Date Utils** | date-fns | 4.x |

---

## 3. PROJECT ARCHITECTURE

### 3.1 SPA-Style Navigation

This app uses **SPA (Single Page Application)** style navigation, NOT traditional Next.js page routing. The entire app runs on a single route (`/`) defined in `src/app/page.tsx`. Navigation between pages is handled by Zustand state (`currentPage`) — no URL changes, no `next/link`.

```
page.tsx → checks isAuthenticated
  ├── NOT authenticated → renders <AuthPage />
  └── IS authenticated → renders <AppLayout />
                                └── switch (currentPage) renders the matching page component
```

### 3.2 Data Flow

```
Client Component → React Query Hook → apiFetch() → API Route → Prisma DB
                        ↓                     ↓
                   TanStack Cache        JWT Verification + RBAC
```

### 3.3 Provider Hierarchy

```
layout.tsx
  └── ThemeProvider (next-themes, default dark)
      └── FirebaseProvider (lazy-loads Firebase SDK on client)
          └── ApiProvider (React Query QueryClientProvider)
              └── {children} / <Toaster />
```

### 3.4 Key Architectural Decisions

1. **No SSR for page components** — All pages use `dynamic(() => import(...), { ssr: false })` to prevent hydration mismatches.
2. **Hydration-safe loading** — A CSS-only loading overlay is injected via `<script>` in `layout.tsx`, removed after React hydrates.
3. **localStorage persistence** — Auth state (token, user) persisted in localStorage, hydrated on mount.
4. **JWT expiry check** — Client-side token expiry check (30s buffer) prevents dashboard flash on expired tokens.
5. **Demo mode** — Separate read-only mode for guests, enforced at both client and server level.
6. **Global error boundary** — `page.tsx` catches unhandled errors but ignores auth/network errors (handled by components).

---

## 4. FILE STRUCTURE MAP

```
src/
├── app/
│   ├── page.tsx                          # Main entry (Auth + App router)
│   ├── layout.tsx                        # Root layout (providers, loading overlay)
│   ├── globals.css                       # Global styles + loading overlay CSS
│   └── api/                              # 44 API routes
│       ├── auth/
│       │   ├── login/route.ts            # POST: Email/password login
│       │   ├── register/route.ts         # POST: Create new account
│       │   ├── firebase/route.ts         # POST: Firebase ID token exchange
│       │   ├── google/route.ts           # POST: Google-style OAuth
│       │   ├── temp-email/route.ts       # POST: Quick/temp email access
│       │   ├── profile/route.ts          # GET/PUT: Profile + photo upload
│       │   ├── profile/photo/route.ts    # DELETE: Remove photo
│       │   └── seed/route.ts             # POST: Seed demo accounts
│       ├── dashboard/route.ts            # GET: Role-based dashboard stats
│       ├── assignments/route.ts          # GET/POST: List/Create assignments
│       ├── assignments/[id]/route.ts     # GET/PUT/DELETE: Single assignment
│       ├── submissions/route.ts          # GET/POST: List/Create submissions
│       ├── submissions/[id]/grade/route.ts # PUT: Grade submission
│       ├── announcements/route.ts        # GET/POST: List/Create announcements
│       ├── announcements/[id]/route.ts   # GET/PUT/DELETE: Single announcement
│       ├── notifications/route.ts        # GET: User notifications
│       ├── notifications/[id]/read/route.ts # PUT: Mark notification read
│       ├── quiz/
│       │   ├── questions/route.ts        # GET/POST: Quiz questions
│       │   ├── categories/route.ts       # GET/POST: Quiz categories
│       │   ├── profile/route.ts          # GET/POST: Quiz profile + streaks
│       │   ├── battle/route.ts           # GET/POST: Battle rooms
│       │   ├── leaderboard/route.ts      # GET: Quiz leaderboard
│       │   └── seed/route.ts             # POST: Seed quiz data
│       ├── leaderboard/route.ts          # GET: Academic leaderboard
│       ├── books/search/route.ts         # GET: Google Books + Open Library
│       ├── books/saved/route.ts          # GET/POST/DELETE: Saved books
│       ├── ai/
│       │   ├── chat/route.ts             # POST/PUT/DELETE: AI chat + battle
│       │   ├── generate-image/route.ts   # POST: AI image generation
│       │   ├── scan/route.ts             # POST: Image analysis
│       │   └── token/route.ts            # GET/POST: AI token management
│       ├── chat/
│       │   ├── rooms/route.ts            # GET/POST: Chat rooms
│       │   ├── rooms/join/route.ts       # POST: Join room
│       │   └── messages/route.ts         # GET/POST: Chat messages
│       ├── comments/route.ts             # GET/POST: Assignment comments
│       ├── cq/                           # CodeQuest API
│       │   ├── profile/route.ts          # GET/PUT: CQ profile
│       │   ├── battle/route.ts           # GET/POST: CQ battles
│       │   ├── leaderboard/route.ts      # GET: CQ leaderboard
│       │   └── friends/route.ts          # GET/POST: CQ friends
│       ├── admin/
│       │   ├── users/route.ts            # GET/PUT/DELETE: Admin user management
│       │   ├── stats/route.ts            # GET: Admin statistics
│       │   └── logs/route.ts             # GET: Audit logs
│       ├── batches/route.ts              # GET: List batches
│       ├── subjects/route.ts             # GET/POST: Subjects
│       └── route.ts                      # GET: API health check
├── components/
│   ├── pages/                            # 16 page components
│   │   ├── AuthPage.tsx                  # Login/Register with Google + Demo
│   │   ├── DashboardPage.tsx             # Role-based dashboard (Student/Teacher/Admin)
│   │   ├── AppLayout.tsx (layout/)       # Sidebar + Header + Page router
│   │   ├── AssignmentsPage.tsx           # Assignment listing + filters
│   │   ├── AssignmentDetailPage.tsx      # Single assignment view + comments
│   │   ├── CreateAssignmentPage.tsx      # Teacher: Create/edit assignment form
│   │   ├── SubmissionsPage.tsx           # Student submissions / Teacher grading
│   │   ├── AnnouncementsPage.tsx         # University announcements
│   │   ├── QuizPage.tsx                  # Quiz system (categories, play, streaks)
│   │   ├── BattlePage.tsx                # Real-time quiz battles
│   │   ├── LeaderboardPage.tsx           # Academic + Quiz leaderboard
│   │   ├── ProfilePage.tsx               # User profile with photo crop/upload
│   │   ├── NotificationsPage.tsx         # Notifications list
│   │   ├── StudentCommunityPage.tsx      # Real-time chat (Socket.IO)
│   │   ├── BooksPage.tsx                 # Digital library (Google Books + Open Library)
│   │   ├── AIChatPage.tsx                # AI Chat with 8 models + Battle Mode
│   │   ├── CodeQuestArena.tsx            # CodeQuest profile/leaderboard
│   │   ├── LearnWithGame.tsx             # Gamified coding quizzes
│   │   ├── FirebaseGuidePage.tsx         # Firebase setup tutorial
│   │   └── RestrictedAccessPage.tsx      # Access denied page
│   ├── layout/
│   │   ├── AppLayout.tsx                 # Main layout: sidebar + header + content
│   │   └── LoadingOverlay.tsx            # CSS loading overlay component
│   ├── ui/                               # 45+ shadcn/ui components (Button, Dialog, etc.)
│   ├── theme-provider.tsx                # next-themes wrapper
│   ├── pu-helpers.tsx                    # Shared helpers (getInitials, PageTransition, etc.)
│   └── image-crop-dialog.tsx             # Image crop dialog for profile photos
├── store/
│   └── app.ts                            # Zustand global store (auth, nav, UI state)
├── providers/
│   ├── firebase-provider.tsx             # Firebase Auth context provider
│   └── api-provider.tsx                  # React Query provider
├── lib/
│   ├── api.ts                            # Core fetch client with retry, timeout, demo guard
│   ├── db.ts                             # Prisma client singleton
│   ├── firebase.ts                       # Firebase SDK init + helper functions
│   ├── jwt.ts                            # JWT sign/verify (7-day expiry)
│   ├── rbac.ts                           # Role-Based Access Control system
│   ├── demo-guard.ts                     # Demo mode middleware
│   ├── zai.ts                            # z-ai-web-dev-sdk singleton
│   ├── ai-token.ts                       # AI token management (env/config file)
│   ├── chat-encryption.ts               # AES-256-GCM chat encryption
│   ├── query-client.ts                   # React Query client config + query key factory
│   ├── utils.ts                          # cn() utility (clsx + tailwind-merge)
│   ├── hooks/use-queries.ts              # 30+ React Query hooks for all API endpoints
│   ├── seed-quiz.ts                      # Quiz seed data (250+ questions, 4 departments)
│   ├── cq-data.ts                        # CodeQuest data (6 languages, 150+ questions)
│   ├── notification-sound.ts             # Web Audio API notification sounds
│   ├── quiz-sounds.ts                    # Web Audio API quiz sounds
│   └── security/
│       ├── validation.ts                 # Zod schemas for all API inputs
│       ├── rate-limit.ts                 # In-memory rate limiter
│       ├── audit-logger.ts              # Prisma audit logging
│       └── sanitize.ts                   # XSS sanitization utilities
├── hooks/
│   ├── use-toast.ts                      # Toast hook (shadcn)
│   └── use-mobile.ts                     # Mobile detection hook
├── middleware.ts                         # Next.js middleware (security headers)
└── globals.css                           # Global CSS + loading overlay styles

prisma/
├── schema.prisma                         # 18 database models
├── seed.ts                               # Full database seeder
└── db/                                   # SQLite database files

mini-services/
├── chat-service/                         # Socket.IO chat server (port 3001)
│   ├── index.ts                          # Express + Socket.IO + Socket.IO-Redis
│   ├── package.json                      # Dependencies
│   └── prisma/schema.prisma              # Chat DB schema
├── battle-service/                       # Real-time battle server (port 3002)
│   └── index.ts                          # Socket.IO battle engine
└── pu-server/                            # Simple HTTP server (port 3003)
    └── index.js                          # Health check server

android-app/                              # Android WebView APK wrapper
├── app/src/main/java/com/pualrms/app/
│   ├── MainActivity.kt                   # WebView with progress bar
│   └── SplashActivity.kt                 # Splash screen
└── app/build.gradle                      # Android build config
```

---

## 5. DATABASE SCHEMA (ALL 18 MODELS)

### 5.1 User (Core Model)
```
User {
  id          String   @id @default(cuid())
  name        String
  email       String   @unique
  password    String
  role        String   @default("STUDENT")  // SUPER_ADMIN, ADMIN, DEVELOPER, TEACHER, STUDENT, CR
  verified    Boolean  @default(false)       // Meta verified badge
  status      String   @default("ACTIVE")    // ACTIVE, SUSPENDED, BANNED
  avatar      String?                       // Profile photo URL
  coverPhoto  String?                       // Cover photo URL
  rollNumber  String?
  batch       String?                       // e.g., "66", "67"
  department  String?
  phone       String?
  bio         String?
  lastLogin   DateTime?

  Relations: subjects, assignments, submissions, comments, notifications,
             announcements, chatMessages, quizAttempts, quizProfile,
             savedBooks, battlesAsP1, battlesAsP2, cqProfile, cqFriends,
             cqFriendOf, cqBattlesP1, cqBattlesP2
}
```

### 5.2 Academic Models
- **Subject** — Course subject (id, name, code, teacherId, batch)
- **Assignment** — Homework/lab reports (id, title, description, subjectId, type[ASSIGNMENT|LAB_REPORT], batch, deadline, fileUrl, status[ACTIVE|ARCHIVED], createdBy)
- **Submission** — Student submissions (id, assignmentId, studentId, fileName, fileUrl, status[SUBMITTED|LATE|GRADED], marks, feedback, submittedAt, gradedAt)
- **Comment** — Assignment comments (id, assignmentId, userId, content)

### 5.3 Communication Models
- **Notification** — User notifications (id, userId, title, message, type[INFO|ASSIGNMENT|FEEDBACK|ANNOUNCEMENT], isRead)
- **Announcement** — University announcements (id, title, message, type[GENERAL|URGENT|ASSIGNMENT|EXAM|RESULT], priority[NORMAL|HIGH|CRITICAL], createdBy)

### 5.4 Chat Models
- **ChatRoom** — Chat rooms (id, name, type[BATCH], batch, department, isPrivate, roomPassword, encryptionKey, status, maxMembers, allowFiles, description, createdBy, lastActivity)
- **ChatMessage** — Messages (id, roomId, userId, content, messageType[TEXT|IMAGE|FILE], fileUrl, fileName)

### 5.5 Quiz Models
- **QuizCategory** — Quiz categories (id, name, department[CSE|LLB|EEE|BBA], icon, description, difficulty[EASY|MEDIUM|HARD])
- **QuizQuestion** — Questions (id, categoryId, question, optionA/B/C/D, correctOption[A/B/C/D], difficulty, points[5-50])
- **QuizAttempt** — Attempt records (id, userId, categoryId, score, totalPoints, correctCount, totalQuestions, accuracy, timeTaken)
- **QuizProfile** — User quiz stats (id, userId, totalXP, dailyStreak, bestStreak, totalQuizzes, totalCorrect, totalQuestions, lastQuizDate)
- **BattleRoom** — Quiz battles (id, player1Id, player2Id, categoryId, status[WAITING|IN_PROGRESS|COMPLETED], totalQuestions, timePerQuestion, scores, winnerId)

### 5.6 Book Models
- **SavedBook** — User's saved books (id, userId, bookId, title, authors, coverUrl, category, language, description, infoLink, pdfLink) — @@unique([userId, bookId])

### 5.7 CodeQuest Models
- **CQProfile** — CodeQuest profile (id, userId, level, totalXP, currentLevelXP, xpToNextLevel, battlesWon, battlesLost, totalBattles, lessonsCompleted, questionsAnswered, correctAnswers, miniGamesPlayed, dailyStreak, bestStreak, title, avatar)
- **CQFriend** — Friend connections (id, userId, friendId, status[PENDING|ACCEPTED]) — @@unique([userId, friendId])
- **CQBattleSession** — CodeQuest battles (id, player1Id, player2Id, language, status, totalRounds, timePerRound, HP, scores, currentRound, winnerId)

---

## 6. STATE MANAGEMENT (ZUSTAND STORE)

**File:** `src/store/app.ts`

### State Fields
```typescript
{
  // Auth
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  mounted: boolean;           // True after hydrate() runs on client

  // Demo mode
  isDemoUser: boolean;        // True when logged in via demo account

  // Navigation
  currentPage: PageView;      // Active page key (SPA routing)
  selectedAssignmentId: string | null;  // For assignment detail view

  // UI State
  sidebarOpen: boolean;
  notificationCount: number;
}
```

### PageView Type (all possible pages)
```typescript
type PageView =
  | 'admin-panel' | 'dashboard' | 'assignments' | 'lab-reports'
  | 'assignment-detail' | 'create-assignment' | 'submissions'
  | 'ai-chat' | 'leaderboard' | 'notifications' | 'profile'
  | 'student-community' | 'announcements' | 'quiz' | 'code-quest'
  | 'books' | 'firebase-guide';
```

### Actions (all available store methods)
```typescript
setAuth(user, token, isDemo?)    // Set auth state + persist to localStorage
setDemoMode(isDemo)              // Toggle demo mode flag
updateUser(data)                 // Partial update user + persist
logout()                         // Clear auth + localStorage
setPage(page)                    // Navigate to page (SPA)
setAssignmentId(id)              // Navigate to assignment detail
toggleSidebar()                  // Mobile sidebar toggle
setSidebarOpen(open)             // Mobile sidebar state
setNotificationCount(count)      // Update notification badge
hydrate()                        // Restore auth from localStorage (client-only)
```

### Token Expiry Logic
- `hydrate()` checks if JWT is expired client-side (30s buffer before actual expiry)
- If expired → clears state → shows AuthPage (no dashboard flash)
- Token is a standard JWT with `{ userId, email, role, name }` payload

---

## 7. AUTHENTICATION SYSTEM

### 7.1 Auth Methods

| Method | API Endpoint | Description |
|--------|-------------|-------------|
| Email/Password | `POST /api/auth/login` | Standard login with bcrypt password verification |
| Registration | `POST /api/auth/register` | Creates new account (Student by default, Teacher requires admin token) |
| Firebase Google | `POST /api/auth/firebase` | Exchanges Firebase ID token for PU-ALRMS JWT |
| Google OAuth | `POST /api/auth/google` | Client-side Google auth → server JWT (fallback if Firebase not configured) |
| Quick/Demo | `POST /api/auth/temp-email` | Generates temp email, instant access (rate-limited 10/hr/IP) |
| Seed Accounts | `POST /api/auth/seed` | Creates/updates demo accounts |

### 7.2 JWT Details
- **Library:** `jsonwebtoken`
- **Secret:** `process.env.JWT_SECRET` or `'pu-alrms-dev-key-2024-local'` (dev fallback)
- **Expiry:** 7 days
- **Payload:** `{ userId, email, role, name }`

### 7.3 Auth Flow (Client Side)
1. User submits login form → `authApi.login(email, password)`
2. Server returns `{ token, user }` (user without password)
3. `useAppStore.setAuth(user, token)` stores in Zustand + localStorage
4. Page re-renders: `isAuthenticated = true` → shows `<AppLayout />`
5. All subsequent API calls include `Authorization: Bearer <token>` header

### 7.4 Auth Flow (Server Side — API Routes)
1. Extract `Authorization: Bearer <token>` header
2. `verifyToken(token)` → returns `JWTPayload` or `null`
3. Check user role/permissions via RBAC
4. Process request and return data

### 7.5 Demo Mode
- Demo users identified by `localStorage.getItem('is-demo') === 'true'`
- Client sends `X-Demo-Mode: true` header on all requests
- Server blocks all POST/PUT/DELETE for demo users
- Demo users see read-only versions of pages
- Admin panel, AI chat, community chat are hidden for demo users

---

## 8. SECURITY LAYERS

### 8.1 RBAC System (`src/lib/rbac.ts`)

**Role Hierarchy (highest to lowest):**
```
SUPER_ADMIN (100) > ADMIN (80) > DEVELOPER (70) > TEACHER (50) > CR (30) > STUDENT (20)
```

**Permission Types:** `admin:access`, `admin:users:*`, `assignment:view/create/edit/delete`, `submission:view/create/grade`, `announcement:view/create/edit/delete`, `chat:access/send`, `quiz:view/play`, `profile:view/edit`, `ai:chat/generate`, `books:view/save`, `leaderboard:view`, `dashboard:view/admin`, `notification:view/manage`, `subject:view/create/edit`

**Key Functions:**
- `hasPermission(role, permission)` — Check if role has specific permission
- `requirePermission(permission)` — Returns middleware guard for API routes
- `requireMinRole(role)` — Returns middleware for minimum role level
- `checkPageAccess(page, role, isDemo)` — Frontend page visibility check
- `authenticateRequest(req)` — Extracts JWT payload from request
- `demoGuard(request)` — Blocks demo users from write operations

### 8.2 Input Validation (`src/lib/security/validation.ts`)
Zod schemas for all API inputs:
- `loginSchema` — email + password (min 6 chars)
- `registerSchema` — name + email + password (8+ chars, uppercase, number, special char) + role + optional fields
- `assignmentSchema` — title (3+) + description (10+) + subjectId + type + deadline
- `quizQuestionSchema` — Full question with all 4 options + correctOption
- `chatMessageSchema` — content (max 2000 chars) + messageType + roomId

### 8.3 Rate Limiting (`src/lib/security/rate-limit.ts`)
- In-memory store (Map), auto-cleanup every 5 minutes
- `authLimiter`: 20 requests / 15 minutes
- `apiLimiter`: 100 requests / minute
- `quizLimiter`: 30 requests / minute
- Exponential backoff retry support

### 8.4 Audit Logging (`src/lib/security/audit-logger.ts`)
- Logs to Prisma `AuditLog` table
- Actions: LOGIN_SUCCESS/FAILURE, LOGOUT, REGISTER, ASSIGNMENT_CREATE, QUIZ_COMPLETE, ACCESS_DENIED, etc.
- Non-blocking (async, catch-all error handler)

### 8.5 XSS Sanitization (`src/lib/security/sanitize.ts`)
- `sanitizeInput(input)` — HTML entity encoding
- `stripHtml(input)` — Remove all HTML tags
- `sanitizeObject(obj)` — Recursive sanitization
- `isValidEmail(email)` — Email format validation
- `isValidPhone(phone)` — Bangladesh phone format validation

### 8.6 Next.js Middleware (`src/middleware.ts`)
- Security headers: X-Content-Type-Options, X-XSS-Protection, Referrer-Policy, Permissions-Policy
- HSTS in production
- Matcher excludes static assets

---

## 9. API ROUTES — COMPLETE REFERENCE

### 9.1 Auth Routes

#### `POST /api/auth/login`
- **Body:** `{ email, password }`
- **Returns:** `{ token, user }` (user without password)
- **Logic:** bcrypt compare → check status (BANNED/SUSPENDED) → sign JWT → update lastLogin
- **Errors:** 400 (missing fields), 401 (invalid creds), 403 (banned/suspended), 500

#### `POST /api/auth/register`
- **Body:** `{ name, email, password, role? }`
- **Returns:** `{ token, user }` (201)
- **Logic:** Check unique email → determine role (TEACHER requires admin token) → bcrypt hash → create user → sign JWT
- **Errors:** 400, 409 (email exists), 403 (can't create admin)

#### `POST /api/auth/firebase`
- **Body:** `{ idToken }` (Firebase ID token string)
- **Returns:** `{ token, user, isNewUser, provider }`
- **Logic:** Try Admin SDK verification → fallback to manual JWT decode → find/create user → sign PU-ALRMS JWT
- **Security:** Validates issuer (firebaseapp.com/google.com), checks expiry

#### `POST /api/auth/google`
- **Body:** `{ name, email, avatar?, role? }`
- **Returns:** `{ token, user, isExisting }`
- **Logic:** Find user by email → login or create with random password → STUDENT role only (no privilege escalation)

#### `POST /api/auth/temp-email`
- **Body:** `{ name? }`
- **Returns:** `{ token, user, tempEmail }`
- **Logic:** Generate random email → create/find user → sign JWT
- **Rate Limit:** 10 per hour per IP (in-memory)

#### `GET /api/auth/profile`
- **Auth:** Bearer token required
- **Returns:** `{ user }` (full profile without password)

#### `PUT /api/auth/profile`
- **Auth:** Bearer token required
- **JSON Body:** `{ name?, rollNumber?, batch?, department?, phone?, bio? }`
- **FormData Body:** `file` + `type` (avatar/cover) — Sharp processing (resize + JPEG convert)
- **Image Processing:** Avatar 150×150, Cover 1500×500, JPEG quality 85, MIME validation (JPG/PNG/WebP only), max 5MB

#### `DELETE /api/auth/profile/photo`
- **Body:** `{ type: "avatar" | "cover" }`
- **Logic:** Delete physical file + set DB field to null

#### `POST /api/auth/seed`
- **Returns:** `{ success, results }`
- **Creates 6 demo accounts** (see Section 19)

### 9.2 Dashboard

#### `GET /api/dashboard`
- **Auth:** Required
- **Student:** pendingAssignments, submittedCount, upcomingDeadlines (14 days), averageMarks, recentSubmissions, recentNotifications, weeklyPerformance (6 weeks), subjectPerformance breakdown, completionRate
- **Teacher:** createdAssignments, totalSubmissions, pendingGrading, averageMarks, recentSubmissions, mySubjects, weeklyTrend
- **Admin:** totalUsers, totalAssignments, totalSubmissions, usersByRole, topStudents, ungradedCount

### 9.3 Assignments

#### `GET /api/assignments?type=&subjectId=&status=`
- **Auth:** Required
- **Student:** Shows only ACTIVE assignments, filtered by batch or open (null batch)
- **Teacher:** Shows only their own assignments
- **Admin:** Shows all
- **Includes:** subject (with teacher), creator, submission count, comment count

#### `POST /api/assignments`
- **Roles:** TEACHER, ADMIN, CR
- **Body:** `{ title, description, subjectId, type, deadline, fileUrl?, batch? }`
- **Creates notifications** for all matching students

#### `GET /api/assignments/[id]`
- **Includes:** subject + teacher, creator, all submissions + students, all comments + users

#### `PUT /api/assignments/[id]`
- **Roles:** TEACHER (own only), ADMIN, CR
- **Body:** Partial update fields

#### `DELETE /api/assignments/[id]`
- **Roles:** TEACHER (own only), ADMIN
- **Soft delete:** Sets status to 'ARCHIVED'

### 9.4 Submissions

#### `GET /api/submissions?assignmentId=&studentId=`
- **Student:** Only own submissions
- **Teacher/Admin:** Can filter by student

#### `POST /api/submissions`
- **Roles:** STUDENT only
- **Body:** `{ assignmentId, fileName, fileUrl? }`
- **Checks:** Assignment exists + active, not already submitted, auto-detects LATE

#### `PUT /api/submissions/[id]/grade`
- **Roles:** TEACHER only (own assignments)
- **Body:** `{ marks, feedback? }`
- **Creates notification** for student about the grade

### 9.5 Announcements

#### `GET /api/announcements?limit=&offset=`
- All authenticated users can view

#### `POST /api/announcements`
- **Roles:** TEACHER, ADMIN
- **Types:** GENERAL, URGENT, ASSIGNMENT, EXAM, RESULT
- **Priorities:** NORMAL, HIGH, CRITICAL
- **Creates notifications** for all students

### 9.6 Notifications

#### `GET /api/notifications`
- Returns all notifications for authenticated user (newest first)

#### `PUT /api/notifications/[id]/read`
- Marks notification as read (only own notifications)

### 9.7 Quiz System

#### `GET /api/quiz/categories?department=`
- Returns active categories with question counts

#### `POST /api/quiz/categories`
- **Roles:** TEACHER, ADMIN

#### `GET /api/quiz/questions?categoryId=&count=10`
- Returns shuffled random questions (WITHOUT correctOption for practice)

#### `POST /api/quiz/questions`
- **Action: submit** — Submit quiz answers, auto-grade, create QuizAttempt
- **Action: create** — Teacher creates questions (WITH correctOption)

#### `GET /api/quiz/profile`
- Returns user's quiz stats (XP, streak, best streak, total quizzes)
- Auto-resets streak if >1 day gap

#### `POST /api/quiz/profile`
- **Body:** `{ xpGained, correctCount, totalQuestions }`
- Updates profile with streak logic (consecutive day = +1, gap >1 day = reset to 1)

#### `GET /api/quiz/battle?type=waiting|history`
- **waiting:** Open rooms (not own)
- **history:** User's completed battles

#### `POST /api/quiz/battle`
- **Actions:** create, join, complete, get-questions

#### `GET /api/quiz/leaderboard?department=&limit=50`
- Best attempt per user, sorted by score → accuracy → time

#### `POST /api/quiz/seed`
- Seeds 25 categories across 4 departments with 250+ questions

### 9.8 Books

#### `GET /api/books/search?q=&category=&lang=en&source=google&page=1&maxResults=12`
- **Sources:** Google Books API (primary) + Open Library (fallback)
- **Categories:** Computer Science, Law, BBA, Engineering, Web Dev, Data Science, History
- **Caching:** 5-minute in-memory cache
- **Auto-fallback:** If Google returns 0 results → tries Open Library

#### `GET /api/books/saved`
- Returns user's saved books

#### `POST /api/books/saved`
- **Body:** `{ bookId, title, authors, coverUrl?, category?, ... }`
- Uses `upsert` (no duplicates)

#### `DELETE /api/books/saved?bookId=`
- Removes saved book

### 9.9 AI Features

#### `POST /api/ai/chat`
- **Body:** `{ message, mode: "single"|"battle", modelId?, selectedModels? }`
- **Single Mode:** Sends to specific AI model, maintains conversation history (max 50 messages)
- **Battle Mode:** Sends to 2-3 random models, shuffles responses with labels (A, B, C), creates vote session
- **8 AI Models:** GPT-4o, Claude 3.5 Sonnet, Gemini 1.5 Pro, LLaMA 3.1 405B, Mistral Large, GPT-5, Claude 4 Opus, Gemini 2.0 Flash
- **Anonymization:** Strips model identity mentions from responses
- **System Prompt:** Academic AI assistant for Prime University

#### `PUT /api/ai/chat`
- **Body:** `{ battleId, label }`
- Vote for a battle response → reveals real model names

#### `DELETE /api/ai/chat`
- Clears all conversation history for user

#### `POST /api/ai/generate-image`
- **Body:** `{ prompt }`
- Uses z-ai-web-dev-sdk image generation
- Enhanced prompt with style keywords
- 2 retries on failure

#### `POST /api/ai/scan`
- **Body:** `{ image (data URL), question }`
- Uses VLM (vision model) to analyze images and answer questions
- "Professor Gemini" persona

### 9.10 Chat (Real-Time)

#### `GET /api/chat/rooms`
- Lists available chat rooms

#### `POST /api/chat/rooms`
- Creates new chat room

#### `POST /api/chat/rooms/join`
- Joins a chat room

#### `GET /api/chat/messages?roomId=`
- Gets messages for a room

#### `POST /api/chat/messages`
- Sends a message to a room

### 9.11 CodeQuest

#### `GET /api/cq/profile`
#### `PUT /api/cq/profile`
#### `GET /api/cq/battle`
#### `POST /api/cq/battle`
#### `GET /api/cq/leaderboard`
#### `GET/POST /api/cq/friends`

### 9.12 Admin

#### `GET /api/admin/users`
- Lists all users with pagination, search, role filter

#### `PUT /api/admin/users/[action]`
- suspend, ban, activate, changeRole

#### `DELETE /api/admin/users`
- Delete user

#### `GET /api/admin/stats`
- Platform statistics

#### `GET /api/admin/logs`
- Audit log entries

### 9.13 Other

#### `GET /api/batches` — List unique batch values
#### `GET/POST /api/subjects` — List/create subjects
#### `GET /api/leaderboard` — Academic leaderboard (by average marks)
#### `GET /api/comments?assignmentId=` — Assignment comments
#### `POST /api/comments` — Create comment
#### `GET /api` — API health check

---

## 10. FRONTEND PAGES — COMPLETE REFERENCE

### 10.1 AuthPage (`src/components/pages/AuthPage.tsx`)
- **Purpose:** Login/Register page with premium dark UI
- **Features:**
  - Sign In / Register tab switcher with animated indicator
  - Role selector (Student/Teacher/Admin) with role-specific styling
  - Password strength meter (weak/fair/strong/very strong)
  - Remember me checkbox
  - Forgot password placeholder
  - Google Sign-In button (Firebase popup if configured, else manual form dialog)
  - Quick Access (temp email) button
  - Demo account (Guest Student) one-click login
  - Animated background with gradient orbs
  - Error display with retry button
  - Network error detection
  - Auto-seed demo accounts on mount
  - Email persistence across page refreshes

### 10.2 AppLayout (`src/components/layout/AppLayout.tsx`)
- **Purpose:** Main authenticated layout with sidebar + header
- **Features:**
  - Desktop sidebar (fixed, 256px wide) with navigation
  - Mobile sidebar (Sheet component, 256px wide)
  - Header with hamburger menu, theme toggle, notification bell, user dropdown
  - Demo mode banner (yellow, with "Exit Demo" button)
  - Page transitions with Framer Motion
  - Role-based nav filtering
  - Demo mode nav filtering
  - Dev credit footer with version badge

### 10.3 Sidebar Navigation Items
| Page Key | Label | Icon | Roles | Demo Hidden |
|----------|-------|------|-------|-------------|
| dashboard | Dashboard | LayoutDashboard | all | no |
| admin-panel | Admin Panel | Shield | SUPER_ADMIN | yes |
| assignments | Assignments | ClipboardList | all | no |
| lab-reports | Lab Reports | FlaskConical | all | no |
| create-assignment | Create Assignment | Plus | TEACHER, CR, ADMIN | yes |
| submissions | Grade Submissions / My Submissions | FileText | all | no |
| leaderboard | Leaderboard | Trophy | STUDENT, CR, ADMIN | no |
| announcements | Announcements | Megaphone | all | no |
| student-community | Community Chat | MessageSquare | all | yes |
| quiz | Quick Quiz | GraduationCap | all | no |
| code-quest | Learn With Game | Swords | all | no |
| books | Digital Library | BookOpen | all | no |
| ai-chat | Lucky Strick AI | Sparkles | all | yes |
| notifications | Notifications | Bell | all | no |
| profile | Profile | UserIcon | all | no |
| firebase-guide | Firebase Setup | Link2 | all | no |

### 10.4 DashboardPage
- **Student:** Stats cards (pending, submitted, average marks), upcoming deadlines, weekly performance chart, subject breakdown, recent submissions, announcements
- **Teacher:** Stats cards (assignments, submissions, pending grading), recent ungraded, my subjects, submission trend
- **Admin:** Platform stats, user role distribution, top students, ungraded count

### 10.5 AssignmentsPage
- Filter by type (Assignment/Lab Report), subject, status
- Assignment cards with deadline, subject, submission count
- Role-based create button (Teacher/CR/Admin)
- Click → navigates to AssignmentDetailPage

### 10.6 AssignmentDetailPage
- Full assignment details
- Submission form (students)
- Comments section with create
- Grade display (if graded)

### 10.7 CreateAssignmentPage
- Rich form: title, description, subject (from API), type, batch, deadline
- File attachment support

### 10.8 SubmissionsPage
- **Student:** List of own submissions with status, marks, feedback
- **Teacher:** List of all submissions for their assignments, inline grading

### 10.9 QuizPage
- Category selection (filtered by department)
- Quiz play mode: questions with timer, options, progress bar
- Results screen with score, accuracy, XP gained
- Profile stats: streak, total XP, best streak
- Battle mode: create/join rooms, real-time quiz battles

### 10.10 BattlePage
- Real-time quiz battle system
- Waiting room → find opponent → battle → results

### 10.11 LeaderboardPage
- Tab: Academic (by marks) / Quiz (by XP)
- Ranked list with medals

### 10.12 ProfilePage
- View/edit profile (name, email, role, batch, department, phone, bio)
- Avatar upload with image crop dialog
- Cover photo upload
- Photo delete option

### 10.13 NotificationsPage
- List of all notifications (unread badge)
- Mark as read (individual)
- Different types with icons

### 10.14 AnnouncementsPage
- List of announcements
- Create form (Teacher/Admin)
- Priority badges (Normal/High/Critical)
- Type badges (General/Urgent/Assignment/Exam/Result)

### 10.15 AIChatPage
- Model selector (8 AI models with provider info)
- Single mode: chat with selected model
- Battle mode: compare 2-3 anonymous responses, vote, reveal
- Conversation history per model
- Message formatting (markdown, code blocks)
- Image generation from chat
- Clear chat history

### 10.16 BooksPage
- Search bar with category quick filters
- Google Books + Open Library results
- Save/unsave books
- Saved books tab
- Book detail with description, authors, preview link

### 10.17 StudentCommunityPage
- Socket.IO real-time chat
- Room selection
- Message sending (text, image, file)
- AES-256-GCM encrypted messages

### 10.18 LearnWithGame / CodeQuestArena
- Programming language selection (Python, Java, JavaScript, Kotlin, Dart, Swift)
- Topic-based quizzes
- XP system with level progression
- Daily challenges
- Mock leaderboard
- Battle mode

---

## 11. FIREBASE INTEGRATION

### 11.1 Configuration
- Environment variables: `NEXT_PUBLIC_FIREBASE_API_KEY`, `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`, `NEXT_PUBLIC_FIREBASE_PROJECT_ID`, `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`, `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`, `NEXT_PUBLIC_FIREBASE_APP_ID`
- Config loaded from env vars at build time

### 11.2 Firebase Provider (`src/providers/firebase-provider.tsx`)
- **Lazy loading:** Firebase SDK loaded entirely on client side (no SSR)
- **15s timeout:** Protection against slow SDK loading
- **Auth state listener:** `onAuthStateChanged` → exchanges Firebase ID token → PU-ALRMS JWT → Zustand `setAuth()`
- **Context:** Exposes `isFirebaseReady`, `signInWithGoogle()`, `signOutFirebase()`

### 11.3 Server-Side Verification (`src/app/api/auth/firebase/route.ts`)
- Primary: Firebase Admin SDK (`verifyIdToken`)
- Fallback: Manual JWT decode (base64url) with issuer validation
- Finds or creates user, signs PU-ALRMS JWT

### 11.4 Setup Guide
- Dedicated `FirebaseGuidePage.tsx` (1333 lines) — step-by-step guide
- `setup-firebase.sh` — Bash script for Firebase CLI setup

---

## 12. AI FEATURES

### 12.1 z-ai-web-dev-sdk Integration (`src/lib/zai.ts`)
- Singleton pattern: `getZAI()` creates/caches ZAI instance
- Auto-reads config from `.z-ai-config` file
- Used for: chat completions, image generation, vision (image scanning)

### 12.2 AI Chat (`src/app/api/ai/chat/route.ts`)
- **8 AI Models:** GPT-4o, Claude 3.5 Sonnet, Gemini 1.5 Pro, LLaMA 3.1 405B, Mistral Large, GPT-5, Claude 4 Opus, Gemini 2.0 Flash
- **Conversation History:** Per-user per-model, max 50 messages, trimmed FIFO
- **Battle Mode:** Multiple models respond to same prompt, responses shuffled anonymously, users vote, reveals real model identities
- **Anonymization:** Regex strips model identity mentions ("As an AI...", "I am GPT...", company names)
- **System Prompt:** Academic AI assistant for Prime University with subject expertise

### 12.3 Image Generation (`src/app/api/ai/generate-image/route.ts`)
- Enhanced prompt with quality/style keywords
- Handles base64 and URL responses
- 2 retries on failure

### 12.4 Image Scanning (`src/app/api/ai/scan/route.ts`)
- Vision model analyzes uploaded images
- "Professor Gemini" persona
- Structured analysis: description, answer, educational context

### 12.5 Token Management (`src/lib/ai-token.ts`)
- Priority: env var ZAI_TOKEN → in-memory cache → local .z-ai-config → /etc/.z-ai-config
- `getToken()`, `setToken()`, `hasToken()`, `clearToken()`, `getTokenStatus()`

---

## 13. REAL-TIME SERVICES

### 13.1 Chat Service (`mini-services/chat-service/`)
- **Port:** 3001
- **Tech:** Express + Socket.IO + Socket.IO-Redis adapter
- **Features:** Room management, message broadcasting, typing indicators, online status, file upload support
- **Database:** Separate Prisma SQLite for chat data
- **Frontend:** Socket.IO client connects via `io('/?XTransformPort=3001')`

### 13.2 Battle Service (`mini-services/battle-service/`)
- **Port:** 3002
- **Tech:** Socket.IO
- **Features:** Real-time quiz battle synchronization, HP tracking, round management

### 13.3 PU Server (`mini-services/pu-server/`)
- **Port:** 3003
- **Simple health check server**

---

## 14. REACT QUERY HOOKS

**File:** `src/lib/hooks/use-queries.ts`

### Query Hooks (Data Fetching)
| Hook | Query Key | Stale Time |
|------|-----------|------------|
| `useDashboard()` | `['dashboard', 'stats']` | 20s |
| `useAssignments(params?)` | `['assignments', 'list', params]` | 30s |
| `useAssignment(id)` | `['assignments', 'detail', id]` | 30s |
| `useSubmissions(params?)` | `['submissions', 'list', params]` | 30s |
| `useSubjects()` | `['subjects']` | 60s |
| `useBatches()` | `['batches']` | 60s |
| `useNotifications()` | `['notifications']` | 10s |
| `useLeaderboard()` | `['leaderboard']` | 60s |
| `useAnnouncements(params?)` | `['announcements', 'list', params]` | 30s |
| `useAnnouncement(id)` | `['announcements', 'detail', id]` | 30s |
| `useComments(assignmentId)` | `['comments', assignmentId]` | 15s |
| `useBookSearch(params)` | `['books', 'search', params]` | 60s |
| `useSavedBooks()` | `['books', 'saved']` | 30s |
| `useQuizProfile()` | `['quiz', 'profile']` | 30s |
| `useQuizCategories(params?)` | `['quiz', 'categories', params]` | 60s |
| `useAuthProfile()` | `['auth', 'profile']` | 2min |

### Mutation Hooks (Data Modification)
| Hook | Success Action |
|------|---------------|
| `useCreateAssignment()` | Invalidate assignments + subjects queries |
| `useUpdateAssignment()` | Invalidate assignment list + detail |
| `useDeleteAssignment()` | Optimistic removal + invalidate |
| `useCreateSubmission()` | Invalidate submissions + assignments |
| `useGradeSubmission()` | Invalidate submissions + assignments |
| `useCreateSubject()` | Invalidate subjects |
| `useMarkNotificationRead()` | Invalidate notifications |
| `useCreateAnnouncement()` | Invalidate announcements |
| `useUpdateAnnouncement()` | Invalidate announcements |
| `useDeleteAnnouncement()` | Optimistic removal + invalidate |
| `useCreateComment()` | Invalidate comments for assignment |
| `useSaveBook()` | Invalidate saved books |
| `useRemoveBook()` | Invalidate saved books |
| `useUpdateQuizProfile()` | Invalidate quiz all |
| `useSubmitQuizAttempt()` | Invalidate quiz all |

### Global Error Handling (QueryClient)
- Network errors → toast "Network error"
- Timeout errors → toast "Request timed out"
- Server errors (5xx) → toast "Server error"
- Auth errors → NOT toasted (handled by AuthPage)
- 4xx client errors → NOT toasted (handled by mutation/query)

---

## 15. UTILITY LIBRARIES

### 15.1 API Client (`src/lib/api.ts`)
- `apiFetch<T>(endpoint, options)` — Core fetch wrapper
  - Timeout: 15s default, 20s auth, 30s upload
  - Retry: 2 retries for GET, exponential backoff, no retry for mutations
  - Auth header auto-injection from localStorage
  - Demo mode header (`X-Demo-Mode: true`)
  - `DemoModeError` thrown for demo write attempts
- `fetchWithTimeout(url, options, timeout)` — AbortController-based timeout
- Error classes: `ApiError`, `NetworkError`, `TimeoutError`, `DemoModeError`
- API namespaces: `authApi`, `assignmentApi`, `submissionApi`, `commentApi`, `notificationApi`, `dashboardApi`, `leaderboardApi`, `subjectApi`, `announcementApi`, `aiApi`, `booksApi`, `quizApi`, `batchApi`

### 15.2 Helpers (`src/components/pu-helpers.tsx`)
- `getInitials(name)` — Get initials from name
- `PageTransition` — Framer Motion page transition wrapper
- `DevCredit` — Developer credit component
- `getPasswordStrength(password)` — Returns { score, label, width, color }
- `isValidEmail(email)` — Email format validation

### 15.3 Sound System
- `notification-sound.ts` — Web Audio API synthesized notification sounds (no audio files)
- `quiz-sounds.ts` — Web Audio API quiz sounds (correct, wrong, complete, battle, countdown)

### 15.4 Chat Encryption (`src/lib/chat-encryption.ts`)
- AES-256-GCM encryption using Web Crypto API
- `generateEncryptionKey()` — 256-bit random key
- `encryptMessage(plaintext, keyHex)` → `{ encrypted, iv }`
- `decryptMessage(encryptedHex, keyHex, ivHex)` → plaintext

---

## 16. DESIGN SYSTEM & UI

### 16.1 Theme
- **Default:** Dark mode
- **Colors:** Tailwind CSS built-in variables (bg-background, text-primary-foreground, etc.)
- **No indigo/blue** unless explicitly requested
- **Primary accent:** Emerald (sidebar active states, badges, success)
- **Auth page accents:** Pink (#ec4899), Cyan (#22d3ee), Violet (#a78bfa)

### 16.2 UI Components (shadcn/ui — New York style)
45+ components in `src/components/ui/`:
Button, Input, Label, Select, Dialog, Sheet, DropdownMenu, Tooltip, Avatar, Badge, Card, Table, Tabs, Accordion, Checkbox, Switch, RadioGroup, Slider, Progress, ScrollArea, Skeleton, Toast/Sonner, Calendar, Command, Menubar, NavigationMenu, Popover, HoverCard, ContextMenu, Carousel, Resizable, Form, Alert, AlertDialog, Separator, Sidebar, Toggle, ToggleGroup, Breadcrumb, Pagination, InputOTP, AspectRatio, Collapsible, Drawer, Chart

### 16.3 Loading States
- CSS-only loading overlay (injected via script tag, removed after hydration)
- Framer Motion page transitions
- Skeleton loaders in pages
- Spinner for buttons during loading

### 16.4 Responsive Design
- Mobile-first approach
- Breakpoints: sm, md, lg, xl
- Desktop: Fixed sidebar (256px) + scrollable content
- Mobile: Sheet sidebar (hamburger menu) + full-width content
- Touch-friendly: 44px minimum touch targets

---

## 17. ENVIRONMENT VARIABLES

### Required (Production)
```
JWT_SECRET=<random-secret-string>
DATABASE_URL=file:./db/custom.db
```

### Firebase (Optional — for Google Sign-In)
```
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=...
```

### Firebase Admin (Optional — for server-side token verification)
```
FIREBASE_PROJECT_ID=...
FIREBASE_CLIENT_EMAIL=...
FIREBASE_PRIVATE_KEY=...
```

### AI (Optional — for AI features)
```
ZAI_TOKEN=<ai-service-token>  # OR configure via .z-ai-config file
```

---

## 18. DEPLOYMENT

### Vercel Deployment
```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel

# Set environment variables in Vercel Dashboard
# JWT_SECRET, DATABASE_URL, Firebase vars
```

**Note:** SQLite database does NOT work on Vercel serverless. You need to:
1. Switch to Turso (libSQL) or PlanetScale (MySQL) for production
2. Or deploy to a VPS with `bun run start` (standalone output mode)

### Standalone Deployment (VPS)
```bash
bun run build
bun run start  # Starts standalone server on port 3000
```

### Android App
- WebView wrapper in `android-app/` folder
- Open in Android Studio on Windows
- Set `BASE_URL` in `MainActivity.kt` to your deployed URL
- Build APK → distribute via URL

---

## 19. SEED DATA & DEMO ACCOUNTS

### Demo Accounts (created by `POST /api/auth/seed`)
| Name | Email | Password | Role |
|------|-------|----------|------|
| Diya Jain | diya.jainazmain9086@example.com | superadmin2024 | SUPER_ADMIN |
| Dev Alpha | dev.alpha@pu.edu | dev123 | DEVELOPER |
| Dev Beta | dev.beta@pu.edu | dev123 | DEVELOPER |
| System Admin | admin@pu.edu | admin123 | ADMIN |
| Dr. Sarah Smith | dr.smith@pu.edu | teacher123 | TEACHER |
| Alice Chen | alice@stu.pu.edu | student123 | STUDENT |

### Quiz Data (created by `POST /api/quiz/seed`)
- **CSE Department (7 categories):** C++ Programming, Python Programming, Data Structures, Operating Systems, Database Management, Networking, Machine Learning
- **LLB Department (5 categories):** Constitutional Law, Criminal Law, Contract Law, International Law, Corporate Law
- **EEE Department (5 categories):** Circuit Analysis, Digital Electronics, Power Systems, Signals & Systems, Control Systems
- **BBA Department (7 categories):** Business Management, Mathematics, Marketing, Human Resources, Financial Accounting, Entrepreneurship

### CodeQuest Data (static in `src/lib/cq-data.ts`)
- **6 Languages:** Python, Java, JavaScript, Kotlin, Dart, Swift
- **150+ Questions** across all languages
- **Topics per language:** Fundamentals, OOP, Data Structures, Advanced
- **Level System:** 20 levels, 0-35000 XP range
- **Daily Challenges:** Rotating challenges per day of week

---

## 20. KNOWN ISSUES & GOTCHAS

1. **SPA Architecture:** All navigation is client-side via Zustand state. No URL routing. Adding a new page requires:
   - Create component in `src/components/pages/`
   - Add `PageView` type in `src/store/app.ts`
   - Add case in `AppLayout.tsx` `renderPage()` switch
   - Add nav item in `SidebarNav` array

2. **SQLite on Vercel:** Doesn't work (serverless = no persistent filesystem). Need external DB for production.

3. **No SSR for pages:** All page components use `dynamic(() => import(...), { ssr: false })`. If you need SEO, this is a limitation.

4. **`page.tsx` is the ONLY route:** The app runs entirely on `/`. Do NOT create new route files in `src/app/` (except `api/` routes).

5. **Demo mode is restrictive:** Write operations are blocked at both client (api.ts DemoModeError) and server (X-Demo-Mode header check).

6. **Firebase SDK loading:** Lazy-loaded on client with 15s timeout. If it fails, falls back to manual Google auth form.

7. **Chat encryption:** Client-side only. Server-side chat service has its own encryption.

8. **Image uploads:** Stored in `public/uploads/profiles/{userId}/`. This won't work on Vercel (read-only filesystem).

9. **Port restriction:** Dev server must use port 3000. Mini services use ports 3001 (chat), 3002 (battle), 3003 (pu-server). All external requests go through Caddy gateway on port 443.

10. **Gateway routing:** External requests must use `?XTransformPort=3001` query parameter to reach mini services. Never hardcode ports in frontend URLs.

11. **`mounted` flag:** Critical for hydration. `page.tsx` returns `null` until `hydrate()` runs. Never render anything before `mounted = true`.

12. **Auth error handling:** Auth-related errors (401, network, timeout) are intentionally NOT shown as global errors. Components handle them inline.

13. **Password in response:** All API routes that return User objects exclude the `password` field using destructuring: `const { password: _, ...safeUser } = user`.

14. **next.config.ts:** `typescript.ignoreBuildErrors: true` and `reactStrictMode: false` are set. `allowedDevOrigins` includes `space.z.ai` patterns for cross-origin preview.

---

## APPENDIX A: QUICK START CHECKLIST

When starting fresh with this project:

```bash
# 1. Install dependencies
bun install

# 2. Setup database
bun run db:push

# 3. Seed demo accounts
curl -X POST http://localhost:3000/api/auth/seed

# 4. Seed quiz data (need auth first)
TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@pu.edu","password":"admin123"}' | jq -r .token)
curl -X POST http://localhost:3000/api/quiz/seed \
  -H "Authorization: Bearer $TOKEN"

# 5. Start dev server
bun run dev

# 6. Start mini services (if needed)
cd mini-services/chat-service && bun run dev &
cd mini-services/battle-service && bun run dev &
```

## APPENDIX B: ADDING A NEW FEATURE (TEMPLATE)

### Example: Adding a "Resources" page

1. **Create page component:** `src/components/pages/ResourcesPage.tsx`
2. **Add PageView type:** `| 'resources'` to `src/store/app.ts`
3. **Add route case:** `case 'resources': return <ResourcesPage />;` in `AppLayout.tsx`
4. **Add nav item:** `{ page: 'resources', label: 'Resources', icon: <FolderOpen /> }` in SidebarNav
5. **Create API route:** `src/app/api/resources/route.ts`
6. **Add React Query hook:** `useResources()` in `src/lib/hooks/use-queries.ts`
7. **Add RBAC permission:** If restricted, add to `rbac.ts`

---

**END OF DOCUMENT**

*This document was generated to provide complete project context for AI assistant handoff. Every file, function, API route, database model, and architectural decision has been documented.*
