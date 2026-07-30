"use client";

import { Languages, Rows3 } from "lucide-react";
import {
  CV_LANGUAGES,
  CV_LANGUAGE_LABELS,
  DENSITIES,
  cvLanguage,
  densityValue,
} from "@/lib/cvSections";
import { useLocale } from "@/components/i18n/LocaleProvider";

// Presentation controls for the CV itself: what language it is written in, and
// how tightly it is set.
//
// The density dial is the "smart fitting" control. Rather than exposing a font
// size in points — which means nothing to someone who has never laid out a
// document — it offers three named steps and says what each one is for. One
// click shrinks or expands the entire CV, which is how a non-technical user
// makes their content land on the number of pages they want.

function OptionCard({ active, onClick, title, hint, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`rounded-xl border p-3 text-start transition ${
        active
          ? "border-brand-500 bg-brand-50 ring-2 ring-brand-500/20"
          : "border-slate-200 bg-white hover:border-brand-300"
      }`}
    >
      <span className="block text-sm font-bold text-ink">{children ?? title}</span>
      {hint && <span className="mt-0.5 block text-xs text-slate-500">{hint}</span>}
    </button>
  );
}

export default function CvSettingsPanel({ settings, onChange, pageCount }) {
  const { t, locale } = useLocale();
  const language = cvLanguage(settings?.language);
  const density = densityValue(settings?.density);

  const densityCopy = {
    compact: {
      title: t("builder.templateStep.densityCompact"),
      hint: t("builder.templateStep.densityCompactHint"),
    },
    standard: {
      title: t("builder.templateStep.densityStandard"),
      hint: t("builder.templateStep.densityStandardHint"),
    },
    spacious: {
      title: t("builder.templateStep.densitySpacious"),
      hint: t("builder.templateStep.densitySpaciousHint"),
    },
  };

  return (
    <div className="space-y-6">
      {/* CV language */}
      <div>
        <span className="field-label flex items-center gap-2">
          <Languages className="h-4 w-4 text-brand-600" />
          {t("builder.templateStep.cvLanguage")}
        </span>
        <div className="grid gap-3 sm:grid-cols-2">
          {CV_LANGUAGES.map((code) => (
            <OptionCard
              key={code}
              active={language === code}
              onClick={() => onChange({ ...settings, language: code })}
            >
              <span lang={code}>{CV_LANGUAGE_LABELS[code][locale]}</span>
            </OptionCard>
          ))}
        </div>
        <p className="mt-1.5 text-xs text-slate-500">
          {t("builder.templateStep.cvLanguageHint")}
        </p>
      </div>

      {/* Density */}
      <div>
        <span className="field-label flex items-center gap-2">
          <Rows3 className="h-4 w-4 text-brand-600" />
          {t("builder.templateStep.density")}
        </span>
        <div className="grid gap-3 sm:grid-cols-3">
          {DENSITIES.map((d) => (
            <OptionCard
              key={d}
              active={density === d}
              onClick={() => onChange({ ...settings, density: d })}
              title={densityCopy[d].title}
              hint={densityCopy[d].hint}
            />
          ))}
        </div>
        <p className="mt-1.5 text-xs text-slate-500">
          {t("builder.templateStep.densityHint")}
        </p>
        {pageCount > 0 && (
          <p className="mt-2 inline-flex rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
            {t("builder.templateStep.pageCount", { n: pageCount })}
          </p>
        )}
      </div>
    </div>
  );
}
