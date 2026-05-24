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

---
Task ID: 2
Agent: Main Agent
Task: Create multi-provider AI backend library (src/lib/ai/)

Work Log:
- Created src/lib/ai/system-prompts.ts: ACADEMIC_PROMPT (dynamic date, Bangla/English, academic rules) and VOICE_PROMPT (short navigation guide, Bangla/English)
- Created src/lib/ai/gemini.ts: Google Gemini REST API wrapper (gemini-2.0-flash), streaming via SSE endpoint, 20s AbortController timeout, systemInstruction support, isGeminiAvailable()
- Created src/lib/ai/groq.ts: Groq REST API wrapper (llama-3.1-8b-instant), OpenAI-compatible format, streaming via SSE, 20s timeout, isGroqAvailable()
- Created src/lib/ai/openrouter.ts: OpenRouter REST API wrapper (meta-llama/llama-3.1-8b-instruct:free), OpenAI-compatible format, streaming via SSE, 20s timeout, HTTP-Referer/X-Title headers, isOpenRouterAvailable()
- Created src/lib/ai/router.ts: Central AI router with mode→provider mapping (academic/math/bangla/assignment/labReport/reasoning/voice → Gemini; coding/fastChat → Groq), fallback chain Gemini→Groq→OpenRouter, 1 retry per provider, streaming support with mid-stream graceful handling, sanitizeOutput() strips dangerous HTML/tags/event handlers while preserving markdown, getModesList() returns 9 modes with labels/icons/descriptions

Stage Summary:
- 5 server-only modules under src/lib/ai/
- All use native fetch (no external SDKs), 'use server' directive
- API keys read from process.env only, never logged
- 3 free-tier providers with automatic failover
- Streaming preferred; falls back to next provider on connection failure
- ESLint passes cleanly
- Next step: Create API route handlers to expose AI functionality to the frontend

---
Task ID: 3
Agent: Main Agent
Task: Create modern AI frontend components (src/components/ai/)

Work Log:
- Created src/components/ai/TypingMessage.tsx: 3-dot bouncing animation with customizable text (defaults to "Thinking..."), uses framer-motion with staggered delays
- Created src/components/ai/AIStatusBadge.tsx: Provider status indicator fetching from /api/ai/status, shows green/yellow/red dot for ok/degraded/down states, loading pulse skeleton, uses shadcn Badge
- Created src/components/ai/ModelSelector.tsx: 8-mode selector (Academic, Coding, Math, Assignment, Lab Report, Fast Chat, Reasoning, Bangla) with color-coded pills, horizontal scroll on mobile, flex-wrap on desktop, glassmorphism container, integrates AIStatusBadge, framer-motion hover/tap animations
- Created src/components/ai/VoiceAssistant.tsx: Floating voice assistant with 56px gradient button (bottom-right), expandable glassmorphism panel, Web Speech API SpeechRecognition for voice input, SpeechSynthesis for TTS output, auto Bangla/English detection from transcript content, mute/unmute toggle, re-speak capability, live interim transcript display, AI response via /api/ai/voice, waveform animation during speech, graceful fallback if SpeechRecognition unsupported
- Created src/components/ai/AIChat.tsx: Primary chat component with full message history, SSE streaming from /api/ai/chat with data: line parsing and [DONE] signal handling, AbortController for stop-generating, ModeSelector integration, TypingMessage during streaming, retry button on error responses, copy-to-clipboard per message, clear chat, welcome screen with 4 starter prompts per mode, ReactMarkdown with custom CodeBlock component (dark header bar, traffic-light dots, language tag, copy button), duplicate request prevention via debounce + lastRequest tracking, max 50 messages, auto-scroll to bottom, loading skeleton on mount, responsive design, dark mode, Bangla & English support

Stage Summary:
- 5 new client components under src/components/ai/
- All use 'use client' directive, shadcn/ui components, lucide-react icons, framer-motion animations
- Full dark mode support via Tailwind dark: prefix
- Mobile-first responsive with sm:/md:/lg: breakpoints
- ESLint passes cleanly on all 5 new files (0 errors, 0 warnings)
- Dev server compiles successfully
- Dependencies used: react-markdown, framer-motion, sonner (all pre-installed)
- Next step: Wire AIChat into AppLayout page routing

---
Task ID: 4
Agent: API Routes Agent
Task: Create AI API routes (chat, voice, models, status)

Work Log:
- REPLACED src/app/api/ai/chat/route.ts: Full rewrite with JWT auth, zod validation (message max 4000 chars, mode enum, history max 40 messages), rate limiting (30 req/min), duplicate detection (same message within 2s → 429), mode-based system prompts (academic/coding/math/assignment/labReport/fastChat/reasoning/bangla/voice), SSE streaming via chatAI() from router.ts, AbortController support for request cancellation, HTML/script sanitization on output, proper SSE format (data: {"content":"..."}\n\n + data: [DONE]\n\n), handles both ReadableStream and string responses
- CREATED src/app/api/ai/voice/route.ts: POST endpoint for voice assistant, JWT auth, rate limiting (20 req/min), zod validation (message max 1000 chars), uses VOICE_PROMPT from system-prompts.ts, non-streaming chatAI call with mode='voice', truncates responses > 500 chars for voice readability, returns JSON { response, provider }, handles AbortError gracefully
- CREATED src/app/api/ai/models/route.ts: GET endpoint (no auth required), returns available modes (8 modes with icons/descriptions), provider statuses (Gemini/Groq/OpenRouter with availability + model name), fallback order, uses getProviderStatuses() and getModesList() from router.ts with static fallback if router not yet available, graceful error handling with degraded response
- CREATED src/app/api/ai/status/route.ts: GET endpoint (no auth), health check for all 3 AI providers, parallel provider pinging with 5s timeout via createTimeout() helper, returns overall status (ok/degraded/down), per-provider availability + latency + error, imports isGeminiAvailable/isGroqAvailable/isOpenRouterAvailable directly, never exposes API keys

Stage Summary:
- 4 API route files created/replaced under src/app/api/ai/
- All routes are server-side only (app/api directory), API keys never exposed
- Shared patterns: zod validation, JWT auth (where required), rate limiting, AbortController support, output sanitization
- SSE streaming format standardized: data: {"content":"chunk"}\n\n + data: [DONE]\n\n
- Chat route supports 8 AI modes with mode-specific system prompts
- Duplicate detection prevents spam (same message within 2 seconds)
- Status endpoint does live health checks with parallel execution
- ESLint passes cleanly (0 errors, 0 warnings)

---
Task ID: 2
Agent: Main Agent (coordinated 3 sub-agents)
Task: Complete AI system overhaul — multi-provider backend, API routes, frontend components

Work Log:
- Removed 'use server' from AI lib files (not needed for API route imports)
- Removed old AI routes: /api/ai/chat/stream, /api/ai/generate-image, /api/ai/scan, /api/ai/search, /api/ai/token
- Updated AppLayout.tsx: replaced AIChatPage with new AIChat component, added VoiceAssistant
- Updated .env.example and .env with GEMINI_API_KEY, GROQ_API_KEY, OPENROUTER_API_KEY
- Build verified: 0 errors, lint clean

Stage Summary:
- AI Backend: 5 files (gemini.ts, groq.ts, openrouter.ts, router.ts, system-prompts.ts)
- API Routes: 4 files (chat, voice, models, status)
- Frontend Components: 5 files (AIChat, ModelSelector, VoiceAssistant, TypingMessage, AIStatusBadge)
- Old routes removed: 5 files
- Integration: AppLayout updated, VoiceAssistant floating button added
- All builds and lints pass
