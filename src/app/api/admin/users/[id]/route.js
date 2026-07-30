import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";
import { canAssignRole, canDeleteUser } from "@/lib/permissions";
import { sameOrigin } from "@/lib/security";
import { logAudit } from "@/lib/audit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// PATCH /api/admin/users/[id]
//   { role }            -> change a user's role
//   { action:"verify" } -> manually mark the account's email verified
export async function PATCH(request, { params }) {
  if (!sameOrigin(request)) {
    return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
  }

  const actor = await requireRole(["ADMIN", "OWNER"]);
  if (!actor) return NextResponse.json({ error: "Forbidden." }, { status: 403 });

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const target = await prisma.user.findUnique({ where: { id: params.id } });
  if (!target) return NextResponse.json({ error: "User not found." }, { status: 404 });

  // --- Manual email verification ---
  if (body?.action === "verify") {
    if (!target.emailVerified) {
      await prisma.user.update({
        where: { id: target.id },
        data: { emailVerified: new Date() },
      });
      await logAudit("EMAIL_VERIFIED", {
        userId: target.id,
        metadata: { email: target.email, by: actor.email, manual: true },
      });
    }
    return NextResponse.json({ ok: true });
  }

  // --- Role change ---
  // The rule itself lives in `lib/permissions` (pure, unit-tested); this route
  // only supplies the current owner count and maps the verdict onto copy.
  const newRole = body?.role;
  const ownerCount =
    target.role === "OWNER" ? await prisma.user.count({ where: { role: "OWNER" } }) : 0;

  const verdict = canAssignRole({ actor, target, newRole, ownerCount });
  if (!verdict.allowed) {
    const responses = {
      "role-not-assignable": ["You cannot assign that role.", 403],
      self: ["You cannot change your own role.", 400],
      "owner-only": ["Only an owner can change an owner.", 403],
      "last-owner": ["There must be at least one owner.", 400],
      "not-found": ["User not found.", 404],
    };
    const [error, status] = responses[verdict.reason] || ["Forbidden.", 403];
    return NextResponse.json({ error }, { status });
  }

  if (newRole !== target.role) {
    await prisma.user.update({ where: { id: target.id }, data: { role: newRole } });
    await logAudit("ROLE_CHANGED", {
      userId: target.id,
      metadata: {
        email: target.email,
        oldRole: target.role,
        newRole,
        by: actor.email,
      },
    });
  }
  return NextResponse.json({ ok: true });
}

// DELETE /api/admin/users/[id]
//   ADMIN may delete plain USER accounts; OWNER may delete USER or ADMIN.
//   No one can delete an OWNER through this route.
export async function DELETE(request, { params }) {
  if (!sameOrigin(request)) {
    return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
  }

  const actor = await requireRole(["ADMIN", "OWNER"]);
  if (!actor) return NextResponse.json({ error: "Forbidden." }, { status: 403 });

  const target = await prisma.user.findUnique({ where: { id: params.id } });
  if (!target) return NextResponse.json({ error: "User not found." }, { status: 404 });

  const verdict = canDeleteUser({ actor, target });
  if (!verdict.allowed) {
    const responses = {
      self: ["You cannot delete your own account.", 400],
      "owner-undeletable": ["You cannot delete an owner.", 403],
      "owner-only": ["Only an owner can delete an admin.", 403],
      "not-found": ["User not found.", 404],
    };
    const [error, status] = responses[verdict.reason] || ["Forbidden.", 403];
    return NextResponse.json({ error }, { status });
  }

  await prisma.user.delete({ where: { id: target.id } });
  await logAudit("USER_DELETED_BY_ADMIN", {
    userId: null,
    metadata: { email: target.email, role: target.role, by: actor.email },
  });

  return NextResponse.json({ ok: true });
}
