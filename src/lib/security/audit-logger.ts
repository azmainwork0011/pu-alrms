/**
 * Audit Logger
 *
 * Lightweight audit logging system. Currently logs to console;
 * can be upgraded to persistent DB storage later.
 */

export interface AuditLogEntry {
  userId: string;
  action: string;
  resource: string;
  details: string;
  ipAddress?: string;
  status: string;
}

export async function logAudit(entry: AuditLogEntry): Promise<void> {
  try {
    const timestamp = new Date().toISOString();
    console.log(
      `[AUDIT] ${timestamp} | ${entry.status} | ${entry.userId} | ${entry.action} | ${entry.resource} | IP: ${entry.ipAddress || 'unknown'}`,
    );
  } catch {
    // Silent fail — audit logging should never break the app
  }
}
