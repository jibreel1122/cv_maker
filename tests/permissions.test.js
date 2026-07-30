import { describe, it, expect } from "vitest";
import {
  ROLES,
  isAdmin,
  isOwner,
  assignableRoles,
  canAccessCv,
  canAssignRole,
  canDeleteUser,
} from "@/lib/permissions";

const user = { id: "u1", role: "USER" };
const otherUser = { id: "u2", role: "USER" };
const admin = { id: "a1", role: "ADMIN" };
const otherAdmin = { id: "a2", role: "ADMIN" };
const owner = { id: "o1", role: "OWNER" };
const otherOwner = { id: "o2", role: "OWNER" };

describe("role predicates", () => {
  it("treats ADMIN and OWNER as elevated, USER as not", () => {
    expect(isAdmin("ADMIN")).toBe(true);
    expect(isAdmin("OWNER")).toBe(true);
    expect(isAdmin("USER")).toBe(false);
    expect(isOwner("OWNER")).toBe(true);
    expect(isOwner("ADMIN")).toBe(false);
  });

  it("fails closed on unknown or missing roles", () => {
    for (const role of [undefined, null, "", "SUPERUSER", "owner", 0]) {
      expect(isAdmin(role)).toBe(false);
      expect(isOwner(role)).toBe(false);
      expect(assignableRoles(role)).toEqual([]);
    }
  });
});

describe("assignableRoles", () => {
  it("gives a USER no ability to assign any role", () => {
    // The headline rule: a plain user must not be able to mint privilege.
    expect(assignableRoles("USER")).toEqual([]);
    expect(assignableRoles("USER")).not.toContain("ADMIN");
    expect(assignableRoles("USER")).not.toContain("OWNER");
  });

  it("lets an ADMIN toggle USER/ADMIN but never grant OWNER", () => {
    expect(assignableRoles("ADMIN")).toEqual(["USER", "ADMIN"]);
    expect(assignableRoles("ADMIN")).not.toContain("OWNER");
  });

  it("lets an OWNER assign anything", () => {
    expect(assignableRoles("OWNER")).toEqual(ROLES);
  });
});

describe("canAccessCv", () => {
  const cv = { id: "cv1", userId: "u1" };

  it("lets the owner of a CV read it", () => {
    const r = canAccessCv({ cv, user });
    expect(r.allowed).toBe(true);
    expect(r.owns).toBe(true);
  });

  it("refuses an unrelated user", () => {
    const r = canAccessCv({ cv, user: otherUser });
    expect(r.allowed).toBe(false);
    expect(r.reason).toBe("forbidden");
  });

  it("lets an admin read someone else's CV", () => {
    expect(canAccessCv({ cv, user: admin }).allowed).toBe(true);
    expect(canAccessCv({ cv, user: owner }).allowed).toBe(true);
  });

  it("does NOT let an admin write to someone else's CV", () => {
    // Reading another user's CV is a support action; silently editing their
    // document is not. The write paths pass adminAllowed: false for this.
    const r = canAccessCv({ cv, user: admin, adminAllowed: false });
    expect(r.allowed).toBe(false);
    expect(r.reason).toBe("forbidden");
  });

  it("still lets the owner write to their own CV", () => {
    expect(canAccessCv({ cv, user, adminAllowed: false }).allowed).toBe(true);
  });

  it("reports a missing CV distinctly from a forbidden one", () => {
    expect(canAccessCv({ cv: null, user }).reason).toBe("not-found");
    expect(canAccessCv({ cv, user: null }).reason).toBe("forbidden");
  });
});

describe("canAssignRole", () => {
  it("refuses a USER trying to promote anyone", () => {
    const r = canAssignRole({ actor: user, target: otherUser, newRole: "ADMIN" });
    expect(r.allowed).toBe(false);
    expect(r.reason).toBe("role-not-assignable");
  });

  it("refuses an ADMIN trying to create an OWNER", () => {
    const r = canAssignRole({ actor: admin, target: otherUser, newRole: "OWNER" });
    expect(r.allowed).toBe(false);
    expect(r.reason).toBe("role-not-assignable");
  });

  it("lets an ADMIN promote a USER to ADMIN", () => {
    expect(canAssignRole({ actor: admin, target: otherUser, newRole: "ADMIN" }).allowed).toBe(true);
  });

  it("refuses anyone changing their own role", () => {
    // Both directions matter: self-promotion, and an owner accidentally
    // demoting themselves out of the only owner seat.
    expect(canAssignRole({ actor: admin, target: admin, newRole: "USER" }).reason).toBe("self");
    expect(canAssignRole({ actor: owner, target: owner, newRole: "ADMIN" }).reason).toBe("self");
  });

  it("refuses an ADMIN modifying an OWNER", () => {
    const r = canAssignRole({ actor: admin, target: owner, newRole: "USER", ownerCount: 2 });
    expect(r.allowed).toBe(false);
    // The role gate fires first — an admin cannot assign OWNER-level changes at all.
    expect(["owner-only", "role-not-assignable"]).toContain(r.reason);
  });

  it("lets an OWNER demote another OWNER when one would remain", () => {
    const r = canAssignRole({ actor: owner, target: otherOwner, newRole: "ADMIN", ownerCount: 2 });
    expect(r.allowed).toBe(true);
  });

  it("refuses demoting the last remaining OWNER", () => {
    const r = canAssignRole({ actor: owner, target: otherOwner, newRole: "ADMIN", ownerCount: 1 });
    expect(r.allowed).toBe(false);
    expect(r.reason).toBe("last-owner");
  });

  it("allows promoting a second OWNER even when only one exists", () => {
    const r = canAssignRole({ actor: owner, target: otherUser, newRole: "OWNER", ownerCount: 1 });
    expect(r.allowed).toBe(true);
  });
});

describe("canDeleteUser", () => {
  it("refuses a plain USER outright", () => {
    expect(canDeleteUser({ actor: user, target: otherUser }).reason).toBe("forbidden");
  });

  it("lets an ADMIN delete a USER but not another ADMIN", () => {
    expect(canDeleteUser({ actor: admin, target: otherUser }).allowed).toBe(true);
    expect(canDeleteUser({ actor: admin, target: otherAdmin }).reason).toBe("owner-only");
  });

  it("lets an OWNER delete a USER or an ADMIN", () => {
    expect(canDeleteUser({ actor: owner, target: otherUser }).allowed).toBe(true);
    expect(canDeleteUser({ actor: owner, target: admin }).allowed).toBe(true);
  });

  it("never allows deleting an OWNER, even by another OWNER", () => {
    expect(canDeleteUser({ actor: owner, target: otherOwner }).reason).toBe("owner-undeletable");
  });

  it("refuses self-deletion through the admin route", () => {
    expect(canDeleteUser({ actor: owner, target: owner }).reason).toBe("self");
  });
});
