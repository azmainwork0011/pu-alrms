# Task 3-8: Build ALL API Routes for PU-ALRMS System

## Agent: full-stack-developer
## Date: 2025-06-01

## Summary
Built all 19 API routes for the University Assignment & Lab Report Management System. All routes pass ESLint with zero errors. Database schema is in sync.

## Routes Created (15 files, 19 endpoints)

### Authentication (3 endpoints)
1. **POST /api/auth/login** - Email/password login with bcrypt comparison, returns JWT + user
2. **POST /api/auth/register** - User registration with bcrypt (12 rounds), defaults to STUDENT role, ADMIN-only TEACHER creation
3. **GET /api/auth/profile** - JWT-verified user profile retrieval (no password)

### Assignments (5 endpoints)
4. **GET /api/assignments** - List with filters (type, subjectId, status), role-based visibility (TEACHER=own, STUDENT=active only, ADMIN=all), includes subject + creator info + counts
5. **POST /api/assignments** - TEACHER-only creation, validates subject, creates notifications for all students
6. **GET /api/assignments/[id]** - Detail with subject, creator, submissions, and comments
7. **PUT /api/assignments/[id]** - TEACHER/ADMIN update (teachers restricted to own), partial update support
8. **DELETE /api/assignments/[id]** - Soft delete via ARCHIVED status (TEACHER/ADMIN only)

### Submissions (3 endpoints)
9. **GET /api/submissions** - List with filters (assignmentId, studentId), STUDENT sees own only
10. **POST /api/submissions** - STUDENT-only submit, deadline check (auto-marks LATE), duplicate check, notifies teacher
11. **PUT /api/submissions/[id]/grade** - TEACHER-only grading, verifies ownership, notifies student

### Comments (2 endpoints)
12. **GET /api/comments** - List by assignmentId with user info, ordered ascending
13. **POST /api/comments** - Create comment with JWT user, validates assignment exists

### Notifications (2 endpoints)
14. **GET /api/notifications** - User's notifications ordered by createdAt desc
15. **PUT /api/notifications/[id]/read** - Mark as read with ownership check

### Dashboard (1 endpoint)
16. **GET /api/dashboard** - Role-specific stats:
    - STUDENT: pending count, submitted count, upcoming deadlines (7 days), avg marks
    - TEACHER: created count, total submissions, pending grading, avg student marks
    - ADMIN: total users/assignments/submissions, subject stats, users by role

### Leaderboard (1 endpoint)
17. **GET /api/leaderboard** - Students ranked by average marks from graded submissions

### AI Chat (1 endpoint)
18. **POST /api/ai/chat** - Uses z-ai-web-dev-sdk LLM, system prompt as academic assistant, includes user context

### Subjects (1 endpoint)
19. **GET /api/subjects** - All subjects with teacher info and assignment counts

## Key Design Decisions
- Helper function `getTokenPayload()` extracted in routes with shared auth logic
- All dynamic route params use `Promise<{ id: string }>` pattern for Next.js 16
- Role-based access control at every endpoint
- Notifications automatically created on assignment creation, submission, and grading
- Soft delete pattern for assignments (ARCHIVED status)
- Comprehensive error handling with try/catch and appropriate HTTP status codes
- Password excluded from all user responses via destructuring

## Files Created
- `src/app/api/auth/login/route.ts`
- `src/app/api/auth/register/route.ts`
- `src/app/api/auth/profile/route.ts`
- `src/app/api/assignments/route.ts`
- `src/app/api/assignments/[id]/route.ts`
- `src/app/api/submissions/route.ts`
- `src/app/api/submissions/[id]/grade/route.ts`
- `src/app/api/comments/route.ts`
- `src/app/api/notifications/route.ts`
- `src/app/api/notifications/[id]/read/route.ts`
- `src/app/api/dashboard/route.ts`
- `src/app/api/leaderboard/route.ts`
- `src/app/api/ai/chat/route.ts`
- `src/app/api/subjects/route.ts`

## Verification
- ESLint: ✅ 0 errors, 0 warnings
- Database: ✅ Schema in sync, Prisma client generated
- All 15 route files present and complete
