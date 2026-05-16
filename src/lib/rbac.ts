/**
 * Role-Based Access Control (RBAC) System
 *
 * Defines permissions for each role and provides middleware functions
 * for protecting API routes. Demo (guest) users have the most restrictive
 * access — read-only on public content only.
 *
 * Role hierarchy (highest to lowest privilege):
 *   SUPER_ADMIN > ADMIN > DEVELOPER > TEACHER > CR > STUDENT > GUEST (demo)
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, type JWTPayload } from '@/lib/jwt';
import { logAudit } from '@/lib/security/audit-logger';

// ─── Role Definitions ──────────────────────────────────────
export const ROLES = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  ADMIN: 'ADMIN',
  DEVELOPER: 'DEVELOPER',
  TEACHER: 'TEACHER',
  CR: 'CR',
  STUDENT: 'STUDENT',
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

// Hierarchy map: role → minimum privilege level (higher = more access)
const ROLE_LEVELS: Record<string, number> = {
  [ROLES.SUPER_ADMIN]: 100,
  [ROLES.ADMIN]: 80,
  [ROLES.DEVELOPER]: 70,
  [ROLES.TEACHER]: 50,
  [ROLES.CR]: 30,
  [ROLES.STUDENT]: 20,
};

// ─── Permission Definitions ────────────────────────────────
export type Permission =
  // Admin & system
  | 'admin:access'
  | 'admin:users:list'
  | 'admin:users:modify'
  | 'admin:stats:view'
  | 'admin:logs:view'
  // Assignments
  | 'assignment:view'
  | 'assignment:create'
  | 'assignment:edit'
  | 'assignment:delete'
  // Submissions
  | 'submission:view'
  | 'submission:create'
  | 'submission:grade'
  // Announcements
  | 'announcement:view'
  | 'announcement:create'
  | 'announcement:edit'
  | 'announcement:delete'
  // Chat
  | 'chat:access'
  | 'chat:send'
  // Quiz
  | 'quiz:view'
  | 'quiz:play'
  // Profile
  | 'profile:view'
  | 'profile:edit'
  // AI
  | 'ai:chat'
  | 'ai:generate'
  // Books
  | 'books:view'
  | 'books:save'
  // Leaderboard
  | 'leaderboard:view'
  // Dashboard
  | 'dashboard:view'
  | 'dashboard:admin'
  // Notifications
  | 'notification:view'
  | 'notification:manage'
  // Subjects
  | 'subject:view'
  | 'subject:create'
  | 'subject:edit';

// ─── Role-Permission Matrix ────────────────────────────────
const ROLE_PERMISSIONS: Record<string, Permission[]> = {
  [ROLES.SUPER_ADMIN]: [
    // Everything
    'admin:access', 'admin:users:list', 'admin:users:modify', 'admin:stats:view', 'admin:logs:view',
    'assignment:view', 'assignment:create', 'assignment:edit', 'assignment:delete',
    'submission:view', 'submission:create', 'submission:grade',
    'announcement:view', 'announcement:create', 'announcement:edit', 'announcement:delete',
    'chat:access', 'chat:send',
    'quiz:view', 'quiz:play',
    'profile:view', 'profile:edit',
    'ai:chat', 'ai:generate',
    'books:view', 'books:save',
    'leaderboard:view',
    'dashboard:view', 'dashboard:admin',
    'notification:view', 'notification:manage',
    'subject:view', 'subject:create', 'subject:edit',
  ],
  [ROLES.ADMIN]: [
    'admin:access', 'admin:users:list', 'admin:users:modify', 'admin:stats:view', 'admin:logs:view',
    'assignment:view', 'assignment:create', 'assignment:edit', 'assignment:delete',
    'submission:view', 'submission:create', 'submission:grade',
    'announcement:view', 'announcement:create', 'announcement:edit', 'announcement:delete',
    'chat:access', 'chat:send',
    'quiz:view', 'quiz:play',
    'profile:view', 'profile:edit',
    'ai:chat', 'ai:generate',
    'books:view', 'books:save',
    'leaderboard:view',
    'dashboard:view', 'dashboard:admin',
    'notification:view', 'notification:manage',
    'subject:view', 'subject:create', 'subject:edit',
  ],
  [ROLES.DEVELOPER]: [
    'admin:access', 'admin:stats:view',
    'assignment:view', 'assignment:create', 'assignment:edit',
    'submission:view', 'submission:create',
    'announcement:view', 'announcement:create',
    'chat:access', 'chat:send',
    'quiz:view', 'quiz:play',
    'profile:view', 'profile:edit',
    'ai:chat', 'ai:generate',
    'books:view', 'books:save',
    'leaderboard:view',
    'dashboard:view', 'dashboard:admin',
    'notification:view', 'notification:manage',
    'subject:view', 'subject:create', 'subject:edit',
  ],
  [ROLES.TEACHER]: [
    'assignment:view', 'assignment:create', 'assignment:edit',
    'submission:view', 'submission:grade',
    'announcement:view', 'announcement:create',
    'chat:access', 'chat:send',
    'quiz:view',
    'profile:view', 'profile:edit',
    'ai:chat',
    'books:view', 'books:save',
    'leaderboard:view',
    'dashboard:view',
    'notification:view', 'notification:manage',
    'subject:view',
  ],
  [ROLES.CR]: [
    'assignment:view',
    'submission:view', 'submission:create',
    'announcement:view',
    'chat:access', 'chat:send',
    'quiz:view', 'quiz:play',
    'profile:view', 'profile:edit',
    'ai:chat',
    'books:view', 'books:save',
    'leaderboard:view',
    'dashboard:view',
    'notification:view',
    'subject:view',
  ],
  [ROLES.STUDENT]: [
    'assignment:view',
    'submission:view', 'submission:create',
    'announcement:view',
    'chat:access', 'chat:send',
    'quiz:view', 'quiz:play',
    'profile:view', 'profile:edit',
    'ai:chat',
    'books:view', 'books:save',
    'leaderboard:view',
    'dashboard:view',
    'notification:view',
    'subject:view',
  ],
};

// Demo (Guest) users get a very limited read-only set
const DEMO_PERMISSIONS: Permission[] = [
  'assignment:view',
  'announcement:view',
  'quiz:view',
  'profile:view',
  'books:view',
  'leaderboard:view',
  'dashboard:view',
  'notification:view',
  'subject:view',
];

// ─── Sensitive endpoints blocked for demo users ────────────
const DEMO_BLOCKED_ENDPOINTS: string[] = [
  '/api/admin/',
  '/api/users/',         // Future user listing
  '/api/chat/',
  '/api/ai/',
  '/api/submissions',    // POST (create)
  '/api/comments',       // POST (create)
];

// ─── Helper: Check permission ──────────────────────────────
export function hasPermission(role: string, permission: Permission): boolean {
  if (ROLE_PERMISSIONS[role]) {
    return ROLE_PERMISSIONS[role].includes(permission);
  }
  return false;
}

export function hasDemoPermission(permission: Permission): boolean {
  return DEMO_PERMISSIONS.includes(permission);
}

// ─── Helper: Check minimum role level ──────────────────────
export function hasMinRole(userRole: string, minRole: string): boolean {
  const userLevel = ROLE_LEVELS[userRole] ?? 0;
  const minLevel = ROLE_LEVELS[minRole] ?? 0;
  return userLevel >= minLevel;
}

// ─── Authenticate request & extract payload ────────────────
export function authenticateRequest(req: NextRequest): {
  authenticated: true;
  payload: JWTPayload;
  isDemo: boolean;
} | {
  authenticated: false;
  response: NextResponse;
} {
  const token = req.headers.get('authorization')?.replace('Bearer ', '');
  if (!token) {
    return {
      authenticated: false,
      response: NextResponse.json(
        { error: 'Authentication required', code: 'AUTH_REQUIRED' },
        { status: 401 },
      ),
    };
  }

  const payload = verifyToken(token);
  if (!payload) {
    return {
      authenticated: false,
      response: NextResponse.json(
        { error: 'Invalid or expired token', code: 'INVALID_TOKEN' },
        { status: 401 },
      ),
    };
  }

  const isDemo = req.headers.get('X-Demo-Mode') === 'true';
  return { authenticated: true, payload, isDemo };
}

// ─── RBAC Guard Middleware ─────────────────────────────────
// Use in API routes to enforce role-based access control
export function requirePermission(permission: Permission, options?: {
  requireAuth?: boolean;
  allowDemo?: boolean;
}) {
  const { requireAuth = true, allowDemo = false } = options ?? {};

  return function guard(req: NextRequest) {
    const auth = authenticateRequest(req);
    if (!auth.authenticated) {
      return auth.response;
    }

    const { payload, isDemo } = auth;

    // Demo users: check against demo-only permissions unless explicitly allowed
    if (isDemo) {
      if (allowDemo) return null;

      // Block all write operations for demo users
      const method = req.method.toUpperCase();
      if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(method)) {
        logAudit({
          userId: payload.userId,
          action: 'DEMO_WRITE_BLOCKED',
          resource: 'demo',
          details: JSON.stringify({ permission, method, path: new URL(req.url).pathname }),
          ipAddress: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || undefined,
          status: 'BLOCKED',
        }).catch(() => {});

        return NextResponse.json(
          { error: 'Write operations are disabled in demo mode.', code: 'DEMO_MODE_BLOCKED' },
          { status: 403 },
        );
      }

      // Check read permissions for demo
      if (!hasDemoPermission(permission)) {
        logAudit({
          userId: payload.userId,
          action: 'DEMO_ACCESS_DENIED',
          resource: 'demo',
          details: JSON.stringify({ permission, path: new URL(req.url).pathname }),
          ipAddress: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || undefined,
          status: 'BLOCKED',
        }).catch(() => {});

        return NextResponse.json(
          { error: 'This content is not available in demo mode.', code: 'DEMO_ACCESS_DENIED' },
          { status: 403 },
        );
      }

      return null; // Demo user has permission
    }

    // Regular users: check role-based permissions
    if (!hasPermission(payload.role, permission)) {
      logAudit({
        userId: payload.userId,
        action: 'ACCESS_DENIED',
        resource: permission.split(':')[0],
        details: JSON.stringify({ permission, role: payload.role }),
        ipAddress: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || undefined,
        status: 'BLOCKED',
      }).catch(() => {});

      return NextResponse.json(
        { error: 'You do not have permission to perform this action.', code: 'FORBIDDEN' },
        { status: 403 },
      );
    }

    return null; // Authorized
  };
}

// ─── Require minimum role middleware ───────────────────────
export function requireMinRole(minRole: Role) {
  return function guard(req: NextRequest) {
    const auth = authenticateRequest(req);
    if (!auth.authenticated) {
      return auth.response;
    }

    const { payload, isDemo } = auth;

    // Demo users can never access admin/teacher level endpoints
    if (isDemo) {
      return NextResponse.json(
        { error: 'This area is restricted in demo mode.', code: 'DEMO_ACCESS_DENIED' },
        { status: 403 },
      );
    }

    if (!hasMinRole(payload.role, minRole)) {
      return NextResponse.json(
        { error: 'Insufficient privileges.', code: 'FORBIDDEN' },
        { status: 403 },
      );
    }

    return null; // Authorized
  };
}

// ─── Demo mode endpoint guard (disabled — production app) ────
export function demoGuard(request: Request): NextResponse | null {
  return null;
}

// ─── Frontend: Get permissions for a given role ────────────
// Used by client components to determine UI visibility
export function getRolePermissions(role: string): Permission[] {
  return ROLE_PERMISSIONS[role] ?? [];
}

export function getDemoPermissions(): Permission[] {
  return [...DEMO_PERMISSIONS];
}

// ─── Frontend: Check if a page is accessible by role/demo ─
export interface PageAccessRule {
  page: string;
  requiredPermission: Permission;
  minRole?: Role;
  hiddenForDemo?: boolean;
  hiddenForRoles?: Role[];
}

export const PAGE_ACCESS_RULES: PageAccessRule[] = [
  { page: 'dashboard', requiredPermission: 'dashboard:view' },
  { page: 'admin-panel', requiredPermission: 'admin:access', minRole: ROLES.SUPER_ADMIN },
  { page: 'assignments', requiredPermission: 'assignment:view' },
  { page: 'lab-reports', requiredPermission: 'assignment:view' },
  { page: 'create-assignment', requiredPermission: 'assignment:create', hiddenForRoles: [ROLES.STUDENT, ROLES.CR] },
  { page: 'submissions', requiredPermission: 'submission:view' },
  { page: 'ai-chat', requiredPermission: 'ai:chat' },
  { page: 'leaderboard', requiredPermission: 'leaderboard:view', hiddenForRoles: [ROLES.TEACHER] },
  { page: 'announcements', requiredPermission: 'announcement:view' },
  { page: 'student-community', requiredPermission: 'chat:access' },
  { page: 'quiz', requiredPermission: 'quiz:view' },
  { page: 'code-quest', requiredPermission: 'quiz:view' },
  { page: 'books', requiredPermission: 'books:view' },
  { page: 'notifications', requiredPermission: 'notification:view' },
  { page: 'profile', requiredPermission: 'profile:view' },
];

/**
 * Check if a page is accessible for a given role and demo status.
 * Returns { accessible: true } or { accessible: false, reason: string }.
 */
export function checkPageAccess(
  page: string,
  role: string,
  isDemo: boolean,
): { accessible: true } | { accessible: false; reason: string } {
  const rule = PAGE_ACCESS_RULES.find(r => r.page === page);

  if (!rule) {
    return { accessible: true }; // Unknown pages are allowed by default
  }

  // Demo restrictions take priority
  if (isDemo && rule.hiddenForDemo) {
    return { accessible: false, reason: 'This feature is restricted in demo mode.' };
  }

  // Check demo permissions
  if (isDemo && !hasDemoPermission(rule.requiredPermission)) {
    return { accessible: false, reason: 'This content is not available in demo mode.' };
  }

  // Role-based restrictions
  if (rule.hiddenForRoles && rule.hiddenForRoles.includes(role as Role)) {
    return { accessible: false, reason: 'You do not have permission to access this page.' };
  }

  // Minimum role check
  if (rule.minRole && !hasMinRole(role, rule.minRole)) {
    return { accessible: false, reason: 'Insufficient privileges to access this area.' };
  }

  return { accessible: true };
}
