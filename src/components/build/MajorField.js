"use client";

import { useMemo, useState } from "react";
import { GraduationCap, Search, X } from "lucide-react";
import { majorGroups, majorCount } from "@/lib/cvMajors";
import { useT } from "@/components/i18n/LocaleProvider";
import { AutoTextArea } from "./fields";

// A field for a major / field of study.
//
// It is a plain multi-line text box first and a picker second: the catalogue is
// there to save typing, never to constrain. Whatever is picked lands in the box
// as ordinary text the user can then edit, extend ("…, minor in Mathematics"),
// or break onto a second line.
//
// The catalogue follows the CV's own language, not the interface language —
// someone writing an English CV from the Arabic interface should be offered
// English majors.
export default function MajorField({ label, value, onChange, placeholder, cvLanguage }) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const groups = useMemo(() => majorGroups(cvLanguage), [cvLanguage]);

  const results = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return groups;
    return groups
      .map((group) => ({
        ...group,
        majors: group.majors.filter((major) => major.toLowerCase().includes(needle)),
      }))
      .filter((group) => group.majors.length > 0);
  }, [groups, query]);

  function pick(major) {
    onChange(major);
    setOpen(false);
    setQuery("");
  }

  return (
    // `relative` so the picker can overlay the form rather than pushing every
    // field below it down the page while it is open.
    <div className="relative block">
      <span className="field-label flex flex-wrap items-center justify-between gap-2">
        {label}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] font-semibold normal-case text-brand-700 transition hover:border-brand-300"
          aria-expanded={open}
        >
          <GraduationCap className="h-3.5 w-3.5" />
          {t("builder.majors.browse", { n: majorCount() })}
        </button>
      </span>

      <AutoTextArea value={value} onChange={onChange} placeholder={placeholder} />
      <span className="mt-1 block text-xs text-slate-400">{t("builder.majors.editHint")}</span>

      {open && (
        <div className="absolute inset-x-0 z-20 mt-2 rounded-xl border border-brand-200 bg-white p-3 shadow-xl">
          <div className="mb-2 flex items-center gap-2">
            <span className="relative flex-1">
              <Search className="pointer-events-none absolute start-2 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                autoFocus
                className="field-input !ps-8"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t("builder.majors.searchPlaceholder")}
              />
            </span>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-slate-400 transition hover:text-slate-600"
              aria-label={t("common.close")}
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="max-h-64 overflow-y-auto pe-1">
            {results.length === 0 && (
              <p className="py-4 text-center text-xs text-slate-500">
                {t("builder.majors.noMatch")}
              </p>
            )}
            {results.map((group) => (
              <div key={group.id} className="mb-3 last:mb-0">
                <p className="mb-1 text-[11px] font-bold uppercase tracking-wide text-slate-400">
                  {group.label}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {group.majors.map((major) => (
                    <button
                      key={major}
                      type="button"
                      onClick={() => pick(major)}
                      className="rounded-full border border-slate-200 px-2.5 py-1 text-xs text-slate-600 transition hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700"
                    >
                      {major}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
