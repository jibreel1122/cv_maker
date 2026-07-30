"use client";

import Link from "next/link";
import { Settings } from "lucide-react";
import { useT } from "@/components/i18n/LocaleProvider";

// The greeting needs the translator, which is client-side, while the page itself
// stays a server component so the session is resolved on the server.
export default function DashboardHeader({ firstName }) {
  const t = useT();
  return (
    <div className="mb-8 flex items-start justify-between gap-4">
      <div>
        <h1 className="font-display text-3xl font-extrabold text-ink">
          {t("dashboard.greeting", { name: firstName })}
        </h1>
        <p className="mt-1 text-slate-600">{t("dashboard.subtitle")}</p>
      </div>
      <Link href="/settings" className="btn-ghost shrink-0 text-sm">
        <Settings className="h-4 w-4" />{" "}
        <span className="hidden sm:inline">{t("common.settings")}</span>
      </Link>
    </div>
  );
}
