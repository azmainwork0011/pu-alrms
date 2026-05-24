# PU-ALRMS Worklog

---
Task ID: 1
Agent: Main
Task: Fix database connection and enable login functionality

Work Log:
- Identified that DATABASE_URL was a dummy Postgres value and no Postgres server was running
- Switched Prisma schema from PostgreSQL back to SQLite for local sandbox development
- Simplified src/lib/db.ts to standard PrismaClient (removed Neon adapter for local dev)
- Updated .env with SQLite DATABASE_URL
- Generated Prisma client and pushed schema (system env overrides to custom.db)
- Seeded database with demo accounts (CR, Student, Teacher, Admin) + quiz categories + subjects
- Verified dev server starts and serves requests through proxy
- Tested email/password login API: alice@stu.pu.edu/student123 returns valid JWT + user data
- Verified database health check: /api/health/db returns {"ok":true,"latency":"3ms"}
- Google OAuth button visible in UI but sandbox limitations prevent OAuth redirect flow

Stage Summary:
- Database: SQLite (custom.db) working with all tables and seeded data
- Email/password login: ✅ Working (bcrypt authentication)
- Demo login: ✅ Working (Try Demo button)
- Google OAuth: ⚠️ Button visible but redirect won't complete in sandbox (needs real URL)
- All API endpoints return 200 (/, /api/auth/session, /api/health/db, /api/dashboard)
