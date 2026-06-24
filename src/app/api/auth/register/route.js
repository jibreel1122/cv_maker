import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { sameOrigin } from "@/lib/security";
import { hit, clientIp } from "@/lib/rateLimit";
import { createEmailToken } from "@/lib/tokens";
import { sendVerificationEmail } from "@/lib/mailer";

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
  await prisma.user.create({
    data: { name, email, passwordHash, role: "USER", emailVerified: null },
  });

  const token = createEmailToken(email);
  const { link } = await sendVerificationEmail(email, token);

  // Local build: no email is sent, so we hand the verification link back to the
  // UI to display on screen. (Outside development we would not expose this.)
  const exposeLink = process.env.NODE_ENV !== "production";
  return NextResponse.json({
    ok: true,
    email,
    verifyUrl: exposeLink ? link : undefined,
  });
}
