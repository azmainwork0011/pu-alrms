import { db } from '@/lib/db';

/**
 * Audit logging utility for security monitoring
 * Logs all sensitive actions for compliance and security auditing
 */

type AuditAction =
  | 'LOGIN_SUCCESS'
  | 'LOGIN_FAILURE'
  | 'LOGOUT'
  | 'REGISTER'
  | 'PASSWORD_CHANGE'
  | 'PROFILE_UPDATE'
  | 'ASSIGNMENT_CREATE'
  | 'ASSIGNMENT_UPDATE'
  | 'SUBMISSION_UPLOAD'
  | 'QUIZ_START'
  | 'QUIZ_COMPLETE'
  | 'SUBJECT_CREATE'
  | 'SUBJECT_UPDATE'
  | 'SUBJECT_DELETE'
  | 'CHAT_MESSAGE'
  | 'ROOM_CREATE'
  | 'TOKEN_REFRESH'
  | 'ACCESS_DENIED';

type AuditResource = 'auth' | 'assignment' | 'submission' | 'quiz' | 'subject' | 'chat' | 'profile' | 'token';

interface AuditLogOptions {
  userId?: string;
  action: AuditAction;
  resource: AuditResource;
  details?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  status?: 'SUCCESS' | 'FAILURE' | 'BLOCKED';
}

/**
 * Log an audit event to the database
 * Async - does not block the request
 */
export async function logAudit(options: AuditLogOptions): Promise<void> {
  try {
    await db.auditLog.create({
      data: {
        userId: options.userId || null,
        action: options.action,
        resource: options.resource,
        details: options.details ? JSON.stringify(options.details) : null,
        ipAddress: options.ipAddress || null,
        userAgent: options.userAgent ? options.userAgent.slice(0, 500) : null,
        status: options.status || 'SUCCESS',
      },
    });
  } catch (error) {
    // Never throw from audit logging - it's non-critical
    console.error('[Audit] Failed to log:', error);
  }
}

/**
 * Log a failed login attempt (rate limit tracking)
 */
export function logFailedLogin(ipAddress: string, email?: string): void {
  logAudit({
    action: 'LOGIN_FAILURE',
    resource: 'auth',
    details: { email: email?.slice(0, 50) },
    ipAddress,
    status: 'FAILURE',
  }).catch(() => {});
}
