---
Task ID: 1
Agent: Main Agent
Task: Build PU-ALRMS (Prime University Assignment & Lab Report Management System)

Work Log:
- Set up Prisma schema with 6 models: User, Subject, Assignment, Submission, Comment, Notification
- Created comprehensive seed data: 1 admin, 2 teachers, 8 students, 4 subjects, 8 assignments, 18 submissions, 7 comments, 8 notifications
- Built JWT authentication utility with sign/verify functions
- Created 19 API endpoints across auth, assignments, submissions, comments, notifications, dashboard, leaderboard, AI chat, and subjects
- Built Zustand store for auth state, navigation, and UI state
- Created API client library with typed fetch functions
- Built complete single-page application with 10 views:
  - Auth (Login/Register with demo accounts)
  - Dashboard (role-based: Student/Teacher/Admin)
  - Assignments List (with filters and search)
  - Lab Reports List (filtered by type)
  - Assignment Detail (with submissions, grading, comments)
  - Create Assignment (teacher form)
  - Submissions Page (role-based)
  - AI Chat Interface (with suggested prompts)
  - Leaderboard (ranked students with podium)
  - Notifications (with unread indicators)
  - Profile Page (with stats and sign out)
- Responsive layout with mobile sidebar (Sheet) and desktop sidebar
- Emerald/green color scheme for academic feel
- ESLint passes with 0 errors

Stage Summary:
- Complete full-stack academic management system
- JWT-based authentication with role-based access control
- AI chat assistant powered by z-ai-web-dev-sdk LLM
- All views functional with loading states and error handling
- Mobile-first responsive design
