import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// يعيد إحصائيات لوحة الأدمن وقائمة الطلبات (محمي بكوكي الجلسة).
export async function GET(request) {
  // حماية إضافية على مستوى المسار (إضافة إلى الـ middleware).
  const token = cookies().get(SESSION_COOKIE)?.value;
  if (!(await verifySessionToken(token))) {
    return NextResponse.json({ error: "غير مصرّح." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const statusFilter = searchParams.get("status"); // pending | paid | failed | all
  const search = (searchParams.get("q") || "").trim();

  const where = {};
  if (statusFilter && statusFilter !== "all") {
    where.status = statusFilter;
  }
  if (search) {
    where.OR = [
      { customerName: { contains: search } },
      { customerEmail: { contains: search } },
    ];
  }

  const orders = await prisma.order.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 500,
    select: {
      id: true,
      status: true,
      amount: true,
      currency: true,
      templateId: true,
      language: true,
      customerName: true,
      customerEmail: true,
      createdAt: true,
    },
  });

  // إحصائيات عامة (لكل الطلبات لا المفلترة).
  const all = await prisma.order.findMany({
    select: { status: true, amount: true, templateId: true, createdAt: true },
  });

  const totalOrders = all.length;
  const paidOrders = all.filter((o) => o.status === "paid");
  const totalRevenue = paidOrders.reduce((sum, o) => sum + o.amount, 0); // بالسنت
  const conversion = totalOrders ? paidOrders.length / totalOrders : 0;

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const todayOrders = all.filter((o) => new Date(o.createdAt) >= startOfToday).length;

  // الإيرادات اليومية لآخر 30 يومًا.
  const days = 30;
  const revenueByDay = [];
  for (let i = days - 1; i >= 0; i--) {
    const day = new Date();
    day.setHours(0, 0, 0, 0);
    day.setDate(day.getDate() - i);
    const next = new Date(day);
    next.setDate(next.getDate() + 1);

    const dayRevenue = paidOrders
      .filter((o) => {
        const d = new Date(o.createdAt);
        return d >= day && d < next;
      })
      .reduce((sum, o) => sum + o.amount, 0);

    revenueByDay.push({
      date: day.toISOString().slice(5, 10), // MM-DD
      revenue: dayRevenue / 100,
    });
  }

  // القوالب الأكثر استخدامًا (للطلبات المدفوعة).
  const templateCounts = {};
  for (const o of paidOrders) {
    templateCounts[o.templateId] = (templateCounts[o.templateId] || 0) + 1;
  }
  const topTemplates = Object.entries(templateCounts)
    .map(([templateId, count]) => ({ templateId, count }))
    .sort((a, b) => b.count - a.count);

  return NextResponse.json({
    stats: {
      totalOrders,
      paidCount: paidOrders.length,
      totalRevenue: totalRevenue / 100,
      todayOrders,
      conversion,
      currency: "usd",
    },
    revenueByDay,
    topTemplates,
    orders: orders.map((o) => ({ ...o, amount: o.amount / 100 })),
  });
}
