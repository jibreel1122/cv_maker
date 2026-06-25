"use client";

// Route-level error boundary. Replaces Next.js's blank default error page with
// a friendly, branded screen and a "Try again" action, so an unexpected error
// (e.g. a transient database hiccup) never dumps the user on an empty page.

import Link from "next/link";
import { useEffect } from "react";
import { AlertTriangle, RotateCcw, Home } from "lucide-react";

export default function Error({ error, reset }) {
  useEffect(() => {
    // Surface the error in the console for debugging.
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-canvas px-6 text-center">
      <div className="animate-scale-in w-full max-w-md rounded-2xl border border-slate-100 bg-white p-8 shadow-card">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-500">
          <AlertTriangle className="h-7 w-7" />
        </span>
        <h1 className="mt-5 font-display text-2xl font-extrabold text-ink">
          Something went wrong
        </h1>
        <p className="mt-2 text-slate-600">
          An unexpected error occurred. You can try again — your data is safe.
        </p>
        {error?.digest && (
          <p className="mt-2 text-xs text-slate-400">Reference: {error.digest}</p>
        )}
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <button onClick={() => reset()} className="btn-primary text-sm">
            <RotateCcw className="h-4 w-4" /> Try again
          </button>
          <Link href="/dashboard" className="btn-outline text-sm">
            <Home className="h-4 w-4" /> Back to dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
