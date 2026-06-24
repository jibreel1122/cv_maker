import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";
import { assignableRoles } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// PATCH /api/admin/users/[id] — change a user's role.
//   OWNER can grant any role (USER / ADMIN / OWNER).
//   ADMIN can only toggle between USER and ADMIN, and may not touch an OWNER.
export async function PATCH(request, { params }) {
  const actor = await requireRole(["ADMIN", "OWNER"]);
  if (!actor) return NextResponse.json({ error: "Forbidden." }, { status: 403 });

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const newRole = body?.role;
  const allowed = assignableRoles(actor.role);
  if (!allowed.includes(newRole)) {
    return NextResponse.json({ error: "You cannot assign that role." }, { status: 403 });
  }

  const target = await prisma.user.findUnique({ where: { id: params.id } });
  if (!target) return NextResponse.json({ error: "User not found." }, { status: 404 });

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

  await prisma.user.update({ where: { id: params.id }, data: { role: newRole } });
  return NextResponse.json({ ok: true });
}

// DELETE /api/admin/users/[id] — remove a user and their CVs (owner only).
export async function DELETE(request, { params }) {
  const actor = await requireRole(["OWNER"]);
  if (!actor) return NextResponse.json({ error: "Only an owner can delete users." }, { status: 403 });

  const target = await prisma.user.findUnique({ where: { id: params.id } });
  if (!target) return NextResponse.json({ error: "User not found." }, { status: 404 });
  if (actor.id === target.id) {
    return NextResponse.json({ error: "You cannot delete your own account." }, { status: 400 });
  }
  if (target.role === "OWNER") {
    return NextResponse.json({ error: "You cannot delete another owner." }, { status: 400 });
  }

  await prisma.user.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
