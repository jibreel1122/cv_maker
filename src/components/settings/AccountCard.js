"use client";

import { useT } from "@/components/i18n/LocaleProvider";

export default function AccountCard({ name, email, role }) {
  const t = useT();
  return (
    <div className="card">
      <h2 className="font-display text-lg font-bold text-ink">{t("settings.account")}</h2>
      <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-slate-500">{t("settings.name")}</dt>
          <dd className="font-medium text-ink">{name || "—"}</dd>
        </div>
        <div>
          <dt className="text-slate-500">{t("common.email")}</dt>
          <dd className="font-medium text-ink">{email}</dd>
        </div>
        <div>
          <dt className="text-slate-500">{t("settings.role")}</dt>
          <dd className="font-medium text-ink">{role}</dd>
        </div>
      </dl>
    </div>
  );
}
