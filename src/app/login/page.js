"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { Loader2, Mail, Lock } from "lucide-react";
import AuthShell from "@/components/auth/AuthShell";
import { useT } from "@/components/i18n/LocaleProvider";

function LoginInner() {
  const t = useT();
  const router = useRouter();
  const params = useSearchParams();
  const callbackUrl = params.get("callbackUrl") || "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
      callbackUrl,
    });
    if (res?.error) {
      // NextAuth returns "CredentialsSignin" for a plain bad-password reject;
      // our custom thrown messages (unverified email, rate limited) come
      // through verbatim.
      setError(
        res.error && res.error !== "CredentialsSignin"
          ? res.error
          : t("auth.incorrectCredentials")
      );
      setLoading(false);
      return;
    }
    router.replace(callbackUrl);
    router.refresh();
  }

  return (
    <AuthShell
      title={t("auth.welcomeBack")}
      subtitle={t("auth.signInSubtitle")}
      footer={
        <>
          {t("auth.noAccount")}{" "}
          <Link href="/register" className="font-semibold text-brand-700 hover:underline">
            {t("auth.createOne")}
          </Link>
        </>
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

        <label className="block">
          <span className="field-label">{t("common.password")}</span>
          <div className="relative">
            <Lock className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="password"
              required
              autoComplete="current-password"
              className="field-input ps-10"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>
        </label>

        <div className="-mt-2 text-end">
          <Link href="/forgot-password" className="text-xs font-semibold text-brand-700 hover:underline">
            {t("auth.forgotPassword")}
          </Link>
        </div>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-600">
            {error}
          </div>
        )}

        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : null}
          {t("common.signIn")}
        </button>
      </form>
    </AuthShell>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginInner />
    </Suspense>
  );
}
