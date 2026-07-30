"use client";

import { useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { AlertTriangle, Loader2, X } from "lucide-react";
import { useT } from "@/components/i18n/LocaleProvider";

export default function DeleteAccount() {
  const t = useT();
  const { data: session } = useSession();
  const user = session?.user;
  const isPrivileged = user?.role === "ADMIN" || user?.role === "OWNER";

  const [open, setOpen] = useState(false);
  const [confirmEmail, setConfirmEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const matches =
    confirmEmail.trim().toLowerCase() === (user?.email || "").toLowerCase();

  async function handleDelete() {
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/user/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: confirmEmail.trim() }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || t("common.somethingWrong"));
      // Invalidate the session and land on the homepage with a success flag.
      await signOut({ callbackUrl: "/?deleted=1" });
    } catch (e) {
      setError(e.message);
      setLoading(false);
    }
  }

  return (
    <div className="rounded-2xl border border-red-200 bg-red-50/50 p-6">
      <div className="flex items-center gap-2">
        <AlertTriangle className="h-5 w-5 text-red-500" />
        <h2 className="font-display text-lg font-bold text-red-700">{t("settings.dangerZone")}</h2>
      </div>
      <p className="mt-2 text-sm text-slate-600">
        {t("settings.dangerBody")}
      </p>

      {isPrivileged ? (
        <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          {t("settings.privilegedNotice")}
        </p>
      ) : (
        <button
          onClick={() => {
            setOpen(true);
            setConfirmEmail("");
            setError("");
          }}
          className="mt-5 inline-flex items-center gap-2 rounded-xl bg-red-600 px-5 py-2.5 font-semibold text-white transition hover:bg-red-700"
        >
          {t("settings.deleteButton")}
        </button>
      )}

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4"
          onClick={() => !loading && setOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-card"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-2 flex items-center justify-between">
              <h3 className="font-display text-lg font-bold text-ink">{t("settings.deleteTitle")}</h3>
              <button onClick={() => setOpen(false)} disabled={loading} className="text-slate-400 hover:text-ink">
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="text-sm text-slate-600">
              {t("settings.deleteBody")}
            </p>
            <label className="mt-4 block">
              <span className="field-label">
                {t("settings.typeEmail")}{" "}
                <span className="text-slate-400">{user?.email}</span>
              </span>
              <input
                className="field-input"
                value={confirmEmail}
                onChange={(e) => setConfirmEmail(e.target.value)}
                placeholder={user?.email}
                autoComplete="off"
              />
            </label>

            {error && (
              <div className="mt-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-600">
                {error}
              </div>
            )}

            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => setOpen(false)} disabled={loading} className="btn-outline !py-2.5 text-sm">
                {t("common.cancel")}
              </button>
              <button
                onClick={handleDelete}
                disabled={!matches || loading}
                className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {t("settings.deletePermanently")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
