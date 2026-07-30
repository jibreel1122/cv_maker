"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { FileText, LayoutDashboard, LogOut, Shield } from "lucide-react";
import { useT } from "@/components/i18n/LocaleProvider";
import LanguageSwitcher from "@/components/i18n/LanguageSwitcher";
import { BRAND_NAME } from "@/lib/brand";

function isAdmin(role) {
  return role === "ADMIN" || role === "OWNER";
}

export default function SiteHeader() {
  const t = useT();
  const { data: session, status } = useSession();
  const user = session?.user;

  return (
    <header className="sticky top-0 z-30 border-b border-slate-100 bg-white/80 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-6 py-3.5">
        <Link href="/" className="flex shrink-0 items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-white shadow-soft">
            <FileText className="h-5 w-5" />
          </span>
          <span className="font-display text-lg font-extrabold text-ink sm:text-xl">
            {BRAND_NAME}
          </span>
        </Link>

        <nav className="flex items-center gap-1.5 sm:gap-2">
          <LanguageSwitcher className="hidden sm:inline-flex" />
          {status === "loading" ? null : user ? (
            <>
              {isAdmin(user.role) && (
                <Link href="/admin" className="btn-ghost text-sm">
                  <Shield className="h-4 w-4" />{" "}
                  <span className="hidden sm:inline">{t("common.admin")}</span>
                </Link>
              )}
              <Link href="/dashboard" className="btn-ghost text-sm">
                <LayoutDashboard className="h-4 w-4" />
                <span className="hidden sm:inline">{t("common.dashboard")}</span>
              </Link>
              <button onClick={() => signOut({ callbackUrl: "/" })} className="btn-ghost text-sm">
                <LogOut className="h-4 w-4" />{" "}
                <span className="hidden sm:inline">{t("common.signOut")}</span>
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="btn-ghost text-sm">
                {t("common.signIn")}
              </Link>
              <Link href="/register" className="btn-primary !px-5 !py-2.5 text-sm">
                {t("common.getStarted")}
              </Link>
            </>
          )}
        </nav>
      </div>

      {/* On narrow screens the switcher moves to its own row rather than being
          squeezed out — a language toggle nobody can reach is not a toggle. */}
      <div className="border-t border-slate-100 px-6 py-2 sm:hidden">
        <LanguageSwitcher />
      </div>
    </header>
  );
}
