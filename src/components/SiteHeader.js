"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { FileText, LayoutDashboard, LogOut, Shield } from "lucide-react";

function isAdmin(role) {
  return role === "ADMIN" || role === "OWNER";
}

export default function SiteHeader() {
  const { data: session, status } = useSession();
  const user = session?.user;

  return (
    <header className="sticky top-0 z-30 border-b border-slate-100 bg-white/80 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3.5">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-white shadow-soft">
            <FileText className="h-5 w-5" />
          </span>
          <span className="font-display text-xl font-extrabold text-ink">CV Maker</span>
        </Link>

        <nav className="flex items-center gap-1.5 sm:gap-2">
          {status === "loading" ? null : user ? (
            <>
              {isAdmin(user.role) && (
                <Link href="/admin" className="btn-ghost text-sm">
                  <Shield className="h-4 w-4" /> <span className="hidden sm:inline">Admin</span>
                </Link>
              )}
              <Link href="/dashboard" className="btn-ghost text-sm">
                <LayoutDashboard className="h-4 w-4" />
                <span className="hidden sm:inline">Dashboard</span>
              </Link>
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="btn-ghost text-sm"
              >
                <LogOut className="h-4 w-4" /> <span className="hidden sm:inline">Sign out</span>
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="btn-ghost text-sm">
                Sign in
              </Link>
              <Link href="/register" className="btn-primary !px-5 !py-2.5 text-sm">
                Get started
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
