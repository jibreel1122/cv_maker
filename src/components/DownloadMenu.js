"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, Download, FileText, FileType2, FileCode2 } from "lucide-react";
import { useT } from "@/components/i18n/LocaleProvider";

// The three formats a saved CV can be downloaded in. All three are generated
// from the same document model, so they carry identical content and typography
// — see `src/lib/cvDocModel.js`.
export const DOWNLOAD_FORMATS = [
  { id: "pdf", path: "pdf", icon: FileText, labelKey: "download.pdf", hintKey: "download.pdfHint" },
  { id: "docx", path: "docx", icon: FileType2, labelKey: "download.word", hintKey: "download.wordHint" },
  { id: "latex", path: "latex", icon: FileCode2, labelKey: "download.latex", hintKey: "download.latexHint" },
];

export default function DownloadMenu({ cvId, className = "", align = "end", compact = false }) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const boxRef = useRef(null);

  // Close on an outside click or Escape, the way a menu is expected to behave.
  useEffect(() => {
    if (!open) return;
    const onDown = (e) => {
      if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={boxRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
        className={
          compact
            ? "btn-ghost w-full justify-center text-sm text-brand-700"
            : "btn-primary w-full justify-center text-sm"
        }
      >
        <Download className="h-4 w-4" /> {t("download.button")}
        <ChevronDown className="h-3.5 w-3.5" />
      </button>

      {open && (
        <div
          role="menu"
          className={`absolute z-30 mt-2 w-60 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl ${
            align === "start" ? "start-0" : "end-0"
          }`}
        >
          {DOWNLOAD_FORMATS.map((format) => (
            <a
              key={format.id}
              role="menuitem"
              href={`/api/cv/${cvId}/${format.path}`}
              onClick={() => setOpen(false)}
              className="flex items-start gap-2.5 px-3 py-2.5 text-start transition hover:bg-brand-50"
            >
              <format.icon className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />
              <span className="min-w-0">
                <span className="block text-sm font-semibold text-ink">{t(format.labelKey)}</span>
                <span className="block text-xs text-slate-500">{t(format.hintKey)}</span>
              </span>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
