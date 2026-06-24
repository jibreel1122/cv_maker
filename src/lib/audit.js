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
];

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
