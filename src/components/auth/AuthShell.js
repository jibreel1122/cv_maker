"use client";

import Link from "next/link";
import { FileText } from "lucide-react";

export default function AuthShell({ title, subtitle, children, footer }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-canvas px-6 py-10">
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-32 left-1/2 h-80 w-80 -translate-x-1/2 rounded-full bg-brand-200/40 blur-3xl" />
      </div>
      <div className="w-full max-w-md">
        <Link href="/" className="mb-6 flex items-center justify-center gap-2">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-600 text-white shadow-soft">
            <FileText className="h-5 w-5" />
          </span>
          <span className="font-display text-2xl font-extrabold text-ink">CV Maker</span>
        </Link>

        <div className="card">
          <h1 className="font-display text-2xl font-bold text-ink">{title}</h1>
          {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
          <div className="mt-6">{children}</div>
        </div>

        {footer && <div className="mt-5 text-center text-sm text-slate-600">{footer}</div>}

        <div className="mt-6 flex items-center justify-center gap-4 text-xs text-slate-400">
          <Link href="/privacy" className="hover:text-brand-700">
            Privacy Policy
          </Link>
          <span className="h-3 w-px bg-slate-200" />
          <Link href="/terms" className="hover:text-brand-700">
            Terms of Service
          </Link>
        </div>
      </div>
    </main>
  );
}
