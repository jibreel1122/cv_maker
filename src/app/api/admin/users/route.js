import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/admin/users — list all users with their CV counts (admin/owner).
export async function GET(request) {
  const admin = await requireRole(["ADMIN", "OWNER"]);
  if (!admin) return NextResponse.json({ error: "Forbidden." }, { status: 403 });

  const sp = new URL(request.url).searchParams;
  const search = (sp.get("q") || "").trim();
  const onlyUnverified = sp.get("unverified") === "1";

  const where = {};
  if (search) {
    where.OR = [{ name: { contains: search } }, { email: { contains: search } }];
  }
  if (onlyUnverified) {
    where.emailVerified = null;
    where.passwordHash = { not: null }; // OAuth users are considered verified
  }

  const users = await prisma.user.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 500,
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      role: true,
      emailVerified: true,
      createdAt: true,
      accounts: { select: { provider: true } },
      _count: { select: { cvs: true } },
    },
  });

  return NextResponse.json({
    users: users.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      image: u.image,
      role: u.role,
      emailVerified: u.emailVerified,
      createdAt: u.createdAt,
      cvCount: u._count.cvs,
      // "email" for credential accounts, otherwise the OAuth providers used.
      providers: u.accounts.length ? u.accounts.map((a) => a.provider) : ["email"],
    })),
  });
}
