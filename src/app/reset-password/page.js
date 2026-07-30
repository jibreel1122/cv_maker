"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, Lock, CheckCircle2, AlertTriangle } from "lucide-react";
import AuthShell from "@/components/auth/AuthShell";
import { useT } from "@/components/i18n/LocaleProvider";

function ResetInner() {
  const t = useT();
  const router = useRouter();
  const token = useSearchParams().get("token");

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  // "checking" until the server confirms the link, so an expired or tampered
  // token is reported on arrival rather than after the user has typed a new
  // password twice.
  const [state, setState] = useState(token ? "checking" : "invalid");

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(
          `/api/auth/reset-password?token=${encodeURIComponent(token)}`
        );
        const json = await res.json().catch(() => ({}));
        if (!cancelled) setState(json.valid ? "form" : "invalid");
      } catch {
        // Network trouble is not a bad token — let them try submitting.
        if (!cancelled) setState("form");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (password !== confirm) {
      setError(t("forgot.mismatch"));
      return;
    }
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const json = await res.json().catch(() => ({}));
      if (res.ok && json.status === "reset") {
        setState("done");
        setTimeout(() => router.replace("/login"), 2500);
        return;
      }
      // A bad or expired token is a dead end, not a retryable form error.
      if (json.status === "invalid") {
        setState("invalid");
        return;
      }
      throw new Error(json.error || t("common.somethingWrong"));
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  if (state === "checking") {
    return (
      <AuthShell title={t("forgot.resetTitle")}>
        <div className="flex items-center justify-center py-10 text-slate-400">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </AuthShell>
    );
  }

  if (state === "invalid") {
    return (
      <AuthShell title={t("forgot.resetTitle")}>
        <div className="flex flex-col items-center py-4 text-center">
          <AlertTriangle className="h-12 w-12 text-amber-500" />
          <p className="mt-4 text-slate-600">{t("forgot.invalidToken")}</p>
          <Link href="/forgot-password" className="btn-primary mt-6 text-sm">
            {t("forgot.requestNew")}
          </Link>
        </div>
      </AuthShell>
    );
  }

  if (state === "done") {
    return (
      <AuthShell title={t("forgot.success")}>
        <div className="flex flex-col items-center py-4 text-center">
          <CheckCircle2 className="h-12 w-12 text-brand-600" />
          <p className="mt-4 text-slate-600">{t("forgot.successBody")}</p>
          <Link href="/login" className="btn-primary mt-6 text-sm">
            {t("common.signIn")}
          </Link>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell title={t("forgot.resetTitle")} subtitle={t("forgot.resetSubtitle")}>
      <form onSubmit={handleSubmit} className="grid gap-4">
        <label className="block">
          <span className="field-label">{t("forgot.newPassword")}</span>
          <div className="relative">
            <Lock className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              className="field-input ps-10"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t("auth.passwordMin")}
            />
          </div>
        </label>

        <label className="block">
          <span className="field-label">{t("forgot.confirmPassword")}</span>
          <div className="relative">
            <Lock className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              className="field-input ps-10"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
            />
          </div>
        </label>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-600">
            {error}
          </div>
        )}

        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : null}
          {t("forgot.updatePassword")}
        </button>
      </form>
    </AuthShell>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetInner />
    </Suspense>
  );
}
