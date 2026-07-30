import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { sameOrigin } from "@/lib/security";
import { hit, clientIp } from "@/lib/rateLimit";
import { createEmailToken } from "@/lib/tokens";
import { sendVerificationEmail, isEmailVerificationEnabled } from "@/lib/mailer";

export const runtime = "nodejs";

// Registration rate limit: max 3 accounts per IP per hour (bot/spam guard).
const REG_MAX = 3;
const REG_WINDOW_MS = 60 * 60 * 1000;

// Creates a new (unverified) USER account from email + password and returns a
// verification link (shown on screen in this local build; no email is sent).
export async function POST(request) {
  if (!sameOrigin(request)) {
    return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
  }

  const ip = clientIp(request.headers);
  const rl = hit(`register:${ip}`, REG_MAX, REG_WINDOW_MS);
  if (rl.limited) {
    return NextResponse.json(
      { error: "Too many accounts created from this network. Try again later." },
      { status: 429 }
    );
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const name = (body?.name || "").trim();
  const email = (body?.email || "").trim().toLowerCase();
  const password = body?.password || "";

  if (!name) {
    return NextResponse.json({ error: "Please enter your name." }, { status: 400 });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json(
      { error: "Password must be at least 8 characters." },
      { status: 400 }
    );
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json(
      { error: "An account with this email already exists." },
      { status: 409 }
    );
  }

  // Salt rounds = 12 (>= 12 required).
  const passwordHash = await bcrypt.hash(password, 12);

  // With no mail transport configured there is no way for a user to ever
  // confirm their address, so requiring it would lock every new account out
  // permanently. In that case the account is created ready to use.
  const verificationRequired = isEmailVerificationEnabled();

  await prisma.user.create({
    data: {
      name,
      email,
      passwordHash,
      role: "USER",
      emailVerified: verificationRequired ? null : new Date(),
    },
  });

  if (!verificationRequired) {
    return NextResponse.json({ ok: true, email, verified: true });
  }

  const token = createEmailToken(email);
  const { delivered, link, error } = await sendVerificationEmail({ email, token });

  // A delivery failure must not undo a successful registration — the account
  // exists and the user can request a fresh link from the verification page.
  if (!delivered) {
    console.error(`[register] verification email to ${email} failed:`, error);
  }

  // In development there is often no inbox to check, so the link is handed back
  // for the UI to show. Never in production: that would let someone register
  // with an address they do not control and verify it themselves.
  const exposeLink = process.env.NODE_ENV !== "production";

  return NextResponse.json({
    ok: true,
    email,
    verified: false,
    delivered,
    verifyUrl: exposeLink ? link : undefined,
  });
}
