"use client";

import { useId } from "react";
import { DEFAULT_SECTION_TITLES, SECTION_TITLE_PRESETS } from "@/lib/cvSections";

// Lets the user rename any built-in section heading — "Work Experience" becomes
// "Relevant Experience", "Professional Summary" becomes "Career Objective", and
// so on.
//
// The presets are the headings ATS parsers and recruiters recognise, offered
// through a datalist so they are one keystroke away without being enforced.
// Leaving the field blank keeps the standard label.
export default function SectionTitleField({ sectionKey, value, onChange }) {
  const listId = useId();
  const fallback = DEFAULT_SECTION_TITLES[sectionKey] || "";
  const presets = SECTION_TITLE_PRESETS[sectionKey] || [];

  return (
    <div className="mb-5 rounded-xl border border-slate-100 bg-slate-50/70 p-3">
      <label className="block">
        <span className="field-label !mb-1 flex items-center gap-2">
          Heading on your CV
          <span className="font-normal normal-case text-slate-400">
            — optional, rename it to suit the role
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
        Leave blank to use “{fallback}”.
      </p>
    </div>
  );
}
