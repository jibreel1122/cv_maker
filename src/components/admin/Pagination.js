"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useT } from "@/components/i18n/LocaleProvider";

// Shared pager for the admin tables. Shows the range as well as the page number
// because "showing 26–50 of 312" answers the question an operator actually has
// — how much is left — which a bare page number does not.
export default function Pagination({ page, totalPages, total, pageSize, onChange }) {
  const t = useT();
  if (!total) return null;

  const from = (page - 1) * pageSize + 1;
  const to = Math.min(total, page * pageSize);

  return (
    <div className="mt-4 flex flex-col items-center justify-between gap-3 sm:flex-row">
      <p className="text-xs text-slate-500">{t("admin.showing", { from, to, total })}</p>

      {totalPages > 1 && (
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onChange(page - 1)}
            disabled={page <= 1}
            className="btn-ghost !py-1.5 text-sm disabled:opacity-40"
          >
            {/* Chevrons are directional, so they mirror with the writing mode. */}
            <ChevronLeft className="h-4 w-4 rtl:-scale-x-100" />
            <span className="hidden sm:inline">{t("admin.prev")}</span>
          </button>

          <span className="text-xs font-semibold text-slate-600">
            {t("admin.pageOf", { page, total: totalPages })}
          </span>

          <button
            type="button"
            onClick={() => onChange(page + 1)}
            disabled={page >= totalPages}
            className="btn-ghost !py-1.5 text-sm disabled:opacity-40"
          >
            <span className="hidden sm:inline">{t("admin.nextPage")}</span>
            <ChevronRight className="h-4 w-4 rtl:-scale-x-100" />
          </button>
        </div>
      )}
    </div>
  );
}
