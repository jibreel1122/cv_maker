"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { Loader2, Mail, CheckCircle2 } from "lucide-react";
import AuthShell from "@/components/auth/AuthShell";
import { useT } from "@/components/i18n/LocaleProvider";

function ForgotInner() {
  const t = useT();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || t("common.somethingWrong"));
      // The endpoint answers identically whether or not the account exists, and
      // so does this screen — it must not become the oracle the API refuses to be.
      setSent(true);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <AuthShell title={t("forgot.sent")}>
        <div className="flex flex-col items-center py-2 text-center">
          <CheckCircle2 className="h-12 w-12 text-brand-600" />
          <p className="mt-4 text-slate-600">{t("forgot.sentBody", { email })}</p>
          <Link href="/login" className="btn-outline mt-6 text-sm">
            {t("auth.backToLogin")}
          </Link>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title={t("forgot.title")}
      subtitle={t("forgot.subtitle")}
      footer={
        <Link href="/login" className="font-semibold text-brand-700 hover:underline">
          {t("auth.backToLogin")}
        </Link>
      }
    >
      <form onSubmit={handleSubmit} className="grid gap-4">
        <label className="block">
          <span className="field-label">{t("common.email")}</span>
          <div className="relative">
            <Mail className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="email"
              required
              autoComplete="email"
              className="field-input ps-10"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t("auth.emailPlaceholder")}
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
          {t("forgot.sendLink")}
        </button>
      </form>
    </AuthShell>
  );
}

export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ForgotInner />
    </Suspense>
  );
}
