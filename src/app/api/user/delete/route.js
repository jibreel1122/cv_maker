import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { sameOrigin } from "@/lib/security";
import { logAudit } from "@/lib/audit";

export const runtime = "nodejs";

// POST /api/user/delete { email }
// Permanently deletes the signed-in user's account and all their CVs (CVs are
// removed via the onDelete: Cascade relation). Admins/owners cannot self-delete
// here — an owner must remove them from the admin panel (protects the last
// owner and keeps admin removals auditable).
export async function POST(request) {
  if (!sameOrigin(request)) {
    return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
  }

  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  if (user.role === "ADMIN" || user.role === "OWNER") {
    return NextResponse.json(
      { error: "Admin and owner accounts cannot be self-deleted. Contact an owner." },
      { status: 403 }
    );
  }

  let email;
  try {
    email = (await request.json())?.email;
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  if (!email || email.trim().toLowerCase() !== (user.email || "").toLowerCase()) {
    return NextResponse.json({ error: "Email confirmation does not match." }, { status: 400 });
  }

  await prisma.user.delete({ where: { id: user.id } });
  await logAudit("DELETE_ACCOUNT", { userId: null, metadata: { email: user.email } });

  return NextResponse.json({ ok: true });
}
