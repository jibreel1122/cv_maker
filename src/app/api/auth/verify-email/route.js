import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyEmailToken } from "@/lib/tokens";
import { logAudit } from "@/lib/audit";

export const runtime = "nodejs";

// POST /api/auth/verify-email { token }
//   valid + not expired -> mark the account verified.
export async function POST(request) {
  let token;
  try {
    token = (await request.json())?.token;
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const { valid, expired, email } = verifyEmailToken(token);
  if (!valid) {
    return NextResponse.json({ status: "invalid" }, { status: 400 });
  }
  if (expired) {
    return NextResponse.json({ status: "expired" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return NextResponse.json({ status: "invalid" }, { status: 400 });
  }

  if (!user.emailVerified) {
    await prisma.user.update({
      where: { id: user.id },
      data: { emailVerified: new Date() },
    });
    await logAudit("EMAIL_VERIFIED", { userId: user.id, metadata: { email } });
  }

  return NextResponse.json({ status: "verified" });
}
