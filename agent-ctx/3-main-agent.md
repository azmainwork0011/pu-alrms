---
Task ID: 3
Agent: Main Agent
Task: AI Token Management System — Graceful handling + Admin configuration UI

## Summary of Work

### Files Created
1. **`/src/lib/ai-token.ts`** — Centralized AI token management module with 6 exported functions:
   - `getToken()`, `setToken()`, `hasToken()`, `clearToken()`, `resetCache()`, `getTokenStatus()`
   - Reads from: env var → in-memory cache → local .z-ai-config → /etc/.z-ai-config

2. **`/src/app/api/ai/token/route.ts`** — Admin token management REST endpoint:
   - GET: Token status (no value exposed)
   - POST: Save token (ADMIN/TEACHER only)
   - DELETE: Remove token (ADMIN/TEACHER only)
   - All methods require JWT auth

### Files Modified
1. **`/src/app/api/ai/chat/route.ts`** — Replaced inline token logic with `ai-token` module, added `AI_TOKEN_MISSING` and `AI_TOKEN_INVALID` error codes
2. **`/src/lib/api.ts`** — Enhanced `apiFetch()` to propagate `code` field from error responses
3. **`/src/components/pages/AIChatPage.tsx`** — Added 4 error-specific UI messages, settings gear icon for admin/teacher, Sheet component for token management
4. **`.z-ai-config`** — Removed empty `"token": ""` field

### Architecture
- **Token Flow**: Backend checks `hasToken()` before any AI SDK call → returns `AI_TOKEN_MISSING` (503) if no token → frontend shows "AI Configuration Needed" message
- **Admin Config**: Admin/Teacher users see settings gear icon → opens Sheet → can set/test/remove token
- **Error Codes**: `AI_TOKEN_MISSING`, `AI_TOKEN_INVALID`, `AI_SERVICE_UNAVAILABLE`, `AI_RATE_LIMITED`, `AI_ERROR`, `UNKNOWN_ERROR`

### Verification
- ESLint: 0 errors, 0 warnings
- Dev server compiles successfully
