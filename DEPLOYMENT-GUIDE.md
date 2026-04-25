# PU-ALRMS — Complete Project Documentation for Firebase Hosting Deployment

> **This document is designed to give another AI assistant complete context about the project for Firebase Hosting deployment.**

---

## 1. PROJECT SUMMARY

| Property | Value |
|----------|-------|
| **Framework** | **Next.js 16.1.1** (App Router, React 19) |
| **Language** | TypeScript 5 |
| **Styling** | Tailwind CSS 4 + shadcn/ui (Radix UI) |
| **Runtime** | Bun (also works with npm) |
| **Database** | SQLite via Prisma ORM |
| **Authentication** | JWT (custom) + Firebase Google Auth (optional) |
| **State Management** | Zustand (client) + TanStack Query (server) |
| **Output Mode** | `standalone` (produces `.next/standalone/`) |
| **Total Code** | ~21,000+ lines (pages + API routes + UI components) |
| **UI Components** | ~5,800 lines (60+ shadcn/ui components) |

### Architecture Pattern
- **SPA-style single-page app**: Only one route (`/`) in `src/app/page.tsx`
- Client-side navigation via Zustand `currentPage` state (NO React Router)
- All API routes under `/api/*` (Next.js Route Handlers)
- **CRITICAL**: This is a **full-stack** app with backend API routes + database — it is NOT a static frontend

### ⚠️ DEPLOYMENT WARNING
This app has **server-side API routes** and a **local SQLite database**. Firebase Hosting alone (static files) is **NOT sufficient** for full functionality. You need:
- **Firebase Hosting** — for serving the frontend
- **Firebase Cloud Functions** or **Firebase App Hosting** — for running API routes
- OR migrate database to **Firestore** / external PostgreSQL

---

## 2. FULL FOLDER/FILE STRUCTURE

```
pu-alrms/
├── package.json                    # Dependencies & scripts
├── next.config.ts                  # Next.js config (output: "standalone")
├── tsconfig.json                   # TypeScript config
├── tailwind.config.ts              # Tailwind CSS config
├── postcss.config.mjs              # PostCSS config
├── components.json                 # shadcn/ui config
├── eslint.config.mjs               # ESLint config
├── .gitignore                      # Git ignore rules
├── setup-firebase.sh               # Firebase auto-setup bash script (Kali Linux)
├── setup-firebase.ps1              # Firebase auto-setup PowerShell script (Windows)
│
├── prisma/
│   ├── schema.prisma               # Database schema (SQLite, 15 models)
│   ├── seed.ts                     # Database seeder (demo data)
│   └── db/
│       └── custom.db               # SQLite database file
│
├── public/
│   ├── logo.png                    # App logo
│   ├── logo.svg                    # App logo (SVG)
│   ├── hero-campus.png             # Hero background image
│   ├── robots.txt                  # SEO robots
│   └── uploads/profiles/           # User uploaded profile photos
│
├── src/
│   ├── app/
│   │   ├── layout.tsx              # Root layout (ThemeProvider, FirebaseProvider, ApiProvider)
│   │   ├── page.tsx                # Single route — SPA entry point (Auth ↔ AppLayout)
│   │   ├── globals.css             # Global styles + Tailwind
│   │   └── api/                    # Backend API routes (44 route files)
│   │       ├── route.ts            # API health check
│   │       ├── auth/
│   │       │   ├── login/route.ts
│   │       │   ├── register/route.ts
│   │       │   ├── firebase/route.ts     # Firebase token exchange
│   │       │   ├── google/route.ts
│   │       │   ├── seed/route.ts
│   │       │   ├── temp-email/route.ts
│   │       │   ├── profile/route.ts
│   │       │   └── profile/photo/route.ts
│   │       ├── assignments/route.ts
│   │       │   └── [id]/route.ts
│   │       ├── submissions/route.ts
│   │       │   └── [id]/grade/route.ts
│   │       ├── announcements/route.ts
│   │       │   └── [id]/route.ts
│   │       ├── notifications/route.ts
│   │       │   └── [id]/read/route.ts
│   │       ├── comments/route.ts
│   │       ├── subjects/route.ts
│   │       ├── batches/route.ts
│   │       ├── leaderboard/route.ts
│   │       ├── dashboard/route.ts
│   │       ├── admin/
│   │       │   ├── stats/route.ts
│   │       │   ├── users/route.ts
│   │       │   └── logs/route.ts
│   │       ├── ai/
│   │       │   ├── chat/route.ts
│   │       │   ├── generate-image/route.ts
│   │       │   ├── scan/route.ts
│   │       │   └── token/route.ts
│   │       ├── quiz/
│   │       │   ├── categories/route.ts
│   │       │   ├── questions/route.ts
│   │       │   ├── profile/route.ts
│   │       │   ├── seed/route.ts
│   │       │   ├── battle/route.ts
│   │       │   └── leaderboard/route.ts
│   │       ├── cq/                    # CodeQuest mini-game
│   │       │   ├── profile/route.ts
│   │       │   ├── friends/route.ts
│   │       │   ├── battle/route.ts
│   │       │   └── leaderboard/route.ts
│   │       ├── chat/
│   │       │   ├── rooms/route.ts
│   │       │   ├── rooms/join/route.ts
│   │       │   └── messages/route.ts
│   │       └── books/
│   │           ├── search/route.ts
│   │           └── saved/route.ts
│   │
│   ├── components/
│   │   ├── ui/                      # 60+ shadcn/ui components
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── input.tsx
│   │   │   ├── sidebar.tsx
│   │   │   ├── toast.tsx, toaster.tsx
│   │   │   └── ... (50+ more)
│   │   ├── pages/                   # Page components (18 pages)
│   │   │   ├── AuthPage.tsx          # Login/register screen
│   │   │   ├── DashboardPage.tsx     # Main dashboard
│   │   │   ├── AssignmentsPage.tsx   # Assignment list
│   │   │   ├── AssignmentDetailPage.tsx
│   │   │   ├── CreateAssignmentPage.tsx
│   │   │   ├── SubmissionsPage.tsx   # Grade/submit assignments
│   │   │   ├── QuizPage.tsx          # Quiz system
│   │   │   ├── LeaderboardPage.tsx
│   │   │   ├── AIChatPage.tsx        # AI chat (Lucky Strick AI)
│   │   │   ├── StudentCommunityPage.tsx
│   │   │   ├── AnnouncementsPage.tsx
│   │   │   ├── NotificationsPage.tsx
│   │   │   ├── ProfilePage.tsx
│   │   │   ├── BooksPage.tsx         # Digital library
│   │   │   ├── CodeQuestArena.tsx    # Code Quest game
│   │   │   ├── LearnWithGame.tsx
│   │   │   ├── BattlePage.tsx        # Quiz battle
│   │   │   └── AdminPanelPage.tsx    # Admin panel
│   │   ├── layout/
│   │   │   ├── AppLayout.tsx         # Main layout (sidebar + header + routing)
│   │   │   └── LoadingOverlay.tsx
│   │   ├── theme-provider.tsx        # next-themes dark/light mode
│   │   └── pu-helpers.tsx            # Shared utilities
│   │
│   ├── store/
│   │   └── app.ts                    # Zustand store (auth, navigation, UI state)
│   │
│   ├── providers/
│   │   ├── firebase-provider.tsx     # Firebase Auth context provider
│   │   └── api-provider.tsx          # TanStack Query provider
│   │
│   ├── lib/
│   │   ├── api.ts                    # API client (fetch wrapper with retry)
│   │   ├── db.ts                     # Prisma client singleton
│   │   ├── firebase.ts               # Firebase SDK initialization
│   │   ├── jwt.ts                    # JWT sign/verify
│   │   ├── utils.ts                  # shadcn/ui cn() helper
│   │   ├── demo-guard.ts             # Demo mode backend guard
│   │   ├── query-client.ts           # TanStack Query config
│   │   ├── zai.ts                    # z-ai-web-dev-sdk (AI features)
│   │   ├── ai-token.ts               # AI token management
│   │   ├── chat-encryption.ts        # Chat encryption
│   │   ├── notification-sound.ts     # Notification sound
│   │   ├── quiz-sounds.ts            # Quiz game sounds
│   │   ├── cq-data.ts                # CodeQuest data
│   │   ├── seed-quiz.ts              # Quiz seeder
│   │   ├── hooks/
│   │   │   ├── use-toast.ts
│   │   │   ├── use-mobile.ts
│   │   │   └── use-queries.ts        # React Query hooks
│   │   └── security/
│   │       ├── validation.ts
│   │       ├── sanitize.ts
│   │       ├── rate-limit.ts
│   │       └── audit-logger.ts
│   │
│   ├── hooks/
│   │   ├── use-toast.ts
│   │   └── use-mobile.ts
│   │
│   └── middleware.ts.disabled        # Next.js middleware (currently disabled)
│
└── mini-services/
    ├── chat-service/                 # Socket.IO chat service (port 3001)
    │   ├── index.ts
    │   ├── package.json
    │   └── prisma/schema.prisma
    └── battle-service/               # Quiz battle service (port 3002)
        ├── index.ts
        └── package.json
```

---

## 3. IMPORTANT FILE CODES

### 3.1 `package.json`

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
    "db:generate": "prisma generate",
    "db:migrate": "prisma migrate dev",
    "db:reset": "prisma migrate reset"
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
    "next-auth": "^4.24.11",
    "next-themes": "^0.4.6",
    "prisma": "^6.11.1",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "react-hook-form": "^7.60.0",
    "recharts": "^2.15.4",
    "sharp": "^0.34.3",
    "socket.io-client": "^4.8.3",
    "sonner": "^2.0.6",
    "zod": "^4.0.2",
    "zustand": "^5.0.6",
    "@tanstack/react-query": "^5.82.0",
    "@tanstack/react-table": "^8.21.3",
    "@dnd-kit/core": "^6.3.1",
    "@dnd-kit/sortable": "^10.0.0",
    "@mdxeditor/editor": "^3.39.1",
    "@hookform/resolvers": "^5.1.1",
    "z-ai-web-dev-sdk": "^0.0.17",
    "@radix-ui/react-*": "various (25+ Radix UI packages)"
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

### 3.2 `next.config.ts`

```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  allowedDevOrigins: ['*.space.z.ai', '*.z.ai'],
  async headers() {
    return [
      {
        source: '/((?!_next/static|_next/image|favicon.ico|logo.png|sounds).*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
    ];
  },
};

export default nextConfig;
```

### 3.3 `prisma/schema.prisma`

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

model User {
  id          String   @id @default(cuid())
  name        String
  email       String   @unique
  password    String
  role        String   @default("STUDENT")
  verified    Boolean  @default(false)
  status      String   @default("ACTIVE")
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
  // Relations: subjects, assignments, submissions, comments,
  // notifications, announcements, chatMessages, quizAttempts,
  // quizProfile, savedBooks, battles, cqProfile, cqFriends, cqBattles
}

model Subject { ... }
model Assignment { ... }
model Submission { ... }
model Comment { ... }
model Notification { ... }
model Announcement { ... }
model ChatRoom { ... }
model ChatMessage { ... }
model QuizCategory { ... }
model QuizQuestion { ... }
model QuizAttempt { ... }
model QuizProfile { ... }
model SavedBook { ... }
model BattleRoom { ... }
model CQProfile { ... }
model CQFriend { ... }
model CQBattleSession { ... }
```

### 3.4 `src/app/page.tsx` (Entry Point)

```typescript
'use client';

import { useEffect, useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { useAppStore } from '@/store/app';

const AuthPage = dynamic(() => import('@/components/pages/AuthPage'), { ssr: false });
const AppLayout = dynamic(() => import('@/components/layout/AppLayout'), { ssr: false });

function ErrorFallback({ error, onRetry }: { error: Error; onRetry: () => void }) {
  // Error UI with retry button
}

export default function Home() {
  const [error, setError] = useState<Error | null>(null);
  const mounted = useAppStore((state) => state.mounted);
  const isAuthenticated = useAppStore((state) => state.isAuthenticated);

  useEffect(() => {
    document.documentElement.classList.add('hydrated');
    useAppStore.getState().hydrate();
  }, []);

  // Error handlers...

  if (!mounted) return null;
  if (error) return <ErrorFallback error={error} onRetry={handleRetry} />;

  return isAuthenticated ? <AppLayout /> : <AuthPage />;
}
```

### 3.5 `src/app/layout.tsx` (Root Layout)

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
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
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

### 3.6 `.env.example`

```bash
# ═══════════════════════════════════════════════════════
# Database
# ═══════════════════════════════════════════════════════
DATABASE_URL="file:./db/custom.db"

# ═══════════════════════════════════════════════════════
# JWT Authentication
# ═══════════════════════════════════════════════════════
JWT_SECRET="your-random-40-char-secret-here"

# ═══════════════════════════════════════════════════════
# Firebase Configuration (Client-side — PUBLIC)
# ═══════════════════════════════════════════════════════
NEXT_PUBLIC_FIREBASE_API_KEY="your-api-key"
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="your-project.firebaseapp.com"
NEXT_PUBLIC_FIREBASE_PROJECT_ID="your-project-id"
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="your-project.appspot.com"
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="123456789"
NEXT_PUBLIC_FIREBASE_APP_ID="1:123456789:web:abcdef"

# ═══════════════════════════════════════════════════════
# Firebase Admin SDK (Server-side — KEEP SECRET!)
# ═══════════════════════════════════════════════════════
FIREBASE_PROJECT_ID="your-project-id"
FIREBASE_CLIENT_EMAIL="your-service-account@iam.gserviceaccount.com"
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_KEY_HERE\n-----END PRIVATE KEY-----"
```

### 3.7 `firebase.json` (Create for deployment)

```json
{
  "hosting": {
    "public": "out",
    "ignore": [
      "firebase.json",
      "**/.*",
      "**/node_modules/**"
    ],
    "rewrites": [
      { "source": "/api/**", "function": "api" },
      { "source": "**", "destination": "/index.html" }
    ]
  }
}
```

### 3.8 `.firebaserc` (Create for deployment)

```json
{
  "projects": {
    "default": "pu-alrms"
  }
}
```

---

## 4. BUILD & DEPLOYMENT

### 4.1 Build Commands

```bash
# Install dependencies
npm install          # or: bun install

# Generate Prisma client
npx prisma generate  # or: bunx prisma generate

# Build for production
npm run build
# This runs: next build && cp -r .next/static .next/standalone/.next/ && cp -r public .next/standalone/
```

### 4.2 Output/Build Folder

| Folder | Description |
|--------|-------------|
| `.next/standalone/` | **Standalone server** — contains Node.js server + compiled code |
| `.next/static/` | Static assets (copied into standalone by build script) |
| `public/` | Static files (copied into standalone by build script) |

**IMPORTANT**: Next.js `standalone` output does NOT produce a static `dist/` or `out/` folder. It produces a **Node.js server** at `.next/standalone/server.js` that must be run with `node` or `bun`.

### 4.3 Current Start Command

```bash
# Production
bun .next/standalone/server.js

# Development
bun run dev    # next dev -p 3000
```

---

## 5. BACKEND / API / DATABASE

### 5.1 Database: SQLite via Prisma ORM
- **Provider**: `sqlite`
- **Location**: `file:./db/custom.db`
- **Schema**: 15 models (User, Subject, Assignment, Submission, Comment, Notification, Announcement, ChatRoom, ChatMessage, QuizCategory, QuizQuestion, QuizAttempt, QuizProfile, SavedBook, BattleRoom, CQProfile, CQFriend, CQBattleSession)
- **Setup**: `npx prisma db push`
- **Seed**: `npx prisma db seed` (creates demo users + data)

### 5.2 API Routes (44 route files)
| Category | Endpoints |
|----------|-----------|
| **Auth** | `/api/auth/login`, `/api/auth/register`, `/api/auth/firebase`, `/api/auth/google`, `/api/auth/temp-email`, `/api/auth/seed`, `/api/auth/profile`, `/api/auth/profile/photo` |
| **Assignments** | `/api/assignments`, `/api/assignments/[id]` |
| **Submissions** | `/api/submissions`, `/api/submissions/[id]/grade` |
| **Announcements** | `/api/announcements`, `/api/announcements/[id]` |
| **Notifications** | `/api/notifications`, `/api/notifications/[id]/read` |
| **Comments** | `/api/comments` |
| **Subjects** | `/api/subjects` |
| **Batches** | `/api/batches` |
| **Dashboard** | `/api/dashboard` |
| **Leaderboard** | `/api/leaderboard` |
| **Admin** | `/api/admin/stats`, `/api/admin/users`, `/api/admin/logs` |
| **AI** | `/api/ai/chat`, `/api/ai/generate-image`, `/api/ai/scan`, `/api/ai/token` |
| **Quiz** | `/api/quiz/categories`, `/api/quiz/questions`, `/api/quiz/profile`, `/api/quiz/seed`, `/api/quiz/battle`, `/api/quiz/leaderboard` |
| **CodeQuest** | `/api/cq/profile`, `/api/cq/friends`, `/api/cq/battle`, `/api/cq/leaderboard` |
| **Chat** | `/api/chat/rooms`, `/api/chat/rooms/join`, `/api/chat/messages` |
| **Books** | `/api/books/search`, `/api/books/books/saved` |

### 5.3 Authentication Flow
1. **Email/Password**: POST `/api/auth/login` → JWT token
2. **Firebase Google**: `signInWithPopup()` → POST `/api/auth/firebase` (exchange ID token) → JWT token
3. **Google Manual**: POST `/api/auth/google` → JWT token
4. **Temp Email**: POST `/api/auth/temp-email` → JWT token
5. JWT token sent as `Authorization: Bearer <token>` header

### 5.4 Mini-Services (Socket.IO)
| Service | Port | Purpose |
|---------|------|---------|
| `chat-service` | 3001 | Real-time chat rooms |
| `battle-service` | 3002 | Quiz battle WebSocket |

---

## 6. FIREBASE SERVICES NEEDED

| Service | Required? | Purpose |
|---------|-----------|---------|
| **Firebase Hosting** | ✅ YES | Serve the frontend |
| **Firebase Authentication** | ✅ YES | Google Sign-In provider |
| **Firebase Cloud Functions** | ✅ YES | Run API routes (server-side) |
| **Firestore** | ❌ No | Not used (uses SQLite/Prisma) |
| **Realtime Database** | ❌ No | Not used |
| **Cloud Storage** | ❌ No | Uses local file uploads |
| **Firebase App Hosting** | ✅ ALTERNATIVE | Better than Hosting + Functions for full-stack Next.js |

---

## 7. DEPLOYMENT OPTIONS

### Option A: Firebase App Hosting (Recommended — Best for Next.js full-stack)
```bash
npm install -g firebase-tools
firebase login
firebase init hosting  # Choose "App Hosting"
firebase deploy
```

### Option B: Firebase Hosting + Cloud Functions
1. Export static output: Change `next.config.ts` to `output: "export"` (loses all API routes)
2. Use Cloud Functions for API routes
3. Configure rewrites in `firebase.json`

### Option C: Vercel (Simplest for Next.js)
```bash
npx vercel
```
> Vercel natively supports Next.js App Router + API routes + standalone output

### Option D: Docker
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY . .
RUN npx prisma generate && npm run build
EXPOSE 3000
CMD ["node", ".next/standalone/server.js"]
```

---

## 8. WARNINGS & IMPORTANT NOTES

### ⚠️ Critical Issues
1. **SQLite will NOT work on Firebase Hosting** — it's a local file database. For production, migrate to:
   - **Firestore** (Firebase native)
   - **PostgreSQL** (via Supabase, Neon, or PlanetScale)
   - **MySQL** (via PlanetScale)

2. **`output: "standalone"` is for Node.js server**, NOT static hosting. For pure static hosting:
   - Change to `output: "export"` in `next.config.ts`
   - BUT this will **BREAK all API routes** (no server-side code)

3. **Mini-services** (`chat-service`, `battle-service`) run on separate ports (3001, 3002). These need their own hosting.

4. **`z-ai-web-dev-sdk`** is a proprietary SDK for AI features — it may not work outside the development environment.

### 🔒 Sensitive Info (Hidden)
- `JWT_SECRET` — random 40-char string
- `FIREBASE_PRIVATE_KEY` — RSA private key
- `FIREBASE_CLIENT_EMAIL` — service account email
- `NEXT_PUBLIC_FIREBASE_API_KEY` — Firebase API key (public but project-specific)
- Seed passwords: `admin123`, `teacher123`, `student123`

### 📋 Dependencies That Need Attention
- `sharp` — native module, may need special handling during build
- `bcryptjs` — used for password hashing (not native, should be fine)
- `socket.io-client` — frontend only, no server socket.io dependency (mini-services handle that)
- `next-auth` — listed but NOT actively used (custom JWT auth is used instead)

### 🎨 UI Notes
- Default theme: **dark mode**
- Color scheme: emerald/green primary (NOT indigo/blue)
- Responsive: mobile-first with desktop sidebar
- Uses shadcn/ui New York style with Lucide icons
- Framer Motion for page transitions and animations
- Sonner for toast notifications

---

## 9. SUMMARY FOR AI ASSISTANT

> **Please help me deploy this Next.js 16 full-stack app (PU-ALRMS) to Firebase Hosting.**
>
> Key points:
> - **Framework**: Next.js 16.1.1 with App Router, TypeScript, React 19
> - **Build**: `npm run build` → produces `.next/standalone/` (Node.js server, NOT static)
> - **Database**: SQLite via Prisma (needs migration to Firestore/PostgreSQL for cloud deployment)
> - **Auth**: Custom JWT + optional Firebase Google Auth
> - **API Routes**: 44 endpoints under `/api/*`
> - **Firebase Services**: Need Hosting + Cloud Functions (or Firebase App Hosting)
> - **Mini-services**: 2 Socket.IO services on ports 3001, 3002
> - **Sensitive env vars**: JWT_SECRET, FIREBASE_PRIVATE_KEY, FIREBASE_CLIENT_EMAIL (see `.env.example`)
