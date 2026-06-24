"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import {
  LayoutDashboard,
  DollarSign,
  ShoppingBag,
  TrendingUp,
  CalendarDays,
  LogOut,
  Loader2,
  Search,
} from "lucide-react";

const TEMPLATE_NAMES = { classic: "كلاسيكي", modern: "عصري", compact: "مُكثّف" };
const STATUS_LABELS = {
  paid: { text: "مدفوع", cls: "bg-green-500/15 text-green-400" },
  pending: { text: "قيد الانتظار", cls: "bg-amber-500/15 text-amber-400" },
  failed: { text: "فاشل", cls: "bg-red-500/15 text-red-400" },
};

function StatCard({ icon: Icon, label, value, sub }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-midnight-soft/40 p-5">
      <div className="flex items-center justify-between">
        <span className="text-sm text-slateblue">{label}</span>
        <Icon className="h-5 w-5 text-gold" />
      </div>
      <div className="mt-3 font-display text-3xl font-black text-cream">{value}</div>
      {sub && <div className="mt-1 text-xs text-cream/50">{sub}</div>}
    </div>
  );
}

export default function AdminDashboard() {
  const router = useRouter();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("all");
  const [q, setQ] = useState("");

  async function load() {
    setLoading(true);
    const sp = new URLSearchParams();
    if (status !== "all") sp.set("status", status);
    if (q.trim()) sp.set("q", q.trim());
    const res = await fetch(`/api/admin/stats?${sp.toString()}`);
    if (res.status === 401) {
      router.replace("/admin/login");
      return;
    }
    const json = await res.json();
    setData(json);
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  async function handleLogout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.replace("/admin/login");
  }

  const stats = data?.stats;
  const fmtMoney = (n) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n || 0);

  const topTemplate = useMemo(() => {
    const t = data?.topTemplates?.[0];
    return t ? TEMPLATE_NAMES[t.templateId] || t.templateId : "—";
  }, [data]);

  return (
    <main className="min-h-screen bg-midnight-deep">
      <header className="border-b border-white/10">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <LayoutDashboard className="h-6 w-6 text-gold" />
            <span className="font-display text-xl font-extrabold text-cream">لوحة الأدمن</span>
          </div>
          <button onClick={handleLogout} className="btn-outline !px-4 !py-2 text-sm">
            <LogOut className="h-4 w-4" /> خروج
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 py-8">
        {loading && !data ? (
          <div className="flex items-center justify-center py-24 text-slateblue">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <>
            {/* بطاقات الإحصائيات */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard icon={ShoppingBag} label="إجمالي الطلبات" value={stats?.totalOrders ?? 0} sub={`${stats?.paidCount ?? 0} مدفوع`} />
              <StatCard icon={DollarSign} label="إجمالي الإيرادات" value={fmtMoney(stats?.totalRevenue)} />
              <StatCard icon={CalendarDays} label="طلبات اليوم" value={stats?.todayOrders ?? 0} />
              <StatCard
                icon={TrendingUp}
                label="نسبة التحويل"
                value={`${Math.round((stats?.conversion ?? 0) * 100)}%`}
                sub={`القالب الأكثر: ${topTemplate}`}
              />
            </div>

            {/* رسم الإيرادات */}
            <div className="mt-6 rounded-2xl border border-white/10 bg-midnight-soft/40 p-5">
              <h2 className="mb-4 font-display text-lg font-bold text-cream">
                الإيرادات اليومية (آخر ٣٠ يوم)
              </h2>
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data?.revenueByDay || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e2d4d" />
                    <XAxis dataKey="date" stroke="#5B6B86" fontSize={11} />
                    <YAxis stroke="#5B6B86" fontSize={11} />
                    <Tooltip
                      contentStyle={{
                        background: "#0B1B3A",
                        border: "1px solid #2c3e63",
                        borderRadius: 8,
                        color: "#F6F3EC",
                      }}
                      formatter={(v) => [fmtMoney(v), "الإيراد"]}
                    />
                    <Line type="monotone" dataKey="revenue" stroke="#C9A227" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* أدوات الفلترة */}
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex gap-2">
                {[
                  { id: "all", label: "الكل" },
                  { id: "paid", label: "مدفوع" },
                  { id: "pending", label: "قيد الانتظار" },
                  { id: "failed", label: "فاشل" },
                ].map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setStatus(s.id)}
                    className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition ${
                      status === s.id
                        ? "bg-gold text-midnight-deep"
                        : "bg-white/5 text-slateblue hover:bg-white/10"
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  load();
                }}
                className="relative"
              >
                <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slateblue" />
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="ابحث بالاسم أو الإيميل..."
                  className="field-input w-full pr-10 sm:w-72"
                />
              </form>
            </div>

            {/* جدول الطلبات */}
            <div className="mt-4 overflow-x-auto rounded-2xl border border-white/10">
              <table className="w-full min-w-[760px] text-right text-sm">
                <thead className="bg-midnight-soft/60 text-slateblue">
                  <tr>
                    <th className="px-4 py-3 font-semibold">التاريخ</th>
                    <th className="px-4 py-3 font-semibold">الاسم</th>
                    <th className="px-4 py-3 font-semibold">الإيميل</th>
                    <th className="px-4 py-3 font-semibold">القالب</th>
                    <th className="px-4 py-3 font-semibold">اللغة</th>
                    <th className="px-4 py-3 font-semibold">المبلغ</th>
                    <th className="px-4 py-3 font-semibold">الحالة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {(data?.orders || []).map((o) => {
                    const st = STATUS_LABELS[o.status] || STATUS_LABELS.pending;
                    return (
                      <tr key={o.id} className="text-cream/90 hover:bg-white/5">
                        <td className="whitespace-nowrap px-4 py-3 text-cream/70">
                          {new Date(o.createdAt).toLocaleDateString("ar-EG", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}
                        </td>
                        <td className="px-4 py-3">{o.customerName || "—"}</td>
                        <td dir="ltr" className="px-4 py-3 text-right text-cream/70">
                          {o.customerEmail || "—"}
                        </td>
                        <td className="px-4 py-3">{TEMPLATE_NAMES[o.templateId] || o.templateId}</td>
                        <td className="px-4 py-3">{o.language === "ar" ? "عربي" : "إنجليزي"}</td>
                        <td className="px-4 py-3">{fmtMoney(o.amount)}</td>
                        <td className="px-4 py-3">
                          <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${st.cls}`}>
                            {st.text}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                  {(!data?.orders || data.orders.length === 0) && (
                    <tr>
                      <td colSpan={7} className="px-4 py-10 text-center text-slateblue">
                        لا توجد طلبات مطابقة.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
