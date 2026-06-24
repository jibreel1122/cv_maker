import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/admin/users — list all users with their CV counts (admin/owner).
export async function GET(request) {
  const admin = await requireRole(["ADMIN", "OWNER"]);
  if (!admin) return NextResponse.json({ error: "Forbidden." }, { status: 403 });

  const search = (new URL(request.url).searchParams.get("q") || "").trim();
  const where = search
    ? {
        OR: [
          { name: { contains: search } },
          { email: { contains: search } },
        ],
      }
    : {};

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
      createdAt: u.createdAt,
      cvCount: u._count.cvs,
      // "email" for credential accounts, otherwise the OAuth providers used.
      providers: u.accounts.length ? u.accounts.map((a) => a.provider) : ["email"],
    })),
  });
}
