// Lightweight audit logging. Never throws — logging failures must not break the
// action being logged.

import { prisma } from "@/lib/prisma";

export const AUDIT_ACTIONS = [
  "LOGIN_FAILED",
  "LOGIN_SUCCESS",
  "DELETE_ACCOUNT",
  "ROLE_CHANGED",
  "USER_DELETED_BY_ADMIN",
  "EMAIL_VERIFIED",
  "PASSWORD_RESET_REQUESTED",
  "PASSWORD_RESET",
  "PASSWORD_CHANGED",
  "PASSWORD_CHANGE_FAILED",
];

// Retention. The privacy policy tells users audit logs are kept for 90 days;
// this is what actually makes that true. Audit rows hold email addresses and IPs,
// so an unbounded table is both a growing liability and a broken promise.
export const AUDIT_RETENTION_DAYS = 90;

// Run at most this often, so a burst of admin page loads does not turn into a
// burst of delete statements.
const PURGE_INTERVAL_MS = 60 * 60 * 1000;
let lastPurgeAt = 0;
let purgeInFlight = false;

/**
 * Deletes audit rows past the retention window.
 *
 * Fire-and-forget by design: it is called from admin read paths, and a slow or
 * failed cleanup must never delay or break the page the operator asked for.
 * Returns a promise for tests; callers are not expected to await it.
 */
export function purgeExpiredAuditLogs({ force = false } = {}) {
  const now = Date.now();
  if (!force && (purgeInFlight || now - lastPurgeAt < PURGE_INTERVAL_MS)) {
    return Promise.resolve(null);
  }
  purgeInFlight = true;
  lastPurgeAt = now;

  const cutoff = new Date(now - AUDIT_RETENTION_DAYS * 24 * 60 * 60 * 1000);

  return prisma.auditLog
    .deleteMany({ where: { createdAt: { lt: cutoff } } })
    .then((res) => {
      if (res.count) {
        console.log(`[audit] purged ${res.count} log(s) older than ${AUDIT_RETENTION_DAYS} days`);
      }
      return res.count;
    })
    .catch((e) => {
      console.error("[audit] purge failed:", e?.message || e);
      return null;
    })
    .finally(() => {
      purgeInFlight = false;
    });
}

export async function logAudit(action, { userId = null, metadata = null } = {}) {
  try {
    await prisma.auditLog.create({
      data: {
        action,
        userId,
        metadata: metadata ? JSON.stringify(metadata) : null,
      },
    });
  } catch (e) {
    console.error("audit log failed:", e?.message || e);
  }
}
