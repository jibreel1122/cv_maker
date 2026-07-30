"use client";

import { useId } from "react";
import { defaultSectionTitle, sectionTitlePresets } from "@/lib/cvSections";
import { useT } from "@/components/i18n/LocaleProvider";

// Lets the user rename any built-in section heading — "Work Experience" becomes
// "Relevant Experience", "الخبرات العملية" becomes "الخبرة المهنية", and so on.
//
// The presets are the headings ATS parsers and recruiters recognise, offered
// through a datalist so they are one keystroke away without being enforced.
// They follow the CV's own language, not the interface language: someone using
// the Arabic interface to write an English CV should be offered English ones.
// Leaving the field blank keeps the standard label.
export default function SectionTitleField({ sectionKey, value, onChange, cvLanguage }) {
  const t = useT();
  const listId = useId();
  const fallback = defaultSectionTitle(sectionKey, cvLanguage);
  const presets = sectionTitlePresets(sectionKey, cvLanguage);

  return (
    <div className="mb-5 rounded-xl border border-slate-100 bg-slate-50/70 p-3">
      <label className="block">
        <span className="field-label !mb-1 flex flex-wrap items-center gap-2">
          {t("builder.headingLabel")}
          <span className="font-normal normal-case text-slate-400">
            {t("builder.headingHint")}
          </span>
        </span>
        <input
          className="field-input !bg-white"
          value={value || ""}
          list={presets.length ? listId : undefined}
          placeholder={fallback}
          onChange={(e) => onChange(e.target.value)}
        />
      </label>
      {presets.length > 0 && (
        <datalist id={listId}>
          {presets.map((p) => (
            <option key={p} value={p} />
          ))}
        </datalist>
      )}
      <p className="mt-1.5 text-xs text-slate-400">
        {t("builder.headingBlank", { fallback })}
      </p>
    </div>
  );
}
