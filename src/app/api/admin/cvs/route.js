import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PAGE_SIZE = 25;
const MAX_PAGE_SIZE = 100;

// GET /api/admin/cvs?q=&template=&page=&pageSize=
export async function GET(request) {
  const admin = await requireRole(["ADMIN", "OWNER"]);
  if (!admin) return NextResponse.json({ error: "Forbidden." }, { status: 403 });

  const sp = new URL(request.url).searchParams;
  const search = (sp.get("q") || "").trim();
  const template = (sp.get("template") || "").trim();
  const page = Math.max(1, Number.parseInt(sp.get("page") || "1", 10) || 1);
  const pageSize = Math.min(
    MAX_PAGE_SIZE,
    Math.max(1, Number.parseInt(sp.get("pageSize") || String(PAGE_SIZE), 10) || PAGE_SIZE)
  );

  const where = {};
  if (search) {
    // Case-insensitive: see the note in the users route.
    where.OR = [
      { title: { contains: search, mode: "insensitive" } },
      { fullName: { contains: search, mode: "insensitive" } },
      { user: { email: { contains: search, mode: "insensitive" } } },
    ];
  }
  if (template) where.templateId = template;

  const [total, cvs] = await Promise.all([
    prisma.cV.count({ where }),
    prisma.cV.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
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
    }),
  ]);

  return NextResponse.json({
    page,
    pageSize,
    total,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
    cvs,
  });
}
