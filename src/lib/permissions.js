// ============================================================================
// Authorisation rules — who may do what.
//
// Deliberately pure: no Prisma, no NextAuth, no I/O. Every function takes plain
// data and returns a decision. That keeps the rules cheap to unit-test — the
// permission matrix is the highest-consequence logic in the app and the thing
// most worth having tests around — and it keeps the rules in one place rather
// than scattered across route handlers where they drift apart.
//
// `src/lib/auth.js` re-exports the role helpers so existing imports keep working
// without dragging next-auth and the Prisma client into a test run.
// ============================================================================

// Roles, ordered from least to most privileged.
export const ROLES = ["USER", "ADMIN", "OWNER"];

export function isAdmin(role) {
  return role === "ADMIN" || role === "OWNER";
}

export function isOwner(role) {
  return role === "OWNER";
}

/**
 * Which roles a given actor may assign.
 *   OWNER  → any role
 *   ADMIN  → USER and ADMIN only (an admin cannot mint owners)
 *   USER   → none
 * Anything unrecognised gets none, so an unexpected role value fails closed.
 */
export function assignableRoles(actorRole) {
  if (actorRole === "OWNER") return ["USER", "ADMIN", "OWNER"];
  if (actorRole === "ADMIN") return ["USER", "ADMIN"];
  return [];
}

/**
 * May `user` see or modify `cv`?
 *
 * @param cv            { userId } — the CV row
 * @param user          { id, role } — the caller
 * @param adminAllowed  whether elevated roles bypass ownership. False for
 *                      writes: an admin may read a CV for support, but must not
 *                      silently edit someone's document.
 * @returns { allowed, owns, reason } — reason is "not-found" | "forbidden"
 */
export function canAccessCv({ cv, user, adminAllowed = true }) {
  if (!cv) return { allowed: false, owns: false, reason: "not-found" };
  if (!user) return { allowed: false, owns: false, reason: "forbidden" };

  const owns = cv.userId === user.id;
  const elevated = adminAllowed && isAdmin(user.role);

  if (owns || elevated) return { allowed: true, owns, reason: null };
  return { allowed: false, owns, reason: "forbidden" };
}

/**
 * May `actor` change `target`'s role to `newRole`?
 *
 * @param ownerCount how many OWNERs exist, so the last one cannot be demoted
 * @returns { allowed, reason } — reason is a stable code the route maps to copy
 */
export function canAssignRole({ actor, target, newRole, ownerCount = 0 }) {
  if (!actor || !target) return { allowed: false, reason: "not-found" };

  if (!assignableRoles(actor.role).includes(newRole)) {
    return { allowed: false, reason: "role-not-assignable" };
  }
  // Nobody edits their own role — an admin demoting themselves by accident, or
  // promoting themselves on purpose, are both bad outcomes.
  if (actor.id === target.id) {
    return { allowed: false, reason: "self" };
  }
  if (target.role === "OWNER" && !isOwner(actor.role)) {
    return { allowed: false, reason: "owner-only" };
  }
  // Never strand the platform without an owner.
  if (target.role === "OWNER" && newRole !== "OWNER" && ownerCount <= 1) {
    return { allowed: false, reason: "last-owner" };
  }
  return { allowed: true, reason: null };
}

/**
 * May `actor` delete `target`'s account?
 *   OWNER  → USER and ADMIN
 *   ADMIN  → USER only
 *   nobody → an OWNER (demote first, which the last-owner rule also guards)
 */
export function canDeleteUser({ actor, target }) {
  if (!actor || !target) return { allowed: false, reason: "not-found" };
  if (!isAdmin(actor.role)) return { allowed: false, reason: "forbidden" };
  if (actor.id === target.id) return { allowed: false, reason: "self" };
  if (target.role === "OWNER") return { allowed: false, reason: "owner-undeletable" };
  if (target.role === "ADMIN" && !isOwner(actor.role)) {
    return { allowed: false, reason: "owner-only" };
  }
  return { allowed: true, reason: null };
}
