"use client";

import { Languages } from "lucide-react";
import { useLocale } from "./LocaleProvider";
import { LOCALES, LOCALE_LABELS } from "@/lib/i18n/config";

// Two-locale toggle. A segmented control rather than a dropdown: with exactly
// two options a menu costs an extra click and hides the alternative.
//
// Each label is written in its own language ("English" / "العربية") so a reader
// who cannot read the current interface can still find their way out of it.
export default function LanguageSwitcher({ className = "" }) {
  const { locale, setLocale } = useLocale();

  return (
    <div
      className={`inline-flex items-center gap-0.5 rounded-xl border border-slate-200 bg-white p-0.5 ${className}`}
      role="group"
      aria-label="Language / اللغة"
    >
      <Languages className="mx-1.5 h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
      {LOCALES.map((code) => {
        const active = code === locale;
        return (
          <button
            key={code}
            type="button"
            onClick={() => setLocale(code)}
            aria-pressed={active}
            lang={code}
            className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
              active
                ? "bg-brand-600 text-white"
                : "text-slate-500 hover:bg-brand-50 hover:text-brand-700"
            }`}
          >
            {LOCALE_LABELS[code]}
          </button>
        );
      })}
    </div>
  );
}
