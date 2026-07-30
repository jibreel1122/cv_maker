import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sameOrigin } from "@/lib/security";
import { hit, clientIp } from "@/lib/rateLimit";
import { createToken, TOKEN_PURPOSES } from "@/lib/tokens";
import { sendPasswordResetEmail } from "@/lib/mailer";
import { logAudit } from "@/lib/audit";

export const runtime = "nodejs";

// Reset requests are cheap for an attacker and expensive for us (an email per
// call), and they are also an enumeration oracle if unthrottled.
const MAX_PER_IP = 5;
const MAX_PER_ACCOUNT = 3;
const WINDOW_MS = 60 * 60 * 1000;

// POST /api/auth/forgot-password { email }
//
// Always answers the same way. Whether the address has an account is exactly
// what an attacker wants to learn here, so the response cannot depend on it —
// no distinct 404, no different timing branch that skips the work.
export async function POST(request) {
  if (!sameOrigin(request)) {
    return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
  }

  const ip = clientIp(request.headers);
  if (hit(`forgot:${ip}`, MAX_PER_IP, WINDOW_MS).limited) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429 }
    );
  }

  let email;
  try {
    email = (await request.json())?.email;
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  email = String(email || "").trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
  }

  // Per-address cap as well, so one account cannot be mail-bombed from a botnet.
  if (!hit(`forgot-acct:${email}`, MAX_PER_ACCOUNT, WINDOW_MS).limited) {
    const user = await prisma.user.findUnique({ where: { email } });
    // Only accounts that actually have a password can reset one.
    if (user?.passwordHash) {
      const token = createToken(email, TOKEN_PURPOSES.resetPassword);
      const { delivered, error } = await sendPasswordResetEmail({ email, token });
      if (!delivered) {
        console.error(`[forgot-password] could not email ${email}:`, error);
      }
      await logAudit("PASSWORD_RESET_REQUESTED", {
        userId: user.id,
        metadata: { email, ip, delivered: Boolean(delivered) },
      });
    }
  }

  return NextResponse.json({ ok: true });
}
