import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/admin/stats — high-level counts plus a 30-day signups chart.
export async function GET() {
  const admin = await requireRole(["ADMIN", "OWNER"]);
  if (!admin) return NextResponse.json({ error: "Forbidden." }, { status: 403 });

  const [totalUsers, totalCvs, unverified, users] = await Promise.all([
    prisma.user.count(),
    prisma.cV.count(),
    prisma.user.count({ where: { emailVerified: null, passwordHash: { not: null } } }),
    prisma.user.findMany({ select: { role: true, createdAt: true } }),
  ]);

  const admins = users.filter((u) => u.role === "ADMIN" || u.role === "OWNER").length;

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const newToday = users.filter((u) => new Date(u.createdAt) >= startOfToday).length;

  // New users per day over the last 30 days.
  const days = 30;
  const signupsByDay = [];
  for (let i = days - 1; i >= 0; i--) {
    const day = new Date();
    day.setHours(0, 0, 0, 0);
    day.setDate(day.getDate() - i);
    const next = new Date(day);
    next.setDate(next.getDate() + 1);
    const count = users.filter((u) => {
      const d = new Date(u.createdAt);
      return d >= day && d < next;
    }).length;
    signupsByDay.push({ date: day.toISOString().slice(5, 10), count });
  }

  return NextResponse.json({
    stats: { totalUsers, totalCvs, admins, newToday, unverified },
    signupsByDay,
  });
}
