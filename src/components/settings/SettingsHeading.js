"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useT } from "@/components/i18n/LocaleProvider";

export default function SettingsHeading() {
  const t = useT();
  return (
    <>
      <Link href="/dashboard" className="btn-ghost mb-4 text-sm">
        {/* The arrow is a direction, so it must mirror in RTL. */}
        <ArrowLeft className="h-4 w-4 rtl:-scale-x-100" /> {t("common.backToDashboard")}
      </Link>
      <h1 className="font-display text-3xl font-extrabold text-ink">{t("settings.title")}</h1>
    </>
  );
}
