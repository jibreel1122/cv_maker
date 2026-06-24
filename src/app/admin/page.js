"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import {
  Shield,
  Users,
  FileText,
  UserCog,
  CalendarPlus,
  Loader2,
  Search,
  Download,
  Eye,
  Trash2,
  Home,
  X,
} from "lucide-react";
import CVPreview from "@/components/CVPreview";

const TEMPLATE_NAMES = {
  classic: "Classic",
  modern: "Modern",
  professional: "Professional",
  minimal: "Minimal",
  elegant: "Elegant",
  compact: "Compact",
};

const ROLE_STYLES = {
  OWNER: "bg-amber-100 text-amber-700",
  ADMIN: "bg-brand-100 text-brand-700",
  USER: "bg-slate-100 text-slate-600",
};

function StatCard({ icon: Icon, label, value }) {
  return (
    <div className="card">
      <div className="flex items-center justify-between">
        <span className="text-sm text-slate-500">{label}</span>
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
          <Icon className="h-5 w-5" />
        </span>
      </div>
      <div className="mt-3 font-display text-3xl font-extrabold text-ink">{value}</div>
    </div>
  );
}

export default function AdminDashboard() {
  const { data: session } = useSession();
  const myRole = session?.user?.role;
  const myId = session?.user?.id;

  const [tab, setTab] = useState("overview");
  const [stats, setStats] = useState(null);
  const [signups, setSignups] = useState([]);
  const [users, setUsers] = useState(null);
  const [cvs, setCvs] = useState(null);
  const [userQ, setUserQ] = useState("");
  const [cvQ, setCvQ] = useState("");
  const [preview, setPreview] = useState(null); // { data, templateId, title }
  const [busyId, setBusyId] = useState(null);

  async function loadStats() {
    const res = await fetch("/api/admin/stats");
    if (!res.ok) return;
    const json = await res.json();
    setStats(json.stats);
    setSignups(json.signupsByDay || []);
  }
  async function loadUsers() {
    const sp = userQ.trim() ? `?q=${encodeURIComponent(userQ.trim())}` : "";
    const res = await fetch(`/api/admin/users${sp}`);
    if (!res.ok) return;
    const json = await res.json();
    setUsers(json.users || []);
  }
  async function loadCvs() {
    const sp = cvQ.trim() ? `?q=${encodeURIComponent(cvQ.trim())}` : "";
    const res = await fetch(`/api/admin/cvs${sp}`);
    if (!res.ok) return;
    const json = await res.json();
    setCvs(json.cvs || []);
  }

  useEffect(() => {
    loadStats();
    loadUsers();
    loadCvs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function changeRole(userId, role) {
    setBusyId(userId);
    const res = await fetch(`/api/admin/users/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role }),
    });
    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      alert(json.error || "Could not change role.");
    }
    setBusyId(null);
    loadUsers();
    loadStats();
  }

  async function deleteUser(userId) {
    if (!confirm("Delete this user and all their CVs? This cannot be undone.")) return;
    setBusyId(userId);
    const res = await fetch(`/api/admin/users/${userId}`, { method: "DELETE" });
    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      alert(json.error || "Could not delete user.");
    }
    setBusyId(null);
    loadUsers();
    loadStats();
    loadCvs();
  }

  async function openPreview(cvId, title) {
    setPreview({ loading: true, title });
    const res = await fetch(`/api/cv/${cvId}`);
    const json = await res.json();
    setPreview({ data: json.data, templateId: json.templateId, title: title || json.title });
  }

  // Which roles the current admin may assign to a given target.
  function rolesFor(target) {
    const all = myRole === "OWNER" ? ["USER", "ADMIN", "OWNER"] : ["USER", "ADMIN"];
    // Admins cannot modify owners.
    if (target.role === "OWNER" && myRole !== "OWNER") return null;
    return all;
  }

  const TABS = [
    { id: "overview", label: "Overview", icon: Shield },
    { id: "users", label: "Users", icon: Users },
    { id: "cvs", label: "CVs", icon: FileText },
  ];

  return (
    <main className="min-h-screen bg-canvas">
      <header className="border-b border-slate-100 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-white">
              <Shield className="h-5 w-5" />
            </span>
            <div>
              <span className="font-display text-lg font-extrabold text-ink">Admin</span>
              <span className="ml-2 chip bg-brand-50 text-brand-700">{myRole}</span>
            </div>
          </div>
          <Link href="/dashboard" className="btn-ghost text-sm">
            <Home className="h-4 w-4" /> My dashboard
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 py-8">
        {/* Tabs */}
        <div className="mb-6 flex gap-2">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition ${
                tab === t.id ? "bg-brand-600 text-white" : "bg-white text-slate-600 hover:bg-brand-50"
              }`}
            >
              <t.icon className="h-4 w-4" /> {t.label}
            </button>
          ))}
        </div>

        {/* Overview */}
        {tab === "overview" && (
          <div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard icon={Users} label="Total users" value={stats?.totalUsers ?? "—"} />
              <StatCard icon={FileText} label="Total CVs" value={stats?.totalCvs ?? "—"} />
              <StatCard icon={UserCog} label="Admins" value={stats?.admins ?? "—"} />
              <StatCard icon={CalendarPlus} label="New today" value={stats?.newToday ?? "—"} />
            </div>

            <div className="mt-6 card">
              <h2 className="mb-4 font-display text-lg font-bold text-ink">
                New users (last 30 days)
              </h2>
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={signups}>
                    <defs>
                      <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#10b981" stopOpacity={0.35} />
                        <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e9f1ed" />
                    <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} />
                    <YAxis allowDecimals={false} stroke="#94a3b8" fontSize={11} />
                    <Tooltip
                      contentStyle={{
                        background: "#ffffff",
                        border: "1px solid #e2e8f0",
                        borderRadius: 10,
                        color: "#0f172a",
                      }}
                      formatter={(v) => [v, "New users"]}
                    />
                    <Area type="monotone" dataKey="count" stroke="#059669" strokeWidth={2} fill="url(#g)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* Users */}
        {tab === "users" && (
          <div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                loadUsers();
              }}
              className="relative mb-4 max-w-sm"
            >
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={userQ}
                onChange={(e) => setUserQ(e.target.value)}
                placeholder="Search by name or email..."
                className="field-input pl-10"
              />
            </form>

            <div className="overflow-x-auto rounded-2xl border border-slate-100 bg-white">
              <table className="w-full min-w-[820px] text-left text-sm">
                <thead className="bg-slate-50 text-slate-500">
                  <tr>
                    <th className="px-4 py-3 font-semibold">User</th>
                    <th className="px-4 py-3 font-semibold">Sign-in</th>
                    <th className="px-4 py-3 font-semibold">CVs</th>
                    <th className="px-4 py-3 font-semibold">Joined</th>
                    <th className="px-4 py-3 font-semibold">Role</th>
                    <th className="px-4 py-3 font-semibold"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {users === null ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-10 text-center text-slate-400">
                        <Loader2 className="mx-auto h-6 w-6 animate-spin" />
                      </td>
                    </tr>
                  ) : users.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-10 text-center text-slate-400">
                        No users found.
                      </td>
                    </tr>
                  ) : (
                    users.map((u) => {
                      const assignable = rolesFor(u);
                      const isSelf = u.id === myId;
                      return (
                        <tr key={u.id} className="text-ink hover:bg-slate-50/60">
                          <td className="px-4 py-3">
                            <div className="font-semibold">{u.name || "—"}</div>
                            <div className="text-xs text-slate-500">{u.email}</div>
                          </td>
                          <td className="px-4 py-3 text-slate-500">
                            {u.providers.join(", ")}
                          </td>
                          <td className="px-4 py-3">{u.cvCount}</td>
                          <td className="px-4 py-3 text-slate-500">
                            {new Date(u.createdAt).toLocaleDateString("en-GB", {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            })}
                          </td>
                          <td className="px-4 py-3">
                            {assignable && !isSelf ? (
                              <select
                                value={u.role}
                                disabled={busyId === u.id}
                                onChange={(e) => changeRole(u.id, e.target.value)}
                                className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-ink focus:border-brand-500 focus:outline-none"
                              >
                                {assignable.map((r) => (
                                  <option key={r} value={r}>
                                    {r}
                                  </option>
                                ))}
                              </select>
                            ) : (
                              <span className={`chip ${ROLE_STYLES[u.role]}`}>{u.role}</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right">
                            {myRole === "OWNER" && !isSelf && u.role !== "OWNER" && (
                              <button
                                onClick={() => deleteUser(u.id)}
                                disabled={busyId === u.id}
                                className="text-slate-400 hover:text-red-600"
                                aria-label="Delete user"
                              >
                                {busyId === u.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Trash2 className="h-4 w-4" />
                                )}
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* CVs */}
        {tab === "cvs" && (
          <div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                loadCvs();
              }}
              className="relative mb-4 max-w-sm"
            >
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={cvQ}
                onChange={(e) => setCvQ(e.target.value)}
                placeholder="Search by name, title, or owner email..."
                className="field-input pl-10"
              />
            </form>

            <div className="overflow-x-auto rounded-2xl border border-slate-100 bg-white">
              <table className="w-full min-w-[820px] text-left text-sm">
                <thead className="bg-slate-50 text-slate-500">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Name</th>
                    <th className="px-4 py-3 font-semibold">Title</th>
                    <th className="px-4 py-3 font-semibold">Owner</th>
                    <th className="px-4 py-3 font-semibold">Template</th>
                    <th className="px-4 py-3 font-semibold">Updated</th>
                    <th className="px-4 py-3 font-semibold"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {cvs === null ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-10 text-center text-slate-400">
                        <Loader2 className="mx-auto h-6 w-6 animate-spin" />
                      </td>
                    </tr>
                  ) : cvs.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-10 text-center text-slate-400">
                        No CVs found.
                      </td>
                    </tr>
                  ) : (
                    cvs.map((cv) => (
                      <tr key={cv.id} className="text-ink hover:bg-slate-50/60">
                        <td className="px-4 py-3 font-semibold">{cv.fullName || "—"}</td>
                        <td className="px-4 py-3 text-slate-600">{cv.jobTitle || "—"}</td>
                        <td className="px-4 py-3 text-slate-500">
                          <div>{cv.user?.name || "—"}</div>
                          <div className="text-xs">{cv.user?.email}</div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="chip bg-brand-50 text-brand-700">
                            {TEMPLATE_NAMES[cv.templateId] || cv.templateId}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-500">
                          {new Date(cv.updatedAt).toLocaleDateString("en-GB", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-3">
                            <button
                              onClick={() => openPreview(cv.id, cv.fullName || cv.title)}
                              className="text-slate-400 hover:text-brand-700"
                              aria-label="View CV"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            <a
                              href={`/api/cv/${cv.id}/pdf`}
                              className="text-slate-400 hover:text-brand-700"
                              aria-label="Download CV"
                            >
                              <Download className="h-4 w-4" />
                            </a>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* CV preview modal */}
      {preview && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center overflow-auto bg-ink/40 p-4 sm:p-8"
          onClick={() => setPreview(null)}
        >
          <div
            className="w-full max-w-2xl rounded-2xl bg-white p-4 shadow-card"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between">
              <span className="font-display font-bold text-ink">
                {preview.title || "CV preview"}
              </span>
              <button onClick={() => setPreview(null)} className="text-slate-400 hover:text-ink">
                <X className="h-5 w-5" />
              </button>
            </div>
            {preview.loading ? (
              <div className="flex items-center justify-center py-16 text-slate-400">
                <Loader2 className="h-7 w-7 animate-spin" />
              </div>
            ) : (
              <CVPreview cvData={preview.data} templateId={preview.templateId} />
            )}
          </div>
        </div>
      )}
    </main>
  );
}
