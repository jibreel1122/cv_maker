"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, CheckCircle2, AlertTriangle, Mail } from "lucide-react";
import AuthShell from "@/components/auth/AuthShell";

function VerifyInner() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get("token");

  const [state, setState] = useState("loading"); // loading | verified | expired | invalid
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    if (!token) {
      setState("invalid");
      return;
    }
    (async () => {
      try {
        const res = await fetch("/api/auth/verify-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });
        const json = await res.json();
        if (json.status === "verified") {
          setState("verified");
          setTimeout(() => router.replace("/login"), 2200);
        } else if (json.status === "expired") {
          setState("expired");
        } else {
          setState("invalid");
        }
      } catch {
        setState("invalid");
      }
    })();
  }, [token, router]);

  async function handleResend() {
    setResending(true);
    try {
      await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      setResent(true);
    } finally {
      setResending(false);
    }
  }

  return (
    <AuthShell title="Email verification">
      {state === "loading" && (
        <div className="flex flex-col items-center py-6 text-center">
          <Loader2 className="h-10 w-10 animate-spin text-brand-600" />
          <p className="mt-4 text-slate-600">Verifying your email…</p>
        </div>
      )}

      {state === "verified" && (
        <div className="flex flex-col items-center py-6 text-center">
          <CheckCircle2 className="h-12 w-12 text-brand-600" />
          <h2 className="mt-4 font-display text-lg font-bold text-ink">Email verified!</h2>
          <p className="mt-1 text-slate-600">Redirecting to login…</p>
          <Link href="/login" className="btn-primary mt-6 text-sm">
            Go to login now
          </Link>
        </div>
      )}

      {state === "expired" && (
        <div className="flex flex-col items-center py-6 text-center">
          <AlertTriangle className="h-12 w-12 text-amber-500" />
          <h2 className="mt-4 font-display text-lg font-bold text-ink">Token expired</h2>
          <p className="mt-1 text-slate-600">
            This verification link is no longer valid. Request a new one below.
          </p>
          {resent ? (
            <p className="mt-5 rounded-xl border border-brand-200 bg-brand-50 px-4 py-3 text-sm text-brand-700">
              <Mail className="mr-1 inline h-4 w-4" /> A new verification email has been sent.
            </p>
          ) : (
            <button onClick={handleResend} disabled={resending} className="btn-primary mt-6 text-sm">
              {resending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
              Resend verification email
            </button>
          )}
        </div>
      )}

      {state === "invalid" && (
        <div className="flex flex-col items-center py-6 text-center">
          <AlertTriangle className="h-12 w-12 text-red-500" />
          <h2 className="mt-4 font-display text-lg font-bold text-ink">Invalid link</h2>
          <p className="mt-1 text-slate-600">
            This verification link is not valid. Try registering again or signing in.
          </p>
          <Link href="/login" className="btn-outline mt-6 text-sm">
            Back to login
          </Link>
        </div>
      )}
    </AuthShell>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={null}>
      <VerifyInner />
    </Suspense>
  );
}
