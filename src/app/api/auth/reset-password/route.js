import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { sameOrigin } from "@/lib/security";
import { hit, clientIp } from "@/lib/rateLimit";
import { verifyToken, TOKEN_PURPOSES } from "@/lib/tokens";
import { logAudit } from "@/lib/audit";

export const runtime = "nodejs";

const MAX_ATTEMPTS = 10;
const WINDOW_MS = 60 * 60 * 1000;
export const MIN_PASSWORD_LENGTH = 8;

// GET /api/auth/reset-password?token=... — is this link still usable?
//
// Lets the page say "this link has expired" on load instead of after the user
// has typed a new password twice. Reveals nothing: the caller already holds the
// token, and an unguessable HMAC cannot be probed into existence.
export async function GET(request) {
  const ip = clientIp(request.headers);
  if (hit(`reset-check:${ip}`, MAX_ATTEMPTS * 3, WINDOW_MS).limited) {
    return NextResponse.json({ valid: false }, { status: 429 });
  }

  const token = new URL(request.url).searchParams.get("token") || "";
  const { valid, expired } = verifyToken(token, TOKEN_PURPOSES.resetPassword);
  return NextResponse.json({ valid: valid && !expired });
}

// POST /api/auth/reset-password { token, password }
export async function POST(request) {
  if (!sameOrigin(request)) {
    return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
  }

  const ip = clientIp(request.headers);
  if (hit(`reset:${ip}`, MAX_ATTEMPTS, WINDOW_MS).limited) {
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

  const password = body?.password || "";
  if (password.length < MIN_PASSWORD_LENGTH) {
    return NextResponse.json(
      { error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters.` },
      { status: 400 }
    );
  }

  // A reset token must be exactly that — `verifyToken` rejects a verification
  // token presented here, so one cannot be traded for account access.
  const { valid, expired, email } = verifyToken(body?.token, TOKEN_PURPOSES.resetPassword);
  if (!valid || expired || !email) {
    return NextResponse.json({ status: "invalid" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return NextResponse.json({ status: "invalid" }, { status: 400 });
  }

  const passwordHash = await bcrypt.hash(password, 12);
  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash,
      // Reaching the inbox proves the address, so a reset also confirms it.
      // Otherwise someone who registered while verification was on, then reset
      // their password, would still be locked out of logging in.
      emailVerified: user.emailVerified ?? new Date(),
    },
  });

  // Sessions are stateless JWTs, so existing ones cannot be revoked from here.
  // Recorded so an owner can see the reset in the audit log; see the note in
  // the README about shortening session lifetime if that matters to you.
  await logAudit("PASSWORD_RESET", { userId: user.id, metadata: { email, ip } });

  return NextResponse.json({ status: "reset" });
}
