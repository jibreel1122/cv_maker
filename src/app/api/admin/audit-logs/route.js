import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PAGE_SIZE = 50;

// GET /api/admin/audit-logs?action=&q=&from=&to=&page=
// OWNER only. Read-only, paginated (50 per page).
export async function GET(request) {
  const owner = await requireRole(["OWNER"]);
  if (!owner) return NextResponse.json({ error: "Forbidden." }, { status: 403 });

  const sp = new URL(request.url).searchParams;
  const action = sp.get("action") || "";
  const q = (sp.get("q") || "").trim();
  const from = sp.get("from");
  const to = sp.get("to");
  const page = Math.max(1, parseInt(sp.get("page") || "1", 10) || 1);

  const where = {};
  if (action) where.action = action;
  if (q) where.metadata = { contains: q }; // email/IP live inside the JSON string
  if (from || to) {
    where.createdAt = {};
    if (from) where.createdAt.gte = new Date(from);
    if (to) {
      // include the whole "to" day
      const end = new Date(to);
      end.setHours(23, 59, 59, 999);
      where.createdAt.lte = end;
    }
  }

  const [total, logs] = await Promise.all([
    prisma.auditLog.count({ where }),
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
  ]);

  return NextResponse.json({
    page,
    pageSize: PAGE_SIZE,
    total,
    totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
    logs: logs.map((l) => ({
      id: l.id,
      action: l.action,
      userId: l.userId,
      metadata: safeParse(l.metadata),
      createdAt: l.createdAt,
    })),
  });
}

function safeParse(str) {
  if (!str) return null;
  try {
    return JSON.parse(str);
  } catch {
    return { raw: str };
  }
}
