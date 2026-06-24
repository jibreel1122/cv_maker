"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Shield, ArrowLeft, Loader2, ChevronLeft, ChevronRight, ScrollText } from "lucide-react";

const ACTIONS = [
  "LOGIN_FAILED",
  "LOGIN_SUCCESS",
  "DELETE_ACCOUNT",
  "ROLE_CHANGED",
  "USER_DELETED_BY_ADMIN",
  "EMAIL_VERIFIED",
];

const ACTION_STYLES = {
  LOGIN_FAILED: "bg-red-100 text-red-700",
  LOGIN_SUCCESS: "bg-brand-100 text-brand-700",
  DELETE_ACCOUNT: "bg-amber-100 text-amber-700",
  ROLE_CHANGED: "bg-indigo-100 text-indigo-700",
  USER_DELETED_BY_ADMIN: "bg-amber-100 text-amber-700",
  EMAIL_VERIFIED: "bg-slate-100 text-slate-600",
};

export default function AuditLogsPage() {
  const { data: session, status } = useSession();
  const isOwner = session?.user?.role === "OWNER";

  const [action, setAction] = useState("");
  const [q, setQ] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [page, setPage] = useState(1);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  async function load(toPage = page) {
    setLoading(true);
    const sp = new URLSearchParams();
    if (action) sp.set("action", action);
    if (q.trim()) sp.set("q", q.trim());
    if (from) sp.set("from", from);
    if (to) sp.set("to", to);
    sp.set("page", String(toPage));
    const res = await fetch(`/api/admin/audit-logs?${sp.toString()}`);
    if (res.ok) {
      const json = await res.json();
      setData(json);
      setPage(json.page);
    }
    setLoading(false);
  }

  useEffect(() => {
    if (isOwner) load(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOwner, action]);

  if (status === "loading") return null;

  if (!isOwner) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-canvas px-6 text-center">
        <Shield className="h-10 w-10 text-slate-300" />
        <h1 className="mt-4 font-display text-xl font-bold text-ink">Owners only</h1>
        <p className="mt-1 text-slate-500">Audit logs are restricted to the owner.</p>
        <Link href="/admin" className="btn-outline mt-6 text-sm">
          Back to admin
        </Link>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-canvas">
      <header className="border-b border-slate-100 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-white">
              <ScrollText className="h-5 w-5" />
            </span>
            <span className="font-display text-lg font-extrabold text-ink">Audit logs</span>
          </div>
          <Link href="/admin" className="btn-ghost text-sm">
            <ArrowLeft className="h-4 w-4" /> Back to admin
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 py-8">
        {/* Filters */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            load(1);
          }}
          className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5"
        >
          <select
            value={action}
            onChange={(e) => setAction(e.target.value)}
            className="field-input"
          >
            <option value="">All actions</option>
            {ACTIONS.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Email or IP…"
            className="field-input"
          />
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="field-input" />
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="field-input" />
          <button type="submit" className="btn-primary">
            Apply filters
          </button>
        </form>

        <div className="overflow-x-auto rounded-2xl border border-slate-100 bg-white">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="px-4 py-3 font-semibold">Time</th>
                <th className="px-4 py-3 font-semibold">Action</th>
                <th className="px-4 py-3 font-semibold">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={3} className="px-4 py-10 text-center text-slate-400">
                    <Loader2 className="mx-auto h-6 w-6 animate-spin" />
                  </td>
                </tr>
              ) : !data || data.logs.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-4 py-10 text-center text-slate-400">
                    No log entries match these filters.
                  </td>
                </tr>
              ) : (
                data.logs.map((l) => (
                  <tr key={l.id} className="align-top text-ink hover:bg-slate-50/60">
                    <td className="whitespace-nowrap px-4 py-3 text-slate-500">
                      {new Date(l.createdAt).toLocaleString("en-GB")}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`chip ${ACTION_STYLES[l.action] || "bg-slate-100 text-slate-600"}`}>
                        {l.action}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      <code className="break-all text-xs">
                        {l.metadata ? JSON.stringify(l.metadata) : "—"}
                      </code>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {data && data.total > 0 && (
          <div className="mt-4 flex items-center justify-between text-sm text-slate-500">
            <span>
              {data.total} entries · page {data.page} of {data.totalPages}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => load(page - 1)}
                disabled={page <= 1 || loading}
                className="btn-outline !px-3 !py-2 disabled:opacity-40"
              >
                <ChevronLeft className="h-4 w-4" /> Prev
              </button>
              <button
                onClick={() => load(page + 1)}
                disabled={page >= data.totalPages || loading}
                className="btn-outline !px-3 !py-2 disabled:opacity-40"
              >
                Next <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
