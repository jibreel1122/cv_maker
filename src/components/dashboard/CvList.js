"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  FileText,
  Plus,
  Download,
  Pencil,
  Trash2,
  Loader2,
} from "lucide-react";
import { templateName } from "@/lib/cvTemplateMeta";
import { useLocale } from "@/components/i18n/LocaleProvider";

export default function CvList() {
  const { t, locale } = useLocale();
  const [cvs, setCvs] = useState(null);
  const [loadError, setLoadError] = useState("");
  const [busyId, setBusyId] = useState(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/cv");
      if (!res.ok) throw new Error();
      const json = await res.json();
      setCvs(json.cvs || []);
      setLoadError("");
    } catch {
      // Without this an auth failure rendered the cheerful "no CVs yet" empty
      // state, telling users their work was gone when it was merely unfetched.
      setCvs([]);
      setLoadError(t("dashboard.loadFailed"));
    }
  }, [t]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleDelete(id) {
    if (!confirm(t("dashboard.confirmDelete"))) return;
    setBusyId(id);
    await fetch(`/api/cv/${id}`, { method: "DELETE" });
    setBusyId(null);
    load();
  }

  if (cvs === null) {
    return (
      <div className="flex items-center justify-center py-20 text-slate-400">
        <Loader2 className="h-7 w-7 animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h2 className="font-display text-xl font-bold text-ink">{t("dashboard.yourCvs")}</h2>
        <Link href="/build" className="btn-primary !py-2.5 text-sm">
          <Plus className="h-4 w-4" /> {t("dashboard.newCv")}
        </Link>
      </div>

      {loadError && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-600">
          {loadError}
        </div>
      )}

      {cvs.length === 0 && !loadError ? (
        <div className="card flex flex-col items-center py-16 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
            <FileText className="h-7 w-7" />
          </span>
          <h3 className="mt-4 font-display text-lg font-bold text-ink">{t("dashboard.noneTitle")}</h3>
          <p className="mt-1 max-w-sm text-sm text-slate-500">
            {t("dashboard.noneBody")}
          </p>
          <Link href="/build" className="btn-primary mt-6 text-sm">
            <Plus className="h-4 w-4" /> {t("dashboard.createFirst")}
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {cvs.map((cv, i) => (
            <div
              key={cv.id}
              className="card card-hover flex animate-fade-up flex-col"
              style={{ animationDelay: `${Math.min(i, 8) * 60}ms` }}
            >
              <div className="flex items-start justify-between gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                  <FileText className="h-5 w-5" />
                </span>
                <span className="chip bg-brand-50 text-brand-700">
                  {templateName(cv.templateId)}
                </span>
              </div>
              <h3 className="mt-4 truncate font-display text-lg font-bold text-ink">
                {cv.fullName || cv.title || t("dashboard.untitled")}
              </h3>
              <p className="truncate text-sm text-slate-500">{cv.jobTitle || "—"}</p>
              <p className="mt-1 text-xs text-slate-400">
                {t("dashboard.updated", {
                  date: new Date(cv.updatedAt).toLocaleDateString(locale, {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  }),
                })}
              </p>

              <div className="mt-5 flex items-center gap-2 border-t border-slate-100 pt-4">
                <Link
                  href={`/build?id=${cv.id}`}
                  className="btn-ghost flex-1 justify-center text-sm"
                >
                  <Pencil className="h-4 w-4" /> {t("dashboard.edit")}
                </Link>
                <a
                  href={`/api/cv/${cv.id}/pdf`}
                  className="btn-ghost flex-1 justify-center text-sm text-brand-700"
                >
                  <Download className="h-4 w-4" /> {t("dashboard.pdf")}
                </a>
                <button
                  onClick={() => handleDelete(cv.id)}
                  disabled={busyId === cv.id}
                  className="btn-ghost justify-center text-sm text-slate-400 hover:!text-red-600"
                  aria-label={t("dashboard.deleteCv")}
                >
                  {busyId === cv.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
