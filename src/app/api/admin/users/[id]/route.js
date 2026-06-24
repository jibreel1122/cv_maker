import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";
import { assignableRoles } from "@/lib/auth";
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
  const newRole = body?.role;
  const allowed = assignableRoles(actor.role);
  if (!allowed.includes(newRole)) {
    return NextResponse.json({ error: "You cannot assign that role." }, { status: 403 });
  }

  if (actor.id === target.id) {
    return NextResponse.json({ error: "You cannot change your own role." }, { status: 400 });
  }

  // Only an OWNER may modify another OWNER (e.g. demote them).
  if (target.role === "OWNER" && actor.role !== "OWNER") {
    return NextResponse.json({ error: "Only an owner can change an owner." }, { status: 403 });
  }

  // Never allow removing the last remaining OWNER.
  if (target.role === "OWNER" && newRole !== "OWNER") {
    const owners = await prisma.user.count({ where: { role: "OWNER" } });
    if (owners <= 1) {
      return NextResponse.json(
        { error: "There must be at least one owner." },
        { status: 400 }
      );
    }
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

  if (actor.id === target.id) {
    return NextResponse.json({ error: "You cannot delete your own account." }, { status: 400 });
  }
  if (target.role === "OWNER") {
    return NextResponse.json({ error: "You cannot delete an owner." }, { status: 403 });
  }
  // Only an owner can delete an admin.
  if (target.role === "ADMIN" && actor.role !== "OWNER") {
    return NextResponse.json({ error: "Only an owner can delete an admin." }, { status: 403 });
  }

  await prisma.user.delete({ where: { id: target.id } });
  await logAudit("USER_DELETED_BY_ADMIN", {
    userId: null,
    metadata: { email: target.email, role: target.role, by: actor.email },
  });

  return NextResponse.json({ ok: true });
}
