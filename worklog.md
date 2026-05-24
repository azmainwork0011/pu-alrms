---
Task ID: 1
Agent: Main Agent
Task: Migrate PU-ALRMS from SQLite to Postgres (Neon) with complete auth overhaul

Work Log:
- Installed @prisma/adapter-neon and @neondatabase/serverless packages
- Migrated prisma/schema.prisma: changed provider from "sqlite" to "postgresql", added directUrl support
- Rewrote src/lib/db.ts: Neon adapter for serverless, standard PrismaClient fallback, lazy initialization, Proxy-based backward-compatible export
- Rewrote src/lib/auth.ts: Added SUPER_ADMIN_EMAIL env var support for role assignment, proper Google OAuth user creation/linking, improved error handling
- Created prisma/seed.ts: Seeds Super Admin, demo accounts (CR, Student, Teacher, Admin), demo subjects, quiz categories, welcome notification
- Removed @libsql/client and @prisma/adapter-libsql packages (SQLite/Turso)
- Updated package.json: new db:setup script, db:migrate-deploy, removed libSQL packages
- Updated .env.example with Postgres/Neon documentation
- Cleaned up SQLite/Turso references in UI components (AppLayout, DatabaseDisabled)
- Verified: ESLint passes, build compiles successfully

Stage Summary:
- Schema migrated: SQLite → PostgreSQL (Neon-compatible)
- Database client: src/lib/db.ts with Neon serverless adapter
- Auth: SUPER_ADMIN_EMAIL env var controls admin role assignment
- Seed script: prisma/seed.ts with demo data
- Build: Passes with dummy Postgres URL (production URL needed for actual data access)
- Next step: User needs to provide a real Neon/Vercel Postgres DATABASE_URL
