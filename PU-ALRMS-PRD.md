# PU-ALRMS — Complete Product Requirements Document (PRD)
## ChatGPT Handoff Document — Production-Ready

**Project:** Prime University Academic Learning & Resource Management System  
**Short Name:** PU-ALRMS  
**Version:** 0.2.0 (Pre-Production)  
**Live URL:** https://prime-alrms.vercel.app  
**GitHub:** https://github.com/azmainwork0011/pu-alrms  
**Author:** Jain Azmain (CSE 66 Batch)  
**Date:** June 2025  

---

## TABLE OF CONTENTS

1. [Executive Summary](#1-executive-summary)
2. [Technology Stack](#2-technology-stack)
3. [Authentication & User Roles](#3-authentication--user-roles)
4. [Database Schema](#4-database-schema)
5. [Pages & Features (17 Pages)](#5-pages--features)
6. [API Routes (70+ Endpoints)](#6-api-routes)
7. [Application Architecture](#7-application-architecture)
8. [AI System](#8-ai-system)
9. [Gamification System](#9-gamification-system)
10. [Shared Infrastructure](#10-shared-infrastructure)
11. [Key Technical Notes (MUST READ)](#11-key-technical-notes-must-read)
12. [Known Issues & Bugs](#12-known-issues--bugs)
13. [Pending Work & Feature Requests](#13-pending-work--feature-requests)
14. [Deployment Configuration](#14-deployment-configuration)
15. [Chat Z AI Automated Improvement Prompt Kit](#15-chat-z-ai-automated-improvement-prompt-kit)
16. [File Structure](#16-file-structure)
17. [Summary Statistics](#17-summary-statistics)

---

## 1. Executive Summary

PU-ALRMS is a comprehensive full-stack academic management platform built for Prime University. It provides assignment management, lab report handling, AI-powered chat assistant, gamified coding education (Learn with Games / Code Quest), quiz system with battle mode, real-time community chat, digital library, announcements, notifications, and a complete admin panel.

The app is a **single-page application (SPA)** built with Next.js 16, TypeScript, Tailwind CSS 4, shadcn/ui components, Prisma ORM with SQLite, and Zustand state management. It uses an in-memory JWT auth system with fallback to hardcoded demo accounts.

**Current Status:** Pre-production. Core features are functional but several critical bugs remain unfixed and performance optimizations are needed.

---

## 2. Technology Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| **Framework** | Next.js (App Router) | 16.1.1 |
| **Language** | TypeScript | 5 |
| **Styling** | Tailwind CSS + shadcn/ui (New York style) | 4 |
| **State Management** | Zustand (client), TanStack React Query (server) | 5 / 5.82 |
| **Database** | SQLite via Prisma ORM + libsql | 6.11 |
| **Animations** | Framer Motion | 12 |
| **Icons** | Lucide React | latest |
| **Real-time Chat** | Socket.IO Client + Mini Service (Port 3003) | latest |
| **AI Integration** | z-ai-web-dev-sdk (LLM, VLM, Image Gen, Web Search) | latest |
| **Authentication** | JWT (jsonwebtoken) + bcryptjs (dual strategy) | latest |
| **Forms** | React Hook Form + Zod | 4 |
| **Markdown** | react-markdown + react-syntax-highlighter | latest |
| **Image Processing** | react-easy-crop + sharp (server-side) | latest |
| **Charts** | Custom CSS/Framer Motion, Recharts available | - |
| **Notifications** | Sonner (toast) | latest |
| **Date** | date-fns | latest |
| **Deployment** | Vercel (Serverless) | - |
| **Theme** | next-themes (light/dark mode) | latest |

**50+ dependencies** including 20+ Radix UI primitives, dnd-kit, mdx-editor, uuid, openai, socket.io-client, vaul, embla-carousel-react.

---

## 3. Authentication & User Roles

### 3.1 Auth System
- **Dual-strategy login:** Tries database (bcrypt) first, falls back to 11 hardcoded demo accounts
- **JWT tokens** with 7-day expiry, embedded role/userId/email in payload
- **Client-side token expiry check** in Zustand `hydrate()` — 30s buffer before actual expiry
- **Auth expiry event:** `window.dispatchEvent(new Event('auth-expired'))` triggers auto-logout
- **Auto-seed:** `/api/auth/seed` called on auth page mount
- **Quick Demo:** "Try Demo" button logs in as `alice@stu.pu.edu`

### 3.2 Demo Accounts (11 accounts)

| Email | Password | Role |
|-------|----------|------|
| admin@pu.edu | admin123 | SUPER_ADMIN |
| superadmin@pu.edu | superadmin2024 | SUPER_ADMIN |
| teacher@pu.edu | teacher123 | TEACHER |
| cr@pu.edu | dev123 | CR |
| student@pu.edu | student123 | STUDENT |
| dev@pu.edu | dev123 | DEVELOPER |
| alice@stu.pu.edu | student123 | STUDENT |
| bob@stu.pu.edu | student123 | STUDENT |
| carol@stu.pu.edu | student123 | STUDENT |
| david@stu.pu.edu | student123 | STUDENT |
| eve@stu.pu.edu | student123 | STUDENT |

### 3.3 Registration
- Open registration for STUDENT and TEACHER roles only
- Name validation (regex: `[a-zA-Z0-9\s\-'.]`, min 2 chars)
- Email validation, password strength meter (4 levels)

### 3.4 Role Hierarchy & RBAC
**Levels:** SUPER_ADMIN (100) > ADMIN (80) > DEVELOPER (70) > TEACHER (50) > CR (30) > STUDENT (20)

**31 Permissions across domains:**
- **Admin:** admin:access, admin:users:list/modify, admin:stats/view, admin:logs:view
- **Assignment:** assignment:view/create/edit/delete
- **Submission:** submission:view/create/grade
- **Announcement:** announcement:view/create/edit/delete
- **Chat:** chat:access, chat:send
- **Quiz:** quiz:view, quiz:play
- **Profile:** profile:view, profile:edit
- **AI:** ai:chat, ai:generate
- **Books:** books:view, books:save
- **Leaderboard:** leaderboard:view
- **Dashboard:** dashboard:view, dashboard:admin
- **Notifications:** notification:view, notification:manage
- **Subjects:** subject:view/create, subject:edit

**RBAC Middleware:** `authenticateRequest()`, `requirePermission()`, `requireMinRole()`, `checkPageAccess()` in `src/lib/rbac.ts`

---

## 4. Database Schema

**Database:** SQLite via Prisma ORM + `@prisma/adapter-libsql`  
**18 Models total:**

| Model | Key Fields | Description |
|-------|-----------|-------------|
| **User** | id, name, email, password, role, verified, status, avatar, coverPhoto, rollNumber, batch, department, phone, bio, lastLogin | Core user model |
| **Subject** | id, name, code, teacherId, batch | Academic subjects |
| **Assignment** | id, title, description, subjectId, type, batch, deadline, fileUrl, status, createdBy | Assignments & lab reports |
| **Submission** | id, assignmentId, studentId, fileName, fileUrl, status, marks, feedback | Student submissions |
| **Comment** | id, assignmentId, userId, content | Assignment comments |
| **Notification** | id, userId, title, message, type, isRead | User notifications |
| **Announcement** | id, title, message, type, priority, createdBy | System announcements |
| **ChatRoom** | id, name, type, batch, department, isPrivate, roomPassword, encryptionKey, status, maxMembers, allowFiles | Chat rooms |
| **ChatMessage** | id, roomId, userId, content, messageType, fileUrl, fileName | Chat messages |
| **QuizCategory** | id, name, department, icon, difficulty, isActive | Quiz categories |
| **QuizQuestion** | id, categoryId, question, optionA/B/C/D, correctOption, difficulty, points | Quiz questions |
| **QuizAttempt** | id, userId, categoryId, score, totalPoints, correctCount, accuracy, timeTaken | Quiz attempts |
| **QuizProfile** | id, userId, totalXP, dailyStreak, bestStreak, totalQuizzes | Quiz XP profile |
| **SavedBook** | id, userId, bookId, title, authors, coverUrl, pdfLink | Saved books (unique: userId+bookId) |
| **BattleRoom** | id, player1Id, player2Id, categoryId, status, scores | Quiz battle rooms |
| **CQProfile** | id, userId, level, totalXP, battlesWon/Lost, lessonsCompleted | Code Quest profile |
| **CQFriend** | id, userId, friendId, status | Code Quest friends (unique: userId+friendId) |
| **CQBattleSession** | id, player1Id, player2Id, language, status, HP, scores | Code Quest battles |

---

## 5. Pages & Features

### 5.1 Authentication Page (`AuthPage.tsx`)
- Login/Register toggle with animated tab switching
- Dark theme with animated gradient background (emerald/teal/cyan glow)
- Password visibility toggle, strength meter
- Quick "Try Demo" button
- Network error detection, graceful error messages
- Auto-seeds database on mount

### 5.2 Dashboard (`DashboardPage.tsx`)
- **Role-adaptive layout** with 3 distinct views:
  - **Student/CR:** Pending assignments, submitted count, avg grade, completion rate, weekly chart, upcoming deadlines, recent submissions, subject progress
  - **Teacher:** Created assignments, submissions, pending grading, avg marks, submission trend, subjects list, grading CTA
  - **Admin:** Total users, assignments, submissions, ungraded count, activity trend, top students, role distribution
- Welcome banner with time-aware greeting, avatar, role badge
- Quick actions (6 role-specific horizontal scrollable buttons with gradient styling)
- Custom bar chart (pure CSS/Framer Motion, no charting library)
- Scroll reveal animations via IntersectionObserver
- React Query `useDashboard()` with 60s cache

### 5.3 Assignments & Lab Reports (`AssignmentsPage.tsx`)
- Dual-purpose: handles both ASSIGNMENT and LAB_REPORT via `type` prop
- List view with search, subject filter, status counts
- Role features: Students (view/submit), Teachers/Admin/CR (create/edit/duplicate/delete)
- Overdue detection, pagination

### 5.4 Assignment Detail (`AssignmentDetailPage.tsx`)
- Full assignment view, student submission, teacher grading
- Comments section

### 5.5 Create Assignment (`CreateAssignmentPage.tsx`)
- Rich text form: Title, Description, Subject, Type, Deadline, File upload
- Accessible to TEACHER, ADMIN, DEVELOPER

### 5.6 Submissions Page (`SubmissionsPage.tsx`)
- Teacher/Admin view, filter by assignment/status/student, inline grading

### 5.7 AI Chat (`AIChatPage.tsx`) — **Chat Z AI**
- **Three modes:**
  1. **Single Chat:** 8 AI models (GPT-4o, Claude 3.5 Sonnet, Gemini 1.5 Pro, LLaMA 3.1 405B, Mistral Large, GPT-5, Claude 4 Opus, Gemini 2.0 Flash)
  2. **Battle Mode:** Compare 2-3 AI models side-by-side, blind voting, model reveal
  3. **Image Generation:** Text-to-image via z-ai-web-dev-sdk
- **Smart Scanner:** Upload image + question → AI vision analysis
- **Markdown rendering** with syntax highlighting
- Copy & Regenerate buttons on AI messages
- 6 quick prompt suggestions on welcome screen
- Bangla & English support
- **Wrapped in ErrorBoundary**
- **CRITICAL:** Uses `role: 'assistant'` for system prompts, NOT `role: 'system'`

### 5.8 Quiz (`QuizPage.tsx`)
- **KBC-style quiz** (Kaun Banega Crorepati theming)
- 5 departments: All Topics, CSE, LLB, EEE, BBA
- 14-level prize ladder (₹1,000 to ₹7,00,00,000)
- 5 hearts/lives, 30s timer per question
- 3 lifelines: 50/50, Skip, Extra Time (+10s)
- XP system with combo multiplier (streak)
- Confetti on correct answers
- 15+ synthesized sound effects via Web Audio API
- Persistent profile with XP, daily streak, best streak

### 5.9 Quiz Battle (`BattlePage.tsx`)
- **Two modes:** Solo vs Bot, PvP (Create/Join Room)
- Solo: AI bot with 40-60% accuracy
- 10 questions, 15 seconds per question
- Animated VS screen (3-2-1-FIGHT!), HP bars, particle effects
- Sound effects, bot thinking animation

### 5.10 Learn with Games / Code Quest (`LearnWithGame.tsx`)
- **12 mini-games in one component (~1400 lines):**
  1. **Learn Quiz** — Language → Topic → MCQ quiz
  2. **Code Battle** — VS AI bot with HP bars, rounds, damage
  3. **Bug Detective** — Find the buggy line in code (4 challenges)
  4. **Code Puzzle** — Rearrange scrambled code lines (4 puzzles)
  5. **Syntax Match** — Match concepts to syntax (30 pairs, 5 languages)
  6. **Memory Match** — Flip cards to match concept ↔ definition
  7. **Typing Race** — Type code as fast as possible (WPM scoring)
  8. **Speed Quiz** — Rapid-fire timed questions with streak multiplier
  9. **Output Predictor** — Read code, predict output
  10. **Code Fill** — Fill blanks in code templates
  11. **Pattern Master** — Number sequence patterns
  12. **Daily Challenge** — Seeded daily quiz with bonus XP
- **5 programming languages:** Python, JavaScript, Java, C++, TypeScript
- **55+ questions** across 13+ topics
- **XP system:** 20 levels from "Code Novice" to "Legendary Coder"
- Profile with avatar, stats, badges, leaderboard
- Wrapped in ErrorBoundary

### 5.11 Announcements (`AnnouncementsPage.tsx`)
- Full CRUD (TEACHER+)
- 5 types: GENERAL, URGENT, ASSIGNMENT, EXAM, RESULT
- 3 priority levels: NORMAL, HIGH, CRITICAL (with visual indicators)
- Auto-notifies all students on creation

### 5.12 Student Community Chat (`StudentCommunityPage.tsx`)
- Real-time WebSocket chat via Socket.IO (port 3003 mini-service)
- Multiple chat rooms (BATCH, SUBJECT, GENERAL)
- Room switching, online users, typing indicators
- Image/file sharing, role badges, auto-reconnection
- Notification sound when chat not visible

### 5.13 Books / Digital Library (`BooksPage.tsx`)
- Google Books + Open Library API search
- 7 categories + saved books tab
- Grid view with covers, ratings, save/unsave, detail modal
- Embedded reader, PDF download, infinite scroll
- Language toggle (English/Bengali)

### 5.14 Profile (`ProfilePage.tsx`)
- Cover photo + Avatar with gradient fallbacks
- Image upload with crop (react-easy-crop)
- Profile editing: Name, Roll, Batch, Department, Phone, Bio
- Role-specific styling & stats
- Notification sound settings (currently stubbed)

### 5.15 Notifications (`NotificationsPage.tsx`)
- List with read/unread distinction
- Mark single/all as read
- Unread count sync to header badge
- Sound on new notifications (stubbed)
- **⚠️ KNOWN BUG: Can crash under certain conditions**

### 5.16 Leaderboard (`LeaderboardPage.tsx`)
- Displays top users by quiz performance
- Currently uses mock/static data

### 5.17 Admin Panel (`AdminPanelPage.tsx`)
- **SUPER_ADMIN only**
- 5 tabs: Overview, User Management, Developer Access, System Settings, System Logs
- Stats, role distribution chart, recent logins
- User search/filter, role change, suspend/ban/activate
- DB reseed capability

---

## 6. API Routes

### 6.1 Auth (`/api/auth/*`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | Login (DB + hardcoded fallback) |
| POST | `/api/auth/register` | Register (STUDENT/TEACHER) |
| POST | `/api/auth/seed` | Seed demo data |
| GET | `/api/auth/profile` | Get user profile |
| PUT | `/api/auth/profile` | Update profile (JSON or FormData) |
| PUT | `/api/auth/profile/photo` | Upload avatar/cover (Sharp, base64) |
| DELETE | `/api/auth/profile/photo` | Remove photo |

### 6.2 AI (`/api/ai/*`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/ai/chat` | Chat (single/battle), 60s timeout |
| PUT | `/api/ai/chat` | Vote in battle, reveals models |
| DELETE | `/api/ai/chat` | Clear chat history |
| POST | `/api/ai/scan` | Vision AI image analysis |
| POST | `/api/ai/search` | Web search |
| POST | `/api/ai/generate-image` | Text-to-image |
| GET/POST/DELETE | `/api/ai/token` | AI token management |

### 6.3 Assignments (`/api/assignments/*`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/assignments` | List (filter: type, subject, status) |
| POST | `/api/assignments` | Create |
| GET | `/api/assignments/[id]` | Get with submissions |
| PUT | `/api/assignments/[id]` | Update |
| DELETE | `/api/assignments/[id]` | Soft-delete (archive) |

### 6.4 Submissions (`/api/submissions/*`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/submissions` | List (filter: assignment, student) |
| POST | `/api/submissions` | Submit (students only) |
| PUT | `/api/submissions/[id]/grade` | Grade (teachers only) |

### 6.5 Announcements (`/api/announcements/*`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/announcements` | List |
| POST | `/api/announcements` | Create (TEACHER+) |
| GET | `/api/announcements/[id]` | Get single |
| PUT | `/api/announcements/[id]` | Update |
| DELETE | `/api/announcements/[id]` | Delete |

### 6.6 Notifications (`/api/notifications/*`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/notifications` | List (paginated) |
| POST | `/api/notifications` | Mark all read |
| PUT | `/api/notifications/[id]/read` | Mark single read |

### 6.7 Quiz (`/api/quiz/*`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/quiz/categories` | List categories |
| GET | `/api/quiz/questions` | Get questions |
| POST | `/api/quiz/questions` | Submit/ create questions |
| GET | `/api/quiz/attempts` | Attempt history |
| POST | `/api/quiz/attempt` | Submit attempt |
| GET/PUT | `/api/quiz/profile` | XP profile |
| GET | `/api/quiz/leaderboard` | Leaderboard |
| GET/POST | `/api/quiz/battle` | Battle rooms |
| POST | `/api/quiz/seed` | Seed data |

### 6.8 Code Quest (`/api/cq/*`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET/POST | `/api/cq/profile` | CQ profile (20-level progression) |
| GET | `/api/cq/leaderboard` | Top 50 |
| GET/POST | `/api/cq/battle` | Battle sessions |
| GET/POST | `/api/cq/friends` | Friend management |

### 6.9 Admin (`/api/admin/*`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/stats` | System statistics |
| GET | `/api/admin/logs` | Activity logs |
| GET/PUT | `/api/admin/users` | User management |

### 6.10 Other Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/dashboard` | Role-based dashboard |
| GET/POST | `/api/subjects` | Subject CRUD |
| GET | `/api/batches` | List batches |
| GET | `/api/leaderboard` | Global leaderboard |
| GET/POST | `/api/comments` | Comments |
| GET | `/api/books/search` | Google Books + Open Library |
| GET/POST/DELETE | `/api/books/saved` | Saved books |
| GET/POST/PUT/DELETE | `/api/chat/rooms` | Chat room CRUD |
| POST | `/api/chat/rooms/join` | Join room |
| GET/POST | `/api/chat/messages` | Messages |
| GET | `/api` | Health check |

**Total: ~70+ HTTP endpoints across 43 route files**

---

## 7. Application Architecture

### 7.1 SPA Pattern
- **Entire app is a single-page application.** `page.tsx` conditionally renders `AuthPage` or `AppLayout` based on Zustand auth state.
- Navigation is done via `setPage()` — no URL changes for pages.
- No deep linking, no browser back button support.

### 7.2 Navigation Structure
**Sidebar sections:**
- **Main:** Dashboard, Admin Panel (SUPER_ADMIN)
- **Academic:** Assignments, Lab Reports, Create Assignment (TEACHER+), Submissions, Leaderboard (STUDENT/CR/ADMIN)
- **Communication:** Announcements, Community Chat
- **Learning:** Quick Quiz, Learn with Games, Digital Library
- **Tools:** AI Assistant
- **Account:** Notifications, Profile

### 7.3 State Management
**Zustand Store** (`src/store/app.ts`):
- Auth: `user`, `token`, `isAuthenticated`, `mounted`
- Navigation: `currentPage` (15+ page views), `selectedAssignmentId`
- UI: `sidebarOpen`, `notificationCount`
- Actions: `setAuth`, `updateUser`, `logout`, `setPage`, `setAssignmentId`, `hydrate`

**React Query** (`src/lib/hooks/use-queries.ts`):
- 30+ hooks: Dashboard (60s), Assignments (30s), Submissions (30s), Subjects (60s), Batches (60s), Notifications (15s), Leaderboard (60s), Announcements (30s), Quiz (30-60s), Books (30-60s), Auth Profile (2min)
- Offline-first network mode, no refetch on window focus

### 7.4 Theme System
- Light/Dark mode via next-themes
- Emerald/teal/cyan color scheme
- Role-specific gradients (Student=amber, Teacher=emerald, Admin=rose, CR=violet, SuperAdmin=emerald-cyan)

### 7.5 Error Handling
- React ErrorBoundary wrapping AI and Code Quest pages
- Global error handler in `page.tsx` filtering expected errors
- Silent error logging for expected auth/network errors
- CSS-only loading overlay to prevent hydration mismatches

---

## 8. AI System

### 8.1 AI Chat Backend (`/api/ai/chat`)
- Uses `z-ai-web-dev-sdk` — unified gateway to multiple AI models
- **8 AI models:** GPT-4o, Claude 3.5 Sonnet, Gemini 1.5 Pro, LLaMA 3.1 405B, Mistral Large, GPT-5, Claude 4 Opus, Gemini 2.0 Flash
- **Single mode:** Conversation history maintained per user+model (max 20 messages)
- **Battle mode:** Parallel calls to 2-3 models, shuffled responses, user votes, reveal
- **Auto Bangla detection** — responds in Bangla if Bangla text detected
- **Response anonymization** — strips AI identity reveals
- Rate limited: 30 req/min
- SDK accessed via `zai.create()` and `zai.createVision()`

### 8.2 Image Generation
- Prepend `"High quality illustration:"` to prompt
- Fixed 1024×1024, returns base64 data URL
- Rate limited: 5 req/min

### 8.3 Vision Scanner
- Base64 image + question → vision model
- Structured prompt (Description, Answer, Context)
- Rate limited: 10 req/min

### 8.4 Web Search
- `zai.functions.invoke('web_search')`
- 10 max results with position, title, URL, snippet
- Rate limited: 15 req/min

---

## 9. Gamification System

### 9.1 Quiz Gamification
- XP system with combo multiplier (streak)
- Daily streak tracking (resets if gap > 1 day)
- 5 hearts/lives, 3 lifelines
- KBC-style prize ladder
- Sound effects (15+ synthesized)
- Profile persistence via `/api/quiz/profile`

### 9.2 Code Quest Gamification
- 20-level progression system:
  - Level 1: Code Novice (0 XP)
  - Level 2: Code Apprentice (100 XP)
  - ...
  - Level 20: Legendary Coder (35,000 XP)
- XP rewards: Win battle = 50 + score; Loss = 10 + score
- 20 rank titles auto-assigned by level
- Daily streak, battles won/lost, lessons completed
- Friend system (send/accept/remove)

---

## 10. Shared Infrastructure

### 10.1 UI Components (55+ shadcn/ui)
All in `src/components/ui/`: accordion, alert, alert-dialog, avatar, badge, button, calendar, card, carousel, checkbox, command, dialog, drawer, dropdown-menu, form, input, label, menubar, pagination, popover, progress, scroll-area, select, separator, sheet, sidebar, skeleton, slider, sonner, switch, table, tabs, textarea, toast, tooltip, image-crop-dialog (custom), etc.

### 10.2 Custom Components
- `ErrorBoundary` — React class component, uses `setPage('dashboard')` for recovery
- `LoadingOverlay` — Full-page loading state
- `PageTransition` — Framer Motion page transitions
- `pu-helpers.tsx` — `getInitials()`, `AnimatedCounter`, `timeAgo()`, `getPasswordStrength()`, `isValidEmail()`, `playNotificationSound()`, `DashboardSkeleton`, `getStatusColor()`, `safeFormat()`

### 10.3 Utility Libraries
| File | Purpose |
|------|---------|
| `src/lib/api.ts` | API client (fetch wrapper, retry, timeout, 12 API namespaces) |
| `src/lib/rbac.ts` | Role-based access control (31 permissions, 6 roles) |
| `src/lib/security/rate-limit.ts` | In-memory rate limiter (returns `{ allowed, retryAfterMs }`) |
| `src/lib/jwt.ts` | JWT creation/verification |
| `src/lib/db.ts` | Prisma client singleton |
| `src/lib/api-cache.ts` | In-memory TTL cache |
| `src/lib/zai.ts` | z-ai-web-dev SDK wrapper |
| `src/lib/cq-data.ts` | Code Quest game data (55+ questions, 13 topics, 5 languages) |
| `src/lib/quiz-sounds.ts` | 15+ synthesized sound effects via Web Audio API |
| `src/lib/hooks/use-queries.ts` | 30+ React Query hooks |
| `src/lib/query-client.ts` | Query key factory |
| `src/lib/chat-encryption.ts` | Chat encryption (stub) |
| `src/lib/notification-sound.ts` | Notification sounds (stub) |
| `src/lib/ai-token.ts` | AI token management (stub) |

### 10.4 Mini Service
- **Chat Service** (Port 3003): Socket.IO server for real-time community chat
  - File: `mini-services/chat-service/`
  - Supports rooms, messages, typing indicators, online users
  - Frontend connects via `io('/?XTransformPort=3003')`

---

## 11. Key Technical Notes (MUST READ)

### ⚠️ 11.1 z-ai-web-dev-sdk (CRITICAL)
- System prompts MUST use `role: 'assistant'`, NOT `role: 'system'`
- SDK accessed via `zai.create()` and `zai.createVision()`
- **Backend only** — MUST NOT be imported on client side
- SDK file: `src/lib/zai.ts`

### ⚠️ 11.2 Rate Limiter
- Returns `{ allowed: boolean, retryAfterMs: number }` — NOT a plain boolean
- File: `src/lib/security/rate-limit.ts`
- This was a bug that was fixed — do not revert

### ⚠️ 11.3 API Client
- `apiFetch<T>()` with timeout, retry (MAX_RETRIES=1), auth headers
- Auth endpoints don't trigger auth-expired on 401
- Other 401s trigger `handleAuthExpired()`
- Upload timeout: 60s, Default: 30s, Auth: 20s
- 401 error handling sends `auth-expired` event

### ⚠️ 11.4 ErrorBoundary
- Uses Zustand `setPage('dashboard')` for navigation on error
- **Do NOT use `window.location.hash`** — that was a bug that was fixed
- File: `src/components/ErrorBoundary.tsx`

### ⚠️ 11.5 Demo Mode
- Demo mode code has been **removed** from `api.ts` and `rbac.ts`
- Do NOT re-add `demoGuard()` or `hiddenForDemo` — those were blocking login

### ⚠️ 11.6 Gateway & API Requests
- Only port 3000 exposed externally (via Caddy gateway)
- For cross-port requests, use `XTransformPort` query parameter
- Example: `fetch('/api/test?XTransformPort=3030')`
- WebSocket: `io('/?XTransformPort=3003')`
- **NEVER use absolute URLs with port numbers**
- **NEVER use `io('http://localhost:3003')`**

### 11.7 Debug Logging Convention
- Use prefixes: `[AI]`, `[AIChat]`, `[AIChat Battle]` for DevTools filtering

### 11.8 Vercel Deployment
- SQLite is **not persistent** on Vercel serverless — cold starts reset DB
- Each cold start requires re-seeding via `/api/auth/seed`
- Build script runs `prisma generate` + `next build`

---

## 12. Known Issues & Bugs

### 🔴 12.1 CRITICAL (Not Fixed)
1. **Duplicate login bug:** Some demo accounts share the same password (`student123`, `dev123`), causing potential login confusion. The login route has a collision check but may not handle all edge cases.
2. **Profile/Cover photo save:** Photos uploaded via Sharp (processed as base64 data URLs) may not persist properly after page refresh or DB cold start on Vercel.
3. **Notification crash:** NotificationsPage.tsx can crash under certain conditions (likely null/undefined handling issues with notification data).
4. **AI chat slow response:** No streaming implemented. Full response must complete before displaying. Multiple retry attempts add latency.

### 🟡 12.2 HIGH (Not Fixed)
5. **Page loading speed:** Dashboard, Assignment, Lab Report, Announcement, Quiz, Battle, AI pages all load slowly.
6. **No code splitting:** All 15+ page components are eagerly imported in AppLayout.tsx.
7. **Large monolithic components:** LearnWithGame (~1400+ lines, 50+ useState), QuizPage (~900+ lines), AIChatPage (~800+ lines).
8. **No URL-based routing:** All navigation is state-based. No deep linking, no browser back button.

### 🟢 12.3 MEDIUM (Not Fixed)
9. **AI Chat optimization needed:** Reduce retries 3→1, remove auto web search, reduce system prompt size, implement streaming, add dynamic prompts, smart caching, graceful fallback.
10. **Persistent XP/progress** resets on page navigation in Learn with Games.
11. **Leaderboard uses mock data** — not connected to real quiz/battle results.
12. **Naming inconsistency:** "PU ALRMS" vs "PU Alarms" vs "PU-ALRMS" across the app.
13. **Quiz prize amounts in Indian Rupees** (regional limitation).
14. **No password change** or email verification UI.
15. **No offline support.**

### ⚪ 12.4 Stubbed Features (No-op)
- `chat-encryption.ts` — no-op passthrough
- `audit-logger.ts` — no-op
- `notification-sound.ts` — no sound playback
- `quiz-sounds.ts` — uses Web Audio API (functional but basic)

---

## 13. Pending Work & Feature Requests

### 🔴 PRIORITY 1 — Critical Bugs
| # | Task | Description | Status |
|---|------|-------------|--------|
| 1 | Fix duplicate login bug | Same password for multiple accounts causing issues | ❌ Not Started |
| 2 | Fix profile/cover photo save | Photos don't persist after refresh | ❌ Not Started |
| 3 | Fix notification crash | NotificationsPage crashes on access | ❌ Not Started |
| 4 | Fix AI chat slow response | No streaming, large system prompts, retries | ❌ Not Started |

### 🟡 PRIORITY 2 — Performance & UX
| # | Task | Description | Status |
|---|------|-------------|--------|
| 5 | Optimize page loading speed | Dashboard, assignment, quiz, AI pages load slowly | ❌ Not Started |
| 6 | Add code splitting / lazy loading | Dynamic imports for page components | ❌ Not Started |
| 7 | Refactor large components | Split LearnWithGame, QuizPage, AIChatPage | ❌ Not Started |

### 🟢 PRIORITY 3 — Features & Improvements
| # | Task | Description | Status |
|---|------|-------------|--------|
| 8 | Add coding learning games | Many more coding games to "Learn with Games" | ❌ Not Started |
| 9 | Standardize naming | "PU ALRMS" vs "PU Alarms" → standardize | ❌ Not Started |
| 10 | Real leaderboard data | Connect to actual quiz/battle results | ❌ Not Started |
| 11 | Persistent XP progress | Save Code Quest XP across sessions | ❌ Not Started |
| 12 | AI chat optimization rewrite | Streaming, dynamic prompts, caching, fallback | ❌ Not Started |

### ⚪ PRIORITY 4 — Nice to Have
| # | Task | Description | Status |
|---|------|-------------|--------|
| 13 | URL-based routing | Add Next.js file-based routing for deep linking | ❌ Not Started |
| 14 | Password change / reset | Forgot password flow | ❌ Not Started |
| 15 | Email verification | Verify email on registration | ❌ Not Started |
| 16 | Offline support | Service worker for offline access | ❌ Not Started |
| 17 | Push to GitHub & deploy | After fixes complete | ❌ Not Started |

---

## 14. Deployment Configuration

### 14.1 Vercel
- **Token:** `(set in Vercel project settings)`
- **Build:** `prisma generate && next build`
- **Framework:** Next.js (auto-detected)

### 14.2 GitHub
- **Repo:** `azmainwork0011/pu-alrms`
- **Token:** `(set in GitHub account settings)` (Classic)

### 14.3 Environment Variables
```
DATABASE_URL=<libsql URL>
JWT_SECRET=<secret>
OPENAI_API_KEY=<key>
ZAI_TOKEN=<token>
```

### 14.4 Important Notes
- SQLite is ephemeral on Vercel serverless — resets on cold start
- Auto-seed via `/api/auth/seed` on every auth page mount
- Photos stored as base64 data URLs in DB — not suitable for production scale

---

## 15. Chat Z AI Automated Improvement & Deployment Prompt Kit

When asking Chat Z AI to fix bugs, add features, or optimize the PU-ALRMS project, use this structured template:

### Step 0: How to Use
1. Copy the template below
2. Replace `[square brackets]` with your specific request
3. Paste into Chat Z AI
4. AI will generate: Fix/enhancement code, test suggestions, commit instructions, deployment steps

### Template

```
==========================================
🔹 TASK DETAILS
==========================================
[Task Type]: Bug Fix / Feature Request / Optimization
[Title]: [Short descriptive title]
[Module]: [Affected module/page: AI Chat, Quiz, Assignments, LearnWithGame, etc.]
[Severity]: Low / Medium / High / Critical
[Description]: [Detailed description of the problem or requested improvement]
[Current Behavior]: [What currently happens]
[Expected Behavior]: [What you want to happen]
[Constraints]:
- Maintain current API structure
- Keep RBAC role-based access
- Use shadcn/ui components
- Follow existing code style
- z-ai-web-dev-sdk: use role:'assistant' for system prompts
- Rate limiter returns { allowed, retryAfterMs }
- ErrorBoundary uses setPage('dashboard') NOT window.location.hash
- No demo mode code (removed)
- No absolute URLs with ports (use XTransformPort)
[Deployment]: Yes / No
[Priority]: High / Medium / Low

==========================================
🔹 OUTPUT EXPECTATION
==========================================
1. Code Fix / Enhancement (full snippets, file paths, comments)
2. Test Cases (unit/integration, edge cases)
3. Commit & GitHub Instructions (branch, commit message, push)
4. Deployment Instructions (Vercel deploy commands)
5. Performance / UX Recommendations
6. Next Improvement Suggestions (3-5 prioritized items)
```

### Example Usage
```
==========================================
🔹 TASK DETAILS
==========================================
[Task Type]: Bug Fix
[Title]: AI chat slow response
[Module]: AI Chat
[Severity]: High
[Description]: Chat responses take 5-10 seconds. No streaming.
[Current Behavior]: AI waits for full response before sending to user.
[Expected Behavior]: Streaming responses with low latency.
[Constraints]: Must support Battle Mode and image generation.
[Deployment]: Yes
[Priority]: High
```

### Auto Workflow (if Deployment: Yes)
```bash
git checkout -b fix/ai-chat-streaming
git add .
git commit -m "fix(AI Chat): enable streaming responses"
git push origin fix/ai-chat-streaming
vercel --prod --confirm
```

---

## 16. File Structure

```
src/
├── app/
│   ├── layout.tsx              # Root layout (ThemeProvider, ApiProvider, Toaster)
│   ├── page.tsx                # Entry (Auth/App routing)
│   ├── not-found.tsx           # 404 → redirect to /
│   ├── globals.css             # Global styles
│   └── api/                    # 43 route files (~70+ endpoints)
│       ├── auth/               # login, register, seed, profile, photo
│       ├── ai/                 # chat, scan, search, generate-image, token
│       ├── assignments/        # CRUD + [id]
│       ├── submissions/        # list, create, grade
│       ├── announcements/      # CRUD + [id]
│       ├── notifications/      # list, mark-read
│       ├── quiz/               # categories, questions, profile, battle, leaderboard
│       ├── cq/                 # profile, leaderboard, battle, friends
│       ├── admin/              # stats, users, logs
│       ├── books/              # search, saved
│       ├── chat/               # rooms, messages, join
│       ├── dashboard/          # stats
│       ├── subjects/           # list, create
│       ├── batches/            # list
│       ├── leaderboard/        # get
│       ├── comments/           # list, create
│       └── route.ts            # health check
├── components/
│   ├── layout/
│   │   ├── AppLayout.tsx       # Main SPA shell (sidebar + header + routing, 373 lines)
│   │   └── LoadingOverlay.tsx
│   ├── pages/                  # 17 page components
│   │   ├── AuthPage.tsx        # Login/Register
│   │   ├── DashboardPage.tsx   # Role-adaptive dashboard
│   │   ├── AssignmentsPage.tsx # Assignments & Lab Reports
│   │   ├── AssignmentDetailPage.tsx
│   │   ├── CreateAssignmentPage.tsx
│   │   ├── SubmissionsPage.tsx
│   │   ├── AIChatPage.tsx      # Chat Z AI (single/battle/image)
│   │   ├── QuizPage.tsx        # KBC-style quiz
│   │   ├── BattlePage.tsx      # Quiz battle
│   │   ├── LearnWithGame.tsx   # 12 mini-games (~1400 lines)
│   │   ├── AnnouncementsPage.tsx
│   │   ├── StudentCommunityPage.tsx
│   │   ├── BooksPage.tsx
│   │   ├── ProfilePage.tsx
│   │   ├── NotificationsPage.tsx
│   │   ├── LeaderboardPage.tsx
│   │   └── AdminPanelPage.tsx
│   ├── ui/                     # 55+ shadcn/ui components
│   ├── ErrorBoundary.tsx
│   ├── pu-helpers.tsx
│   └── theme-provider.tsx
├── store/
│   └── app.ts                  # Zustand store
├── lib/
│   ├── api.ts                  # API client (12 namespaces)
│   ├── rbac.ts                 # RBAC (31 permissions, 6 roles)
│   ├── jwt.ts                  # JWT utilities
│   ├── db.ts                   # Prisma client
│   ├── cq-data.ts              # Code Quest data (55+ questions)
│   ├── quiz-sounds.ts          # Sound effects
│   ├── notification-sound.ts   # Stub
│   ├── chat-encryption.ts      # Stub
│   ├── ai-token.ts             # Stub
│   ├── zai.ts                  # z-ai-web-dev SDK wrapper
│   ├── api-cache.ts            # In-memory cache
│   ├── utils.ts                # cn() utility
│   ├── seed-quiz.ts            # Quiz seeder
│   ├── query-client.ts         # Query key factory
│   ├── hooks/
│   │   └── use-queries.ts      # 30+ React Query hooks
│   └── security/
│       ├── rate-limit.ts       # Rate limiter
│       └── audit-logger.ts     # Stub
├── hooks/
│   ├── use-mobile.ts
│   └── use-toast.ts
└── providers/
    └── api-provider.tsx

mini-services/
└── chat-service/               # Socket.IO server (Port 3003)

prisma/
├── schema.prisma               # 18 models
└── seed.ts                     # Demo data seeder

public/
├── logo.svg, logo.png
├── hero-campus.png
├── sounds/fahhh.mp3
└── games/                      # 12 game images
```

---

## 17. Summary Statistics

| Metric | Count |
|--------|-------|
| **Pages** | 17 |
| **API Routes** | 43 files (~70+ endpoints) |
| **Database Models** | 18 |
| **UI Components** | 55+ (shadcn/ui) |
| **React Query Hooks** | 30+ |
| **Mini-Games** | 12 (Learn with Games) |
| **AI Models** | 8 |
| **User Roles** | 6 |
| **RBAC Permissions** | 31 |
| **Demo Accounts** | 11 |
| **Programming Languages** (games) | 5 |
| **Sound Effects** | 15+ |
| **Mini Services** | 1 (Chat, Port 3003) |
| **Estimated Lines of Code** | ~20,000+ |

---

## History of Work Done

### Completed Fixes
1. ✅ GitHub push & Vercel deployment
2. ✅ Demo mode removal (4 files: `api.ts`, `rbac.ts`, etc.)
3. ✅ Rate limiter rewrite (returns `{ allowed, retryAfterMs }` instead of boolean)
4. ✅ ErrorBoundary rewrite (uses `setPage('dashboard')` instead of `window.location.hash`)
5. ✅ Learn with Games crash fix (ErrorBoundary + defensive checks + debug logging)
6. ✅ API client demo guard removed
7. ✅ "Write operations are disabled in demo mode" login bug fixed

### Not Yet Done
- ❌ AI optimization rewrite (streaming, reduced retries, smaller prompts)
- ❌ Page speed optimization
- ❌ Duplicate login fix
- ❌ Profile/cover photo persistence
- ❌ Notification crash fix
- ❌ Coding games expansion
- ❌ Naming standardization
- ❌ Full production directive

---

*This PRD was generated on the current state of the PU-ALRMS project. All features described above are implemented unless marked as "Not Started", "Not Fixed", or "Stubbed". For continued development, use the Chat Z AI Prompt Kit in Section 15.*
