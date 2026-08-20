// ============================================================================
// The document model: one normalised, format-neutral description of a CV.
//
// A CV is exported four ways — HTML (the live preview), PDF (that HTML through
// Chrome), Word, and LaTeX. Everything except the HTML lives outside the
// browser's layout engine, so the only way the four can stay identical is for
// all of them to be laid out from the same structure, in the same order, with
// the same headings and the same date strings.
//
// That structure is this module. It resolves the template's section order, the
// user's heading overrides, the CV language and the "Present" label exactly once
// and hands the renderers a plain object. The renderers decide only how to *draw*
// each block — never what a block contains.
//
// Everything here is total: any malformed field degrades to empty output rather
// than throwing, because the live preview runs on data that may predate the
// validation schema.
// ============================================================================

import {
  defaultSectionTitle,
  cvLanguage,
  isRtlCv,
  customLayout,
  PRESENT_LABEL,
} from "@/lib/cvSections";
import { getTemplate } from "@/lib/cvTemplateMeta";
import { typography, docFont } from "@/lib/cvTypography";

// --- Primitives (shared with the HTML renderer) ------------------------------

// Normalises any value to a trimmed string, with line endings unified so a
// value pasted from Windows breaks in the same place in all four formats.
// Never throws.
export function s(value) {
  if (typeof value === "string") return value.replace(/\r\n?/g, "\n").trim();
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return "";
}

// Normalises any value to an array. Never throws.
export function arr(value) {
  return Array.isArray(value) ? value : [];
}

export function fmtRange(start, end, current, language) {
  const from = s(start);
  const to = current ? PRESENT_LABEL[cvLanguage(language)] : s(end);
  if (!from && !to) return "";
  if (!from) return to;
  if (!to) return from;
  return `${from} — ${to}`;
}

export function cvLang(cvData) {
  return cvLanguage(cvData?.settings?.language);
}

// Resolves a section heading: the user's override if they set one, else the
// standard label in the CV's own language.
export function heading(cvData, key) {
  const custom = s(cvData?.sectionTitles?.[key]);
  return custom || defaultSectionTitle(key, cvData?.settings?.language) || "";
}

// --- Blocks ------------------------------------------------------------------

// A dated entry — the shape shared by experience, education, certifications and
// custom sections, so every block on the page aligns identically.
function entry({ title, date, subtitleParts, detail, bullets }) {
  const cleanBullets = arr(bullets).map(s).filter(Boolean);
  const built = {
    title: s(title),
    date: s(date),
    subtitle: arr(subtitleParts).map(s).filter(Boolean).join(" — "),
    detail: s(detail),
    bullets: cleanBullets,
  };
  const empty = !built.title && !built.subtitle && !built.detail && !cleanBullets.length;
  return empty ? null : built;
}

function entriesSection(key, title, entries) {
  const clean = entries.filter(Boolean);
  return clean.length ? { key, kind: "entries", title, entries: clean } : null;
}

function inlineSection(key, title, items) {
  const clean = arr(items).map(s).filter(Boolean);
  return clean.length ? { key, kind: "inline", title, items: clean } : null;
}

function textSection(key, title, text, variant) {
  const body = s(text);
  return body ? { key, kind: "text", title, text: body, variant } : null;
}

// --- Section builders --------------------------------------------------------

function summarySection(data) {
  return textSection("summary", heading(data, "summary"), data.summary, "summary");
}

function experienceSection(data) {
  return entriesSection(
    "experience",
    heading(data, "experience"),
    arr(data.experiences).map((e) =>
      entry({
        title: e?.jobTitle,
        date: fmtRange(e?.startDate, e?.endDate, e?.current, cvLang(data)),
        subtitleParts: [e?.company, e?.location],
        bullets: e?.bullets,
      })
    )
  );
}

function educationSection(data) {
  return entriesSection(
    "education",
    heading(data, "education"),
    arr(data.education).map((e) =>
      entry({
        title: e?.degree,
        date: fmtRange(e?.startDate, e?.endDate, false, cvLang(data)),
        subtitleParts: [e?.institution, e?.location],
        detail: e?.details,
      })
    )
  );
}

function skillsSection(data) {
  return inlineSection("skills", heading(data, "skills"), data.skills);
}

function languagesSection(data) {
  const items = arr(data.languages).map((l) => {
    const name = s(l?.name);
    if (!name) return "";
    const level = s(l?.level);
    return level ? `${name} — ${level}` : name;
  });
  return inlineSection("languages", heading(data, "languages"), items);
}

function certificationsSection(data) {
  return entriesSection(
    "certifications",
    heading(data, "certifications"),
    arr(data.certifications).map((c) =>
      entry({ title: c?.name, date: c?.date, subtitleParts: [c?.issuer] })
    )
  );
}

// User-defined sections, built with the same shapes as the built-ins so they are
// indistinguishable from a native section in every export format.
function customSections(data) {
  return arr(data.customSections)
    .map((sec, i) => {
      const title = s(sec?.title);
      if (!title) return null;
      const key = `custom-${i}`;

      if (customLayout(sec?.layout) === "freeText") {
        return textSection(key, title, sec?.text, "free");
      }

      return entriesSection(
        key,
        title,
        arr(sec?.items).map((it) =>
          entry({
            title: it?.title,
            date: it?.dateRange,
            subtitleParts: [it?.subtitle, it?.location],
            bullets: it?.descriptionBullets,
          })
        )
      );
    })
    .filter(Boolean);
}

const BUILDERS = {
  summary: (d) => [summarySection(d)],
  experience: (d) => [experienceSection(d)],
  education: (d) => [educationSection(d)],
  skills: (d) => [skillsSection(d)],
  languages: (d) => [languagesSection(d)],
  certifications: (d) => [certificationsSection(d)],
  custom: (d) => customSections(d),
};

// --- Entry point -------------------------------------------------------------

// Builds the format-neutral model for a CV. Never throws.
export function buildCvModel(cvData, templateId) {
  const data = cvData && typeof cvData === "object" ? cvData : {};
  const tpl = getTemplate(templateId);
  const language = cvLang(data);
  const rtl = isRtlCv(language);
  const p = data.personal || {};

  const sections = tpl.order
    .flatMap((key) => BUILDERS[key]?.(data) || [])
    .filter(Boolean);

  return {
    templateId: tpl.id,
    template: tpl,
    language,
    rtl,
    accent: tpl.accent,
    density: data?.settings?.density,
    typo: typography(tpl.id, { density: data?.settings?.density, rtl }),
    font: docFont(tpl.id, rtl),
    // What the file is called in a browser tab, a Word window, a PDF viewer.
    documentTitle: s(p.fullName) || "CV",
    header: {
      // The HTML renderer shows a placeholder rather than an empty header; the
      // other formats follow it so all four agree.
      name: s(p.fullName) || "Full Name",
      jobTitle: s(p.jobTitle),
      contacts: [p.email, p.phone, p.location, p.linkedin, p.website]
        .map(s)
        .filter(Boolean),
    },
    sections,
  };
}
