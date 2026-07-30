import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PAGE_SIZE = 25;
const MAX_PAGE_SIZE = 100;

// GET /api/admin/users?q=&unverified=1&page=&pageSize=
export async function GET(request) {
  const admin = await requireRole(["ADMIN", "OWNER"]);
  if (!admin) return NextResponse.json({ error: "Forbidden." }, { status: 403 });

  const sp = new URL(request.url).searchParams;
  const search = (sp.get("q") || "").trim();
  const onlyUnverified = sp.get("unverified") === "1";
  const page = Math.max(1, Number.parseInt(sp.get("page") || "1", 10) || 1);
  const pageSize = Math.min(
    MAX_PAGE_SIZE,
    Math.max(1, Number.parseInt(sp.get("pageSize") || String(PAGE_SIZE), 10) || PAGE_SIZE)
  );

  const where = {};
  if (search) {
    // `mode: "insensitive"` is required on PostgreSQL: Prisma's `contains` maps
    // to LIKE, which is case-sensitive there. Without it, searching "Layla"
    // silently misses "layla@example.com" — this worked only while the schema
    // was on SQLite.
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
    ];
  }
  if (onlyUnverified) {
    where.emailVerified = null;
    where.passwordHash = { not: null }; // only email/password accounts
  }

  const [total, users] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
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
    }),
  ]);

  return NextResponse.json({
    page,
    pageSize,
    total,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
    users: users.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      image: u.image,
      role: u.role,
      emailVerified: u.emailVerified,
      createdAt: u.createdAt,
      cvCount: u._count.cvs,
      // All accounts use email/password sign-in.
      providers: u.accounts.length ? u.accounts.map((a) => a.provider) : ["email"],
    })),
  });
}
