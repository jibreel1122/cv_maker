import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/admin/cvs — list every CV in the system with its owner (admin/owner).
export async function GET(request) {
  const admin = await requireRole(["ADMIN", "OWNER"]);
  if (!admin) return NextResponse.json({ error: "Forbidden." }, { status: 403 });

  const search = (new URL(request.url).searchParams.get("q") || "").trim();
  const where = search
    ? {
        OR: [
          { title: { contains: search } },
          { fullName: { contains: search } },
          { user: { email: { contains: search } } },
        ],
      }
    : {};

  const cvs = await prisma.cV.findMany({
    where,
    orderBy: { updatedAt: "desc" },
    take: 500,
    select: {
      id: true,
      title: true,
      templateId: true,
      fullName: true,
      jobTitle: true,
      createdAt: true,
      updatedAt: true,
      user: { select: { id: true, name: true, email: true } },
    },
  });

  return NextResponse.json({ cvs });
}
