import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";
import { purgeExpiredAuditLogs } from "@/lib/audit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CHART_DAYS = 30;

// GET /api/admin/stats — high-level counts plus a 30-day signups chart.
//
// Every figure here is computed by the database. The previous version pulled
// every user row into the Node process and filtered the array 31 times (once per
// chart day), which is fine at a hundred users and a memory problem at a hundred
// thousand — on a route admins refresh often.
export async function GET() {
  const admin = await requireRole(["ADMIN", "OWNER"]);
  if (!admin) return NextResponse.json({ error: "Forbidden." }, { status: 403 });

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const since = new Date(startOfToday);
  since.setDate(since.getDate() - (CHART_DAYS - 1));

  const [totalUsers, totalCvs, unverified, newToday, activeUsers, byRole, signupRows] =
    await Promise.all([
      prisma.user.count(),
      prisma.cV.count(),
      prisma.user.count({ where: { emailVerified: null, passwordHash: { not: null } } }),
      prisma.user.count({ where: { createdAt: { gte: startOfToday } } }),
      // "Active" = touched a CV in the last 30 days. Distinct authors of recently
      // updated CVs is the closest signal available without a sessions table.
      prisma.cV
        .findMany({
          where: { updatedAt: { gte: since } },
          distinct: ["userId"],
          select: { userId: true },
        })
        .then((rows) => rows.length),
      prisma.user.groupBy({ by: ["role"], _count: { _all: true } }),
      // One grouped scan for the whole chart instead of 30 passes in JS.
      prisma.$queryRaw`
        SELECT to_char(date_trunc('day', "createdAt"), 'YYYY-MM-DD') AS day,
               COUNT(*)::int AS count
        FROM "User"
        WHERE "createdAt" >= ${since}
        GROUP BY 1
        ORDER BY 1
      `,
    ]);

  const admins = byRole
    .filter((r) => r.role === "ADMIN" || r.role === "OWNER")
    .reduce((sum, r) => sum + r._count._all, 0);

  // The query only returns days that had signups; the chart needs every day, so
  // the gaps are filled here rather than with a generate_series join.
  const counts = new Map(signupRows.map((r) => [r.day, Number(r.count)]));
  const signupsByDay = [];
  for (let i = 0; i < CHART_DAYS; i++) {
    const day = new Date(since);
    day.setDate(day.getDate() + i);
    const key = day.toISOString().slice(0, 10);
    signupsByDay.push({ date: key.slice(5), count: counts.get(key) || 0 });
  }

  // Opportunistic retention: the privacy policy promises audit logs are kept for
  // 90 days, and this is the most-visited admin route, so it is where that
  // promise gets enforced without adding a scheduler.
  purgeExpiredAuditLogs();

  return NextResponse.json({
    stats: { totalUsers, totalCvs, admins, newToday, unverified, activeUsers },
    signupsByDay,
  });
}
