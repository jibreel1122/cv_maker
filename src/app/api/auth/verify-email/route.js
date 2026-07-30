import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyEmailToken } from "@/lib/tokens";
import { logAudit } from "@/lib/audit";
import { appUrl } from "@/lib/mailer";

export const runtime = "nodejs";

// Applies a verification token.
// Returns one of: "verified" | "expired" | "invalid".
async function applyToken(token) {
  const { valid, expired, email } = verifyEmailToken(token);
  if (!valid) return "invalid";
  if (expired) return "expired";

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return "invalid";

  if (!user.emailVerified) {
    await prisma.user.update({
      where: { id: user.id },
      data: { emailVerified: new Date() },
    });
    await logAudit("EMAIL_VERIFIED", { userId: user.id, metadata: { email } });
  }

  // Re-clicking a link that already worked is a success, not an error.
  return "verified";
}

// GET /api/auth/verify-email?token=...
//
// This is the address that goes out in the email, so it is opened as a plain
// browser navigation. It applies the token and then redirects to the page that
// can actually talk to the user — including on failure, where the page offers a
// "resend" using the (still signature-valid) expired token.
export async function GET(request) {
  const token = new URL(request.url).searchParams.get("token") || "";
  const status = token ? await applyToken(token) : "invalid";

  const target = new URL("/verify-email", appUrl());
  target.searchParams.set("status", status);
  // The page needs the original token to offer a resend on an expired link.
  if (status === "expired" && token) target.searchParams.set("token", token);

  return NextResponse.redirect(target, 303);
}

// POST /api/auth/verify-email { token }
// Kept for the in-page verification flow and for links issued before the
// emailed GET route existed.
export async function POST(request) {
  let token;
  try {
    token = (await request.json())?.token;
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const status = await applyToken(token);
  if (status === "verified") return NextResponse.json({ status });
  return NextResponse.json({ status }, { status: 400 });
}
