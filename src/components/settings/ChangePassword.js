"use client";

import { useState } from "react";
import { KeyRound, Loader2, CheckCircle2 } from "lucide-react";
import { useT } from "@/components/i18n/LocaleProvider";

export default function ChangePassword() {
  const t = useT();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (next !== confirm) {
      setError(t("settings.passwordMismatch"));
      return;
    }
    setError("");
    setDone(false);
    setLoading(true);
    try {
      const res = await fetch("/api/user/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: current, newPassword: next }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || t("common.somethingWrong"));
      setDone(true);
      setCurrent("");
      setNext("");
      setConfirm("");
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card">
      <h2 className="flex items-center gap-2 font-display text-lg font-bold text-ink">
        <KeyRound className="h-5 w-5 text-brand-600" />
        {t("settings.changePassword")}
      </h2>
      <p className="mt-1 text-sm text-slate-600">{t("settings.changePasswordBody")}</p>

      <form onSubmit={handleSubmit} className="mt-5 grid gap-4 sm:max-w-md">
        <label className="block">
          <span className="field-label">{t("settings.currentPassword")}</span>
          <input
            type="password"
            required
            autoComplete="current-password"
            className="field-input"
            value={current}
            onChange={(e) => setCurrent(e.target.value)}
          />
        </label>

        <label className="block">
          <span className="field-label">{t("settings.newPassword")}</span>
          <input
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            className="field-input"
            value={next}
            onChange={(e) => setNext(e.target.value)}
          />
        </label>

        <label className="block">
          <span className="field-label">{t("settings.confirmPassword")}</span>
          <input
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            className="field-input"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
          />
        </label>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-600">
            {error}
          </div>
        )}
        {done && (
          <div className="flex items-center gap-2 rounded-xl border border-brand-200 bg-brand-50 p-3 text-sm text-brand-800">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            {t("settings.passwordUpdated")}
          </div>
        )}

        <button type="submit" disabled={loading} className="btn-primary w-full sm:w-auto">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {t("settings.updatePassword")}
        </button>
      </form>
    </div>
  );
}
