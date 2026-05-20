# PU-ALRMS — Complete Product Requirements Document (PRD)

## Project Overview

**Full Name:** Preston University Academic Learning & Resource Management System (PU-ALRMS)  
**Short Name:** PU-ALRMS  
**Tagline:** Prime University Academic Learning Resource Management System  
**Live URL:** https://prime-alrms.vercel.app  
**GitHub:** azmainwork0011/pu-alrms  
**Version:** 0.2.0 (Pre-Production)

---

## 1. Technology Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | Next.js 16 (App Router) |
| **Language** | TypeScript 5 |
| **Styling** | Tailwind CSS 4 + shadcn/ui (New York style) |
| **State Management** | Zustand (client state), TanStack React Query (server state) |
| **Database** | SQLite via Prisma ORM + libsql |
| **Animations** | Framer Motion 12 |
| **Icons** | Lucide React |
| **Real-time Chat** | Socket.IO Client + Custom Mini Service (Port 3003) |
| **AI Integration** | z-ai-web-dev-sdk (LLM, VLM, Image Generation, Web Search) |
| **Authentication** | Zero-dependency (base64 JWT, string password comparison) |
| **Notifications** | Web Audio API (synthesized sounds) |
| **Forms** | React Hook Form + Zod |
| **Drag & Drop** | dnd-kit |
| **Charts** | Custom CSS/Framer Motion (SimpleChart), Recharts available |
| **Markdown** | react-markdown + react-syntax-highlighter |
| **Image Processing** | react-easy-crop + sharp (server-side) |
| **Deployment** | Vercel (Serverless), GitHub Actions |

**Key Dependencies:** See `package.json` for full list. ~50+ dependencies including radix-ui primitives, date-fns, next-themes, next-auth, uuid, openai, bcryptjs, jsonwebtoken, socket.io-client, sonner (toast), vaul (drawer).

---

## 2. Authentication & User Roles

### 2.1 Auth System
- **Zero-dependency authentication:** No bcryptjs or jsonwebtoken used in runtime (packages present but auth uses base64 JWT)
- **JWT tokens** generated on login with role, userId, email embedded in payload
- **Client-side token expiry check** in Zustand `hydrate()` — prevents dashboard flash
- **Auth expiry event:** `window.dispatchEvent(new Event('auth-expired'))` triggers auto-logout
- **11 hardcoded demo accounts** with 5 passwords:

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

### 2.2 Registration
- Open registration for STUDENT and TEACHER roles
- Name validation (letters, numbers, spaces, hyphens)
- Email validation, password strength meter
- Auto-seeds database on login page mount (`/api/auth/seed`)
- Quick "Try Demo" button logs in as `alice@stu.pu.edu`

### 2.3 Role Hierarchy & Permissions
Role levels: SUPER_ADMIN (100) > ADMIN (80) > DEVELOPER (70) > TEACHER (50) > CR (30) > STUDENT (20)

**RBAC Permission Matrix:**

| Permission | SUPER_ADMIN | ADMIN | DEVELOPER | TEACHER | CR | STUDENT |
|-----------|:-----------:|:-----:|:---------:|:-------:|:--:|:-------:|
| admin:access | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| admin:users:list/modify | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| admin:stats/logs:view | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| assignment:create | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| assignment:edit/delete | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ |
| submission:grade | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| announcement:create | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| announcement:delete | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ |
| quiz:play | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ |
| ai:chat | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| ai:generate | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| chat:access | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

---

## 3. Database Schema (Prisma/SQLite)

### 3.1 Models (16 total)

**User** — id, name, email (unique), password, role (default: STUDENT), verified, status (ACTIVE/SUSPENDED/BANNED), avatar?, coverPhoto?, rollNumber?, batch?, department?, phone?, bio?, lastLogin?, timestamps

**Subject** — id, name, code, teacherId (FK→User), batch?, timestamps

**Assignment** — id, title, description, subjectId (FK→Subject), type (ASSIGNMENT/LAB_REPORT), batch?, deadline, fileUrl?, status (ACTIVE/CLOSED/ARCHIVED), createdBy (FK→User), timestamps

**Submission** — id, assignmentId (FK→Assignment), studentId (FK→User), fileName, fileUrl?, status (SUBMITTED/GRADED), marks?, feedback?, submittedAt, gradedAt?

**Comment** — id, assignmentId (FK→Assignment), userId (FK→User), content, createdAt

**Notification** — id, userId (FK→User), title, message, type (INFO/ASSIGNMENT/DEADLINE/FEEDBACK), isRead, createdAt

**Announcement** — id, title, message, type (GENERAL/URGENT/ASSIGNMENT/EXAM/RESULT), priority (NORMAL/HIGH/CRITICAL), createdBy (FK→User), timestamps

**ChatRoom** — id, name, type (BATCH/SUBJECT/GENERAL), batch?, department?, isPrivate, roomPassword?, encryptionKey, status, maxMembers, allowFiles, description?, createdBy?, lastActivity, timestamps

**ChatMessage** — id, roomId (FK→ChatRoom), userId (FK→User), content, messageType (TEXT/IMAGE/FILE), fileUrl?, fileName?, createdAt

**QuizCategory** — id, name, department, icon, description?, difficulty, isActive, timestamps
- Relations: questions[], attempts[], battles[]

**QuizQuestion** — id, categoryId (FK→QuizCategory), question, optionA/B/C/D, correctOption, difficulty, points, isActive, timestamps

**QuizAttempt** — id, userId (FK→User), categoryId (FK→QuizCategory), score, totalPoints, correctCount, totalQuestions, accuracy, timeTaken, createdAt

**QuizProfile** — id, userId (unique FK→User), totalXP, dailyStreak, bestStreak, totalQuizzes, totalCorrect, totalQuestions, lastQuizDate, timestamps

**SavedBook** — id, userId (FK→User), bookId, title, authors, coverUrl?, category?, language (default: en), description?, infoLink?, pdfLink?, createdAt
- Unique constraint: [userId, bookId]

**BattleRoom** — id, player1Id (FK→User), player2Id? (FK→User), categoryId? (FK→QuizCategory), status (WAITING/IN_PROGRESS/COMPLETED), totalQuestions, timePerQuestion, player1Score/2Score, player1Correct/2Correct, winnerId?, completedAt?, timestamps

**CQProfile** — id, userId (unique FK→User), level, totalXP, currentLevelXP, xpToNextLevel, battlesWon/Lost, totalBattles, lessonsCompleted, questionsAnswered, correctAnswers, miniGamesPlayed, dailyStreak, bestStreak, lastActiveDate, title, avatar?, timestamps

**CQFriend** — id, userId (FK→User), friendId (FK→User), status (PENDING/ACCEPTED/REJECTED), timestamps
- Unique constraint: [userId, friendId]

**CQBattleSession** — id, player1Id (FK→User), player2Id? (FK→User), language?, status (WAITING/IN_PROGRESS/COMPLETED), totalRounds, timePerRound, player1HP/2HP, player1Score/2Score, currentRound, winnerId?, completedAt?, timestamps

---

## 4. Pages & Features (15 Pages)

### 4.1 Authentication Page (`AuthPage.tsx`)
- **Login / Register toggle** with animated tab switching
- Dark theme with animated gradient background (emerald/teal/cyan glow)
- Email + password login, name + email + password + role register
- Password visibility toggle, strength meter (register mode)
- Quick "Try Demo" button (logs in as alice@stu.pu.edu)
- Network error detection, graceful error messages
- Auto-seeds database on mount
- **File:** `src/components/pages/AuthPage.tsx`

### 4.2 Dashboard (`DashboardPage.tsx`)
- **Role-adaptive layout** with 3 distinct views:
  - **Student/CR:** Pending assignments, submitted count, avg grade, completion rate, weekly chart, upcoming deadlines, recent submissions, subject progress
  - **Teacher:** Created assignments, submissions, pending grading, avg marks, submission trend, recent assignments, subjects, pending grading CTA
  - **Admin:** Total users, assignments, submissions, ungraded count, activity trend, recent announcements, submissions, top students, role distribution
- **Welcome banner:** Time-aware greeting, avatar, date, role badge, batch badge
- **Quick actions:** Role-specific horizontal scrollable buttons with gradient styling
- **Custom bar chart:** Pure CSS/Framer Motion (no charting library), hover tooltips, animated bars
- **Scroll reveal animations:** IntersectionObserver + `ScrollReveal` wrapper
- **Data:** React Query `useDashboard()` hook with 60s cache
- **File:** `src/components/pages/DashboardPage.tsx`

### 4.3 Assignments & Lab Reports (`AssignmentsPage.tsx`)
- **Dual-purpose component:** Handles both ASSIGNMENT and LAB_REPORT types via `type` prop
- **List view:** Search by title, filter by subject (Select), status counts
- **Role features:**
  - Students: View submission status, navigate to detail
  - Teachers/Admin/CR: Create, Edit, Duplicate, Delete (Archive) assignments
- **Edit dialog:** Title, Description, Deadline, Status
- **Delete dialog:** Soft-delete confirmation ("Archive Assignment")
- **Duplicate:** Creates copy with "(Copy)" suffix
- **Overdue detection:** `safeIsPast(deadline) && status === 'ACTIVE'`
- **Data:** React Query hooks with 30s cache
- **File:** `src/components/pages/AssignmentsPage.tsx`

### 4.4 Assignment Detail (`AssignmentDetailPage.tsx`)
- Full assignment view with description, deadline, subject, status
- **Student view:** Submit assignment (text + file), view existing submission, see grade/feedback
- **Teacher/Admin view:** View all submissions, grade with marks + feedback
- **Comments section:** Add/view comments on assignments
- **File:** `src/components/pages/AssignmentDetailPage.tsx`

### 4.5 Create Assignment (`CreateAssignmentPage.tsx`)
- Form: Title, Description (rich text), Subject (dropdown), Type, Deadline, File upload
- **Accessible to:** TEACHER, ADMIN, DEVELOPER
- **File:** `src/components/pages/CreateAssignmentPage.tsx`

### 4.6 Submissions Page (`SubmissionsPage.tsx`)
- Teacher/Admin view of all submissions across assignments
- Filter by assignment, status, student
- Grade submissions inline
- **File:** `src/components/pages/SubmissionsPage.tsx`

### 4.7 AI Chat (`AIChatPage.tsx`)
- **Three modes:**
  1. **Single Chat:** 8 AI model options (GPT-4o, Claude 3.5 Sonnet, Gemini 1.5 Pro, LLaMA 3.1 405B, Mistral Large, GPT-5, Claude 4 Opus, Gemini 2.0 Flash)
  2. **Battle Mode:** Compare 2-3 AI models side-by-side, blind voting, reveal
  3. **Image Generation:** Text-to-image via z-ai-web-dev-sdk
- **Smart Scanner:** Upload image + question → AI analyzes
- **Markdown rendering** with ReactMarkdown + syntax highlighting
- **Copy & Regenerate** buttons on AI messages
- **6 quick prompt suggestions** on chat welcome screen
- **Backends:** `/api/ai/chat`, `/api/ai/scan`, `/api/ai/generate-image`, `/api/ai/search`
- **CRITICAL:** z-ai-web-dev-sdk uses `role: 'assistant'` for system prompts, NOT `role: 'system'`
- **Wrapped in ErrorBoundary**
- **File:** `src/components/pages/AIChatPage.tsx`

### 4.8 Quiz (`QuizPage.tsx`)
- **KBC-style quiz** (Kaun Banega Crorepati theming)
- **Flow:** Department Select → Category Select → Playing → Feedback → Results
- **5 departments:** All Topics, Computer Science (CSE), Law (LLB), Electrical Engineering (EEE), Business Administration (BBA)
- **Prize ladder:** 14 levels from ₹1,000 to ₹7,00,00,000
- **Game mechanics:**
  - 5 hearts/lives system
  - 30-second timer per question
  - 3 lifelines: 50/50, Skip, Extra Time (+10s)
  - XP system with combo multiplier (streak)
  - Confetti explosion on correct answers
- **Sound effects:** 15+ synthesized sounds via Web Audio API
  - KBC intro, question reveal, correct/wrong, timer tick, lifeline, heart lost, game over, win fanfare, streak fire, XP gain
- **Persistent profile:** `/api/quiz/profile` (totalXP, dailyStreak, bestStreak, totalQuizzes)
- **Results screen:** Grade (S/A/B/C/D), animated counters, stats
- **File:** `src/components/pages/QuizPage.tsx`

### 4.9 Quiz Battle (`BattlePage.tsx`)
- **Two modes:** Solo vs Bot, PvP (Create Room / Join Room)
- **Solo mode:** AI bot with 40-60% accuracy, difficulty-adjusted
- **PvP mode:** Create room, wait for opponent, join open rooms, poll-based
- **Battle flow:** Lobby → Waiting → VS Screen (3-2-1-FIGHT!) → Fighting → Result
- **Gameplay:**
  - 10 questions, 15 seconds per question
  - Animated VS screen with energy lines
  - Prize ladder (100 to 64,000 pts)
  - Particle effects on correct/wrong answers
  - Bot thinking animation, bot answer simulation (2-6s delay)
  - Sound effects: battle start, correct, wrong, tick, fight, time warning, victory, defeat
- **Result screen:** Score comparison, correct count, question-by-question breakdown
- **File:** `src/components/pages/BattlePage.tsx`

### 4.10 Learn with Games / Code Quest Arena (`LearnWithGame.tsx` + `CodeQuestArena.tsx`)
- **Two components:** LearnWithGame (12 mini-games, ~1400 lines) and CodeQuestArena (Learn/Battle/MiniGames/Friends, ~900+ lines)
- **Both rendered via `case 'code-quest'`** in AppLayout

#### LearnWithGame (12 Mini-Games):
1. **Learn Quiz** — Language → Topic → MCQ quiz flow
2. **Code Battle** — VS AI bot with HP bars, rounds, damage mechanics
3. **Bug Detective** — Find the buggy line in code snippets (4 challenges)
4. **Code Puzzle** — Rearrange scrambled code lines (4 puzzles)
5. **Syntax Match** — Match programming concepts to syntax (30 pairs, 5 languages)
6. **Memory Match** — Flip cards to match concept ↔ definition
7. **Typing Race** — Type code snippets as fast as possible (WPM scoring)
8. **Speed Quiz** — Rapid-fire timed questions with streak multiplier
9. **Output Predictor** — Read code, predict exact output
10. **Code Fill** — Fill blanks in code templates
11. **Pattern Master** — Number sequence pattern recognition
12. **Daily Challenge** — Seeded daily quiz with bonus XP

#### CodeQuestArena (7 Tabs):
- **Home:** XP bar, stats grid, daily challenge, quick actions, recent activity
- **Learn:** Language selection (Python, JavaScript, Java, C++, TypeScript) → Topic → Quiz
- **Battle:** VS bot with HP bars, damage mechanics, rounds, timer
- **Mini Games:** Bug Finder, Code Puzzle, Syntax Match
- **Leaderboard:** Mock top 5 players
- **Friends:** Add/remove friends, challenge friend to battle
- **Profile:** Avatar, stats, badges

**Gamification:** XP system, 10 levels (Code Novice → Code Grandmaster), streaks, badges
**Data:** `src/lib/cq-data.ts` — 55+ questions, 13 topics, 5 languages, level thresholds, mock leaderboard
**Files:** `src/components/pages/LearnWithGame.tsx`, `src/components/pages/CodeQuestArena.tsx`, `src/lib/cq-data.ts`

### 4.11 Announcements (`AnnouncementsPage.tsx`)
- **Full CRUD** for announcements (TEACHER+)
- **Types:** GENERAL, URGENT, ASSIGNMENT, EXAM, RESULT
- **Priority levels:** NORMAL, HIGH, CRITICAL (with visual indicators — left border accent)
- **Role access:** Create (TEACHER, ADMIN), Edit (TEACHER, ADMIN, CR), Delete (TEACHER, ADMIN)
- **Combined create/edit dialog**
- **Notification sound on successful creation**
- **Data:** React Query with 30s cache
- **File:** `src/components/pages/AnnouncementsPage.tsx`

### 4.12 Student Community Chat (`StudentCommunityPage.tsx`)
- **Real-time WebSocket chat** via Socket.IO (port 3003 mini-service)
- **Features:**
  - Multiple chat rooms (BATCH, SUBJECT, GENERAL types)
  - Room switching, room list panel
  - Online users display, typing indicators
  - Image sharing (base64), file sharing
  - Role badges on messages
  - Auto-reconnection, connection status indicator
  - Notification sound when chat not visible
- **Backend:** Mini-service at `mini-services/chat-service/` (Port 3003)
- **File:** `src/components/pages/StudentCommunityPage.tsx`

### 4.13 Books / Digital Library (`BooksPage.tsx`)
- **Search:** Google Books + Open Library APIs
- **Categories:** Computer Science, Law (LLB), BBA, Engineering, Web Dev & UI/UX, Data Science & ML, History, Saved Books
- **Features:**
  - Grid view with book covers, star ratings, author info
  - Save/unsave books (heart icon with animation)
  - Book detail modal with categories, meta info, description
  - Embedded reader (Google Books iframe / Open Library embed)
  - PDF download when available
  - Infinite scroll / load more
  - Language toggle (English/Bengali)
- **Backend:** `/api/books/search`, `/api/books/saved`
- **File:** `src/components/pages/BooksPage.tsx`

### 4.14 Profile (`ProfilePage.tsx`)
- **Cover photo + Avatar** with gradient fallbacks, animated decorative patterns
- **Image upload with crop:** react-easy-crop, max 5MB, JPG/PNG/WebP
- **Profile editing:** Name, Roll Number, Batch, Department, Phone, Bio
- **Role-specific styling:** Different gradient colors per role
- **Stats cards:** Role-specific metrics (pending/submitted/avg grade for students, etc.)
- **Notification Sound Settings:** Enable/disable, volume slider, sound selection grid (Original, Classic, Trending, Hindi, Bangla)
- **Account section:** Status, role display, sign out
- **File:** `src/components/pages/ProfilePage.tsx`

### 4.15 Notifications (`NotificationsPage.tsx`)
- **Notification list** with read/unread visual distinction
- **Click to mark as read**, "Mark all as read" button
- **Unread count sync** to Zustand store → header badge
- **Sound on new notifications** (not initial mount)
- **Notification types:** ASSIGNMENT (green), DEADLINE (amber), FEEDBACK (purple), default (gray)
- **Slide-in animation** per notification
- **File:** `src/components/pages/NotificationsPage.tsx`

### 4.16 Leaderboard (`LeaderboardPage.tsx`)
- Displays top users by quiz performance
- Mock/static data display
- **File:** `src/components/pages/LeaderboardPage.tsx`

### 4.17 Admin Panel (`AdminPanelPage.tsx`)
- **SUPER_ADMIN only** (restricted access)
- **4 tabs:**
  1. **Overview:** Stats (Total Users, Active Today, New This Week, Banned), Role Distribution chart, Recent Logins
  2. **User Management:** Search/filter users, change roles, suspend/ban/activate, verified badge toggle, pagination (12 per page)
  3. **Developer Access:** List developer accounts, suspend/activate
  4. **System Settings:** DB connection status, quick stats, DB reseed, create announcement
  5. **System Logs:** Audit log table with role filter
- **File:** `src/components/pages/AdminPanelPage.tsx`

---

## 5. API Routes (40+ endpoints)

### 5.1 Authentication (`/api/auth/*`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | Email + password login, returns JWT + user |
| POST | `/api/auth/register` | Create account (STUDENT/TEACHER) |
| POST | `/api/auth/seed` | Seed demo data (11 users + sample assignments) |
| GET | `/api/auth/profile` | Get current user profile |
| PUT | `/api/auth/profile` | Update profile fields |
| PUT | `/api/auth/profile/photo` | Upload avatar/cover photo (multipart) |

### 5.2 AI (`/api/ai/*`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/ai/chat` | Chat with AI (single/battle mode), 60s timeout |
| PUT | `/api/ai/chat` | Vote in AI battle, reveals models |
| DELETE | `/api/ai/chat` | Clear chat history |
| POST | `/api/ai/scan` | Vision AI image analysis |
| POST | `/api/ai/search` | Web search |
| POST | `/api/ai/generate-image` | Text-to-image generation |
| GET | `/api/ai/token` | Get AI service status |

### 5.3 Assignments (`/api/assignments/*`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/assignments` | List assignments (filter: subject, status, type) |
| POST | `/api/assignments` | Create assignment |
| GET | `/api/assignments/[id]` | Get single assignment with submissions |
| PUT | `/api/assignments/[id]` | Update assignment |
| DELETE | `/api/assignments/[id]` | Soft-delete (archive) assignment |

### 5.4 Submissions (`/api/submissions/*`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/submissions` | List submissions (filter: assignmentId, studentId) |
| POST | `/api/submissions` | Create submission |
| PUT | `/api/submissions/[id]/grade` | Grade submission (marks + feedback) |

### 5.5 Announcements (`/api/announcements/*`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/announcements` | List announcements |
| POST | `/api/announcements` | Create announcement |
| GET | `/api/announcements/[id]` | Get single announcement |
| PUT | `/api/announcements/[id]` | Update announcement |
| DELETE | `/api/announcements/[id]` | Delete announcement |

### 5.6 Notifications (`/api/notifications/*`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/notifications` | List user notifications |
| PUT | `/api/notifications/[id]/read` | Mark as read |
| POST | `/api/notifications` | Mark all as read |

### 5.7 Quiz (`/api/quiz/*`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/quiz/categories` | List categories (filter: department) |
| GET | `/api/quiz/questions` | Get questions for category |
| POST | `/api/quiz/questions` | Submit quiz attempt |
| GET | `/api/quiz/profile` | Get quiz profile |
| PUT | `/api/quiz/profile` | Update quiz profile |
| GET | `/api/quiz/leaderboard` | Get leaderboard |
| POST | `/api/quiz/battle` | Create/join/complete battle |
| GET | `/api/quiz/battle` | List waiting rooms |
| GET | `/api/quiz/attempts` | Get quiz attempts |
| POST | `/api/quiz/seed` | Seed quiz data |

### 5.8 Code Quest (`/api/cq/*`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/cq/profile` | Get Code Quest profile |
| PUT | `/api/cq/profile` | Update Code Quest profile |
| GET | `/api/cq/leaderboard` | Get Code Quest leaderboard |
| POST | `/api/cq/battle` | Create/complete Code Quest battle |
| GET | `/api/cq/friends` | Get Code Quest friends |

### 5.9 Admin (`/api/admin/*`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/stats` | System statistics |
| GET | `/api/admin/users` | List users (paginated, filterable) |
| PUT | `/api/admin/users` | Modify user (role, status, verified) |
| GET | `/api/admin/logs` | Audit logs |

### 5.10 Other Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/dashboard` | Dashboard stats (role-adaptive) |
| GET | `/api/subjects` | List subjects |
| POST | `/api/subjects` | Create subject |
| GET | `/api/batches` | List batches |
| GET | `/api/leaderboard` | Global leaderboard |
| GET/POST | `/api/comments` | List/create comments |
| GET | `/api/books/search` | Search Google Books + Open Library |
| GET/POST/DELETE | `/api/books/saved` | Manage saved books |
| GET/POST | `/api/chat/rooms` | List/create chat rooms |
| POST | `/api/chat/rooms/join` | Join chat room |
| GET/POST | `/api/chat/messages` | List/send messages |

---

## 6. Application Layout

### 6.1 Architecture
- **Single-page application (SPA)** with Zustand-based routing (no URL changes for pages)
- **`currentPage` state** in Zustand drives which page component renders
- **`AppLayout.tsx`** contains sidebar + header + main content with giant `switch/case` in `renderPage()`
- **Mobile responsive sidebar** using shadcn Sheet (slide-out drawer)
- **Desktop sidebar** fixed w-64 with logo, navigation, sections
- **Header bar** with hamburger menu, dynamic page title, theme toggle, notification bell (animated badge), user dropdown

### 6.2 Navigation Structure
Sections in sidebar:
- **Main:** Dashboard
- **Academic:** Assignments, Lab Reports, Create Assignment (TEACHER+)
- **Communication:** Announcements, Community Chat
- **Learning:** Quiz, Learn with Games, Battle, Leaderboard
- **Tools:** Books, AI Assistant
- **Account:** Profile, Notifications, Admin Panel (SUPER_ADMIN only)

### 6.3 State Management
**Zustand Store** (`src/store/app.ts`):
- `user`, `token`, `isAuthenticated`, `mounted`
- `currentPage`, `selectedAssignmentId`
- `sidebarOpen`, `notificationCount`
- Actions: `setAuth`, `updateUser`, `logout`, `setPage`, `setAssignmentId`, `hydrate`

**React Query** (`src/lib/hooks/use-queries.ts`):
- Dashboard (60s cache), Assignments (30s), Submissions (30s), Subjects (60s), Batches (60s), Notifications (15s), Leaderboard (60s), Announcements (30s), Quiz (30-60s), Books (30-60s), Auth Profile (2min)

### 6.4 Theme System
- **Light/Dark mode** via next-themes
- Emerald/teal/cyan color scheme throughout
- No indigo or blue primary colors
- Role-specific gradients (Student=amber, Teacher=emerald, Admin=rose, CR=violet, SuperAdmin=emerald-cyan, Developer=amber-yellow)

---

## 7. Shared Infrastructure

### 7.1 UI Components (shadcn/ui)
45+ shadcn/ui components in `src/components/ui/`: accordion, alert, alert-dialog, aspect-ratio, avatar, badge, breadcrumb, button, calendar, card, carousel, checkbox, collapsible, command, context-menu, dialog, drawer, dropdown-menu, form, hover-card, input, input-otp, label, menubar, navigation-menu, pagination, popover, progress, radio-group, resizable, scroll-area, select, separator, sheet, sidebar, skeleton, slider, sonner, switch, table, tabs, textarea, toast, toggle, toggle-group, tooltip

### 7.2 Custom Components
- `ImageCropDialog` — Image cropping for profile photos
- `ErrorBoundary` — React class component, uses `setPage('dashboard')` for error recovery
- `LoadingOverlay` — Full-page loading state
- `PageTransition` — Framer Motion page transitions
- `pu-helpers.tsx` — Shared utilities: `getInitials()`, `AnimatedCounter`, `timeAgo()`, `getPasswordStrength()`, `isValidEmail()`, `playNotificationSound()`

### 7.3 Utility Libraries
- `src/lib/api.ts` — API client with retry, timeout, auth headers, rate limiting, error classes
- `src/lib/rbac.ts` — Role-based access control middleware
- `src/lib/security/rate-limit.ts` — Rate limiter (returns `{ allowed, retryAfterMs }`)
- `src/lib/security/audit-logger.ts` — Audit logging
- `src/lib/jwt.ts` — JWT token creation/verification (base64)
- `src/lib/db.ts` — Prisma client singleton
- `src/lib/api-cache.ts` — In-memory API cache
- `src/lib/quiz-sounds.ts` — 15+ synthesized sound effects via Web Audio API
- `src/lib/notification-sound.ts` — Notification sound settings (currently stubbed/no-op)
- `src/lib/chat-encryption.ts` — Chat encryption utilities
- `src/lib/ai-token.ts` — AI token management
- `src/lib/zai.ts` — z-ai-web-dev SDK wrapper
- `src/lib/utils.ts` — General utilities (cn, etc.)
- `src/lib/cq-data.ts` — Code Quest game data (questions, languages, levels, etc.)
- `src/lib/hooks/use-queries.ts` — React Query hooks for all API endpoints
- `src/lib/seed-quiz.ts` — Quiz data seeder
- `src/lib/query-client.ts` — Query key factory

### 7.4 Mini Service
- **Chat Service** (Port 3003): Socket.IO server for real-time community chat
  - File: `mini-services/chat-service/`
  - Supports rooms, messages, typing indicators, online users
  - Frontend connects via `io('/?XTransformPort=3003')`

---

## 8. Known Issues & Bugs

### 8.1 Critical Bugs (Not Fixed)
1. **Duplicate login bug:** Some demo accounts share the same email/password, causing login issues for different roles
2. **Profile/Cover photo save:** Photo upload may not properly persist or display after refresh
3. **Notification crash:** Notifications page can crash under certain conditions
4. **AI chat can be slow:** No streaming, multiple retries, large system prompts

### 8.2 Performance Issues (Not Fixed)
1. **Page loading speed:** Dashboard, Assignment, Lab Report, Announcement, Quiz, Battle, AI pages load slowly
2. **No code splitting:** All 15+ page components are eagerly imported
3. **Large single-file components:** LearnWithGame (~1400+ lines), QuizPage (~900+ lines), AIChatPage (~800+ lines)
4. **50+ useState hooks** in LearnWithGame component
5. **No URL-based routing:** All navigation is state-based (no deep linking, no browser back button)

### 8.3 Optimization Needed (Not Implemented)
1. **AI Chat optimization:** Reduce retries 3→1, remove auto web search, reduce system prompt, use streaming, dynamic prompts, smart caching, graceful fallback
2. **Lazy loading / code splitting** for page components
3. **Pagination** on assignment/notification lists
4. **Persistent XP/progress** (currently resets on page navigation)
5. **Real leaderboard** data (currently mock)

### 8.4 Design/UX Issues
1. **Naming inconsistency:** "PU ALRMS" vs "PU Alarms" vs "PU-ALRMS"
2. **Quiz prize amounts in Indian Rupees** (regional limitation)
3. **No password change** or email verification UI
4. **No offline support**

---

## 9. Pending Feature Requests (Priority Order)

### 9.1 HIGH PRIORITY — Not Started
1. **Add many coding learning games** to "Learn with Games" — good images, modern implementations, better logic/structure, coding-focused games (coding games khele khele sikhte pare students/teachers)
2. **Fix duplicate email/password login bug**
3. **Fix profile picture & cover photo save/finalize**
4. **Fix notification feature crash**
5. **Optimize loading speed** for dashboard, assignment, labreport, announcement, quiz, battle, AI pages

### 9.2 HIGH PRIORITY — Partially Addressed
6. **Rewrite AI chat route** per optimization plan: reduce retries, remove auto web search, reduce system prompt, streaming, dynamic prompts, smart caching, graceful fallback

### 9.3 MEDIUM PRIORITY
7. **Standardize naming** (PU ALRMS vs PU Alarms)
8. **Execute 6-point production directive:**
   - Remove deployment guides
   - Redesign UI (responsive/modern)
   - Fix login system
   - Super Admin full control
   - Optimize performance
   - Deliver production-ready

### 9.4 LOW PRIORITY
9. **Push all fixes to GitHub and deploy to Vercel**

---

## 10. File Structure Summary

```
src/
├── app/
│   ├── layout.tsx          # Root layout with providers
│   ├── page.tsx            # Entry point (Auth/App routing)
│   ├── not-found.tsx       # 404 page
│   ├── globals.css         # Global styles (Tailwind)
│   └── api/                # 40+ API routes (see Section 5)
│       ├── auth/           # login, register, seed, profile
│       ├── ai/             # chat, scan, search, generate-image, token
│       ├── assignments/    # CRUD + [id]
│       ├── submissions/    # list, create, grade
│       ├── announcements/  # CRUD + [id]
│       ├── notifications/  # list, mark-read
│       ├── quiz/           # categories, questions, profile, battle, leaderboard, seed, attempts
│       ├── cq/             # profile, leaderboard, battle, friends
│       ├── admin/          # stats, users, logs
│       ├── books/          # search, saved
│       ├── chat/           # rooms, messages, join
│       ├── dashboard/      # stats
│       ├── subjects/       # CRUD
│       ├── batches/        # list
│       ├── leaderboard/    # get
│       ├── comments/       # CRUD
│       └── route.ts        # Catch-all
├── components/
│   ├── layout/
│   │   ├── AppLayout.tsx   # Main SPA layout with routing (373 lines)
│   │   └── LoadingOverlay.tsx
│   ├── pages/              # 17 page components (see Section 4)
│   │   ├── AuthPage.tsx
│   │   ├── DashboardPage.tsx
│   │   ├── AssignmentsPage.tsx
│   │   ├── AssignmentDetailPage.tsx
│   │   ├── CreateAssignmentPage.tsx
│   │   ├── SubmissionsPage.tsx
│   │   ├── AIChatPage.tsx
│   │   ├── QuizPage.tsx
│   │   ├── BattlePage.tsx
│   │   ├── LearnWithGame.tsx
│   │   ├── CodeQuestArena.tsx
│   │   ├── AnnouncementsPage.tsx
│   │   ├── StudentCommunityPage.tsx
│   │   ├── BooksPage.tsx
│   │   ├── ProfilePage.tsx
│   │   ├── NotificationsPage.tsx
│   │   ├── LeaderboardPage.tsx
│   │   └── AdminPanelPage.tsx
│   ├── ui/                 # 45+ shadcn/ui components
│   ├── ErrorBoundary.tsx
│   ├── pu-helpers.tsx
│   └── theme-provider.tsx
├── store/
│   └── app.ts              # Zustand store
├── lib/
│   ├── api.ts              # API client
│   ├── rbac.ts             # Role-based access control
│   ├── jwt.ts              # JWT utilities
│   ├── db.ts               # Prisma client
│   ├── cq-data.ts          # Code Quest game data
│   ├── quiz-sounds.ts      # Sound effects
│   ├── notification-sound.ts
│   ├── chat-encryption.ts
│   ├── ai-token.ts
│   ├── zai.ts              # z-ai-web-dev SDK wrapper
│   ├── api-cache.ts
│   ├── utils.ts
│   ├── seed-quiz.ts
│   ├── query-client.ts
│   ├── hooks/
│   │   └── use-queries.ts  # React Query hooks
│   └── security/
│       ├── rate-limit.ts
│       └── audit-logger.ts
├── hooks/
│   ├── use-mobile.ts
│   └── use-toast.ts
└── providers/
    └── api-provider.tsx
```

---

## 11. Key Technical Notes

### 11.1 z-ai-web-dev-sdk (CRITICAL)
- System prompts MUST use `role: 'assistant'`, NOT `role: 'system'`
- SDK accessed via `zai.create()` and `zai.createVision()`
- Backend only — MUST NOT be imported on client side

### 11.2 Rate Limiter
- Returns `{ allowed: boolean, retryAfterMs: number }` — NOT a plain boolean
- Used in `src/lib/security/rate-limit.ts`

### 11.3 API Client
- `apiFetch<T>()` with timeout, retry (MAX_RETRIES=1), auth headers
- Auth endpoints (login/register) don't trigger auth-expired on 401
- 401 on other endpoints triggers `handleAuthExpired()`
- Upload timeout: 60s, Default: 30s, Auth: 20s

### 11.4 Vercel Deployment
- SQLite not persistent on Vercel serverless (cold start issues)
- Each cold start resets database → requires re-seeding
- Token: `(set in Vercel project settings)`
- GitHub Classic Token: `(set in GitHub account settings)`

### 11.5 Debug Logging Convention
- Prefixes: `[AI]`, `[AIChat]`, `[AIChat Battle]` for DevTools filtering

### 11.6 Gateway & API Requests
- Only port 3000 exposed externally
- For cross-port requests, use `XTransformPort` query parameter
- Example: `fetch('/api/test?XTransformPort=3030')`
- WebSocket: `io('/?XTransformPort=3003')`
- NEVER use absolute URLs with port numbers

---

## 12. Summary Statistics

| Metric | Count |
|--------|-------|
| **Pages** | 17 |
| **API Routes** | 40+ |
| **Database Models** | 18 |
| **UI Components** | 45+ |
| **Custom Hooks** | 20+ React Query hooks |
| **Game Types** | 12 mini-games + KBC quiz + Battle |
| **AI Models** | 8 (GPT-4o, Claude 3.5, Gemini, LLaMA, Mistral, GPT-5, Claude 4, Gemini 2.0) |
| **User Roles** | 6 (SUPER_ADMIN, ADMIN, DEVELOPER, TEACHER, CR, STUDENT) |
| **Demo Accounts** | 11 |
| **Programming Languages** (in games) | 5 (Python, JS, Java, C++, TypeScript) |
| **Sound Effects** | 15+ synthesized |
| **Mini Services** | 1 (Chat service on port 3003) |
| **Lines of Code** (estimated) | ~20,000+ |

---

*This PRD was generated on the current state of the PU-ALRMS project. All features described above are implemented unless marked as "Not Started" or "Not Fixed" in the issues sections.*
