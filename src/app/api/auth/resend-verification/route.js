import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sameOrigin } from "@/lib/security";
import { hit, clientIp } from "@/lib/rateLimit";
import { verifyEmailToken, createEmailToken } from "@/lib/tokens";
import { sendVerificationEmail } from "@/lib/mailer";

export const runtime = "nodejs";

// POST /api/auth/resend-verification { token }
// Accepts an existing (possibly expired) token, reads the email from its signed
// payload, and — if that account exists and is still unverified — sends a fresh
// verification email. No password is required.
export async function POST(request) {
  if (!sameOrigin(request)) {
    return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
  }

  const ip = clientIp(request.headers);
  const rl = hit(`resend:${ip}`, 5, 60 * 60 * 1000); // 5 per hour
  if (rl.limited) {
    return NextResponse.json(
      { error: "Too many requests. Try again later." },
      { status: 429 }
    );
  }

  let token;
  try {
    token = (await request.json())?.token;
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  // Signature must be valid; expiry is allowed (that's the whole point).
  const { valid, email } = verifyEmailToken(token);
  if (!valid || !email) {
    return NextResponse.json({ error: "Invalid token." }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (user && !user.emailVerified) {
    await sendVerificationEmail(email, createEmailToken(email));
  }

  // Always report success to avoid leaking whether an account exists/verified.
  return NextResponse.json({ ok: true });
}
