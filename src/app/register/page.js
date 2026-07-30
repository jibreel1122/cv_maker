"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { Loader2, Mail, Lock, User, CheckCircle2, Copy, ExternalLink } from "lucide-react";
import AuthShell from "@/components/auth/AuthShell";

function RegisterInner() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(null); // the registration result payload
  const [copied, setCopied] = useState(false);

  const verifyUrl = done?.verifyUrl || "";

  async function handleSubmit(e) {
    e.preventDefault();
    if (!agreed) return;
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Could not create your account.");
      setDone(json);
    } catch (e) {
      setError(e.message);
      setLoading(false);
    }
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(verifyUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard may be unavailable — the link is still visible to copy manually */
    }
  }

  if (done) {
    // Verification is switched off (no mail transport configured), so the
    // account is already usable.
    if (done.verified) {
      return (
        <AuthShell title="You're all set">
          <div className="flex flex-col items-center py-2 text-center">
            <CheckCircle2 className="h-12 w-12 text-brand-600" />
            <h2 className="mt-4 font-display text-lg font-bold text-ink">Account created!</h2>
            <p className="mt-1 text-slate-600">
              Your account <strong>{email}</strong> is ready to use.
            </p>
            <Link href="/login" className="btn-primary mt-6 w-full text-sm">
              Sign in
            </Link>
          </div>
        </AuthShell>
      );
    }

    return (
      <AuthShell title="Verify your email">
        <div className="flex flex-col items-center py-2 text-center">
          <CheckCircle2 className="h-12 w-12 text-brand-600" />
          <h2 className="mt-4 font-display text-lg font-bold text-ink">Account created!</h2>
          <p className="mt-1 text-slate-600">
            One last step — verify <strong>{email}</strong> to activate your account.
          </p>

          {verifyUrl ? (
            <div className="mt-6 w-full text-left">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Your verification link
              </p>
              <div className="mt-1.5 flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 p-2">
                <code className="flex-1 truncate px-1 text-xs text-slate-600">{verifyUrl}</code>
                <button
                  type="button"
                  onClick={copyLink}
                  title="Copy link"
                  className="rounded-lg p-1.5 text-slate-500 transition hover:bg-white hover:text-brand-700"
                >
                  <Copy className="h-4 w-4" />
                </button>
              </div>
              {copied && <p className="mt-1 text-xs text-brand-600">Copied to clipboard.</p>}

              <a href={verifyUrl} className="btn-primary mt-4 w-full text-sm">
                <ExternalLink className="h-4 w-4" /> Verify my email now
              </a>
              <p className="mt-3 text-xs text-slate-400">
                Shown because this is a development build. In production the link
                is only sent by email.
              </p>
            </div>
          ) : done.delivered ? (
            <>
              <div className="mt-5 flex items-start gap-2.5 rounded-xl border border-brand-200 bg-brand-50 px-4 py-3 text-left text-sm text-brand-800">
                <Mail className="mt-0.5 h-4 w-4 shrink-0" />
                <span>
                  We&apos;ve emailed you a verification link. It expires in 24
                  hours — check your spam folder if it doesn&apos;t arrive.
                </span>
              </div>
              <Link href="/login" className="btn-outline mt-5 text-sm">
                Go to login
              </Link>
            </>
          ) : (
            <>
              <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-left text-sm text-amber-800">
                Your account was created, but we couldn&apos;t send the
                verification email just now. Please try again shortly, or contact
                support if it keeps happening.
              </div>
              <Link href="/login" className="btn-outline mt-5 text-sm">
                Go to login
              </Link>
            </>
          )}
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Create your account"
      subtitle="It's free — build and download CVs in minutes."
      footer={
        <>
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-brand-700 hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="grid gap-4">
        <label className="block">
          <span className="field-label">Full name</span>
          <div className="relative">
            <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              required
              autoComplete="name"
              className="field-input pl-10"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
            />
          </div>
        </label>

        <label className="block">
          <span className="field-label">Email</span>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="email"
              required
              autoComplete="email"
              className="field-input pl-10"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@email.com"
            />
          </div>
        </label>

        <label className="block">
          <span className="field-label">Password</span>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              className="field-input pl-10"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 8 characters"
            />
          </div>
        </label>

        <label className="flex cursor-pointer items-start gap-2.5 text-sm text-slate-600">
          <input
            type="checkbox"
            className="mt-0.5 h-4 w-4 accent-brand-600"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
          />
          <span>
            I agree to the{" "}
            <Link href="/terms" target="_blank" className="font-semibold text-brand-700 hover:underline">
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link href="/privacy" target="_blank" className="font-semibold text-brand-700 hover:underline">
              Privacy Policy
            </Link>
            .
          </span>
        </label>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-600">
            {error}
          </div>
        )}

        <button type="submit" disabled={loading || !agreed} className="btn-primary w-full">
          {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : null}
          Sign up
        </button>
      </form>
    </AuthShell>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={null}>
      <RegisterInner />
    </Suspense>
  );
}
