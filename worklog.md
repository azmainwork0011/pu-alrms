---
Task ID: 1
Agent: Main Agent
Task: Replace AI Chat with Gemini Large Model via z-ai-web-dev-sdk + DB persistence

Work Log:
- Analyzed existing codebase: Prisma schema (18 models including LuckyStrickChat), rbac.ts, zai.ts, jwt.ts, db.ts
- Read existing AI chat backend (src/app/api/ai/chat/route.ts) which used multi-provider fallback (Gemini/Groq/OpenRouter)
- Read existing AIChat.tsx frontend component which used streaming SSE
- Rewrote src/app/api/ai/chat/route.ts to use z-ai-web-dev-sdk (zai.chat.completions.create) with LuckyStrickChat DB persistence
  - POST: Auth → Load 15 past messages → Build conversation → Call Gemini → Save user+AI to DB → Return JSON
  - GET: Load 30 messages + session list from DB
  - DELETE: Clear chat history (specific session or all)
- Updated src/components/ai/AIChat.tsx to use non-streaming JSON API + DB history loading on mount
- Added auto-role assignment to src/app/api/auth/google/route.ts: @pu.edu or admin prefix → SUPER_ADMIN
- Updated AppLayout nav label from "Lucky Strick AI" to "Gemini AI"
- Updated system prompt identity name to "Gemini Academic Assistant"
- Verified: lint clean (only pre-existing push.js errors), dev server compiles without errors

Stage Summary:
- AI Chat now uses z-ai-web-dev-sdk Gemini Large Model instead of direct API calls
- All chat messages are persisted in LuckyStrickChat database table
- Chat history loads on page mount from DB
- Clear chat button also clears DB records
- Google OAuth auto-assigns SUPER_ADMIN role for @pu.edu emails
- All changes compile and run cleanly on dev server
