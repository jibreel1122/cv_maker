import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { sameOrigin } from "@/lib/security";
import { hit, clientIp } from "@/lib/rateLimit";
import { logAudit } from "@/lib/audit";

export const runtime = "nodejs";

const MAX_ATTEMPTS = 10;
const WINDOW_MS = 15 * 60 * 1000;
const MIN_PASSWORD_LENGTH = 8;

// POST /api/user/change-password { currentPassword, newPassword }
//
// Requires the current password even though the caller is already signed in: a
// borrowed session should not be enough to lock the real owner out of their own
// account.
export async function POST(request) {
  if (!sameOrigin(request)) {
    return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
  }

  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const ip = clientIp(request.headers);
  if (hit(`chpw:${user.id}`, MAX_ATTEMPTS, WINDOW_MS).limited) {
    return NextResponse.json(
      { error: "Too many attempts. Please try again later." },
      { status: 429 }
    );
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const currentPassword = body?.currentPassword || "";
  const newPassword = body?.newPassword || "";

  if (newPassword.length < MIN_PASSWORD_LENGTH) {
    return NextResponse.json(
      { error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters.` },
      { status: 400 }
    );
  }

  const record = await prisma.user.findUnique({ where: { id: user.id } });
  if (!record?.passwordHash) {
    return NextResponse.json({ error: "This account has no password set." }, { status: 400 });
  }

  const ok = await bcrypt.compare(currentPassword, record.passwordHash);
  if (!ok) {
    await logAudit("PASSWORD_CHANGE_FAILED", {
      userId: user.id,
      metadata: { email: record.email, ip },
    });
    return NextResponse.json({ error: "Your current password is incorrect." }, { status: 400 });
  }

  if (await bcrypt.compare(newPassword, record.passwordHash)) {
    return NextResponse.json(
      { error: "The new password must be different from the current one." },
      { status: 400 }
    );
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: await bcrypt.hash(newPassword, 12) },
  });

  await logAudit("PASSWORD_CHANGED", { userId: user.id, metadata: { email: record.email, ip } });

  return NextResponse.json({ ok: true });
}
