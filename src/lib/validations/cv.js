// ============================================================================
// CV data validation — the single gate between untrusted input and the rest of
// the app.
//
// Design note: this schema **normalises** rather than rejects. A CV is a user's
// own work-in-progress, so refusing to save it because one field is the wrong
// shape would be hostile. Instead every field is coerced into a guaranteed
// type — text becomes a capped string, lists become arrays of the right shape —
// so that `buildCvHtml`, the PDF renderer, and the live preview can all trust
// what they receive and never crash on `.trim()` / `.map()` of a non-value.
//
// Limits exist for storage safety, not to police content: overlong text is
// truncated and overlong lists are clipped, never rejected.
// ============================================================================

import { z } from "zod";
import {
  DEFAULT_SECTION_TITLES,
  SECTION_KEYS,
  SECTION_TITLE_PRESETS,
  CUSTOM_SECTION_PRESETS,
  cvLanguage,
  densityValue,
  customLayout,
} from "@/lib/cvSections";

// --- Limits -----------------------------------------------------------------

export const LIMITS = {
  shortText: 200, // names, titles, dates, single-line fields
  longText: 2000, // summary, free-text details
  bullet: 500,
  bullets: 20,
  items: 30, // experiences / education / certifications / custom items
  skills: 60,
  languages: 20,
  customSections: 10,
  sectionTitle: 80,
  freeText: 4000, // a whole free-text section
};

// --- Primitives -------------------------------------------------------------

// Coerces anything into a trimmed, length-capped string.
//   - null / undefined / objects / arrays -> ""  (never "[object Object]")
//   - numbers / booleans                  -> their string form
const text = (max = LIMITS.shortText) =>
  z.any().transform((v) => {
    if (typeof v === "string") return v.trim().slice(0, max);
    if (typeof v === "number" && Number.isFinite(v)) return String(v).slice(0, max);
    if (typeof v === "boolean") return String(v);
    return "";
  });

const bool = z.any().transform((v) => v === true || v === "true");

// Coerces anything into an array of `schema`, capped at `max` entries.
// Non-arrays become []. Entries that fail the inner schema are dropped rather
// than failing the whole CV.
const list = (schema, max) =>
  z.any().transform((v) => {
    if (!Array.isArray(v)) return [];
    const out = [];
    for (const entry of v.slice(0, max)) {
      const parsed = schema.safeParse(entry);
      if (parsed.success) out.push(parsed.data);
    }
    return out;
  });

// A list of plain strings (skills, bullet points) with empties dropped.
const textList = (max, maxLen) =>
  z.any().transform((v) => {
    if (!Array.isArray(v)) return [];
    return v
      .slice(0, max)
      .map((entry) => text(maxLen).parse(entry))
      .filter(Boolean);
  });

// --- Section titles ---------------------------------------------------------
// Users may rename any built-in section heading. Anything blank falls back to
// the standard label at render time. The vocabulary itself lives in
// `cvSections.js` so the renderer and builder can use it without importing zod;
// re-exported here so callers already importing this module keep working.

export {
  DEFAULT_SECTION_TITLES,
  SECTION_KEYS,
  SECTION_TITLE_PRESETS,
  CUSTOM_SECTION_PRESETS,
};

// Presentation settings for the CV itself: the language it is written in and
// how tightly it is set. Independent of the site's interface language.
const settingsSchema = z.any().transform((v) => {
  const src = v && typeof v === "object" && !Array.isArray(v) ? v : {};
  return {
    language: cvLanguage(src.language),
    density: densityValue(src.density),
  };
});

const sectionTitlesSchema = z.any().transform((v) => {
  const src = v && typeof v === "object" && !Array.isArray(v) ? v : {};
  const out = {};
  for (const key of SECTION_KEYS) {
    out[key] = text(LIMITS.sectionTitle).parse(src[key]);
  }
  return out;
});

// --- Entry shapes -----------------------------------------------------------

const personalSchema = z.any().transform((v) => {
  const src = v && typeof v === "object" && !Array.isArray(v) ? v : {};
  return {
    fullName: text().parse(src.fullName),
    jobTitle: text().parse(src.jobTitle),
    email: text().parse(src.email),
    phone: text().parse(src.phone),
    location: text().parse(src.location),
    linkedin: text().parse(src.linkedin),
    website: text().parse(src.website),
  };
});

const experienceSchema = z.object({
  jobTitle: text(),
  company: text(),
  location: text(),
  startDate: text(),
  endDate: text(),
  current: bool,
  bullets: textList(LIMITS.bullets, LIMITS.bullet),
});

const educationSchema = z.object({
  degree: text(),
  institution: text(),
  location: text(),
  startDate: text(),
  endDate: text(),
  details: text(LIMITS.longText),
});

const languageSchema = z.object({
  name: text(),
  level: text(),
});

const certificationSchema = z.object({
  name: text(),
  issuer: text(),
  date: text(),
});

// A custom section item. Deliberately generic so one shape covers projects,
// volunteering, publications, awards, and anything else a user invents.
const customItemSchema = z.object({
  title: text(),
  subtitle: text(),
  dateRange: text(),
  location: text(),
  descriptionBullets: textList(LIMITS.bullets, LIMITS.bullet),
});

const customSectionSchema = z.object({
  title: text(LIMITS.sectionTitle),
  // "entries" = the structured shape above; "freeText" = a single block of prose
  // for users who would rather write than fill in fields.
  layout: z.any().transform((v) => customLayout(v)),
  items: list(customItemSchema, LIMITS.items),
  text: text(LIMITS.freeText),
});

// --- The CV ------------------------------------------------------------------

export const cvDataSchema = z.any().transform((v) => {
  const src = v && typeof v === "object" && !Array.isArray(v) ? v : {};
  return {
    personal: personalSchema.parse(src.personal),
    settings: settingsSchema.parse(src.settings),
    sectionTitles: sectionTitlesSchema.parse(src.sectionTitles),
    summary: text(LIMITS.longText).parse(src.summary),
    experiences: list(experienceSchema, LIMITS.items).parse(src.experiences),
    education: list(educationSchema, LIMITS.items).parse(src.education),
    skills: textList(LIMITS.skills, LIMITS.shortText).parse(src.skills),
    languages: list(languageSchema, LIMITS.languages).parse(src.languages),
    certifications: list(certificationSchema, LIMITS.items).parse(src.certifications),
    customSections: list(customSectionSchema, LIMITS.customSections)
      .parse(src.customSections)
      // A custom section with no title is meaningless on a CV — drop it.
      .filter((s) => s.title),
  };
});

// Normalises any input into a guaranteed-safe CV object.
// Never throws: unusable input degrades to a well-formed empty CV.
export function parseCvData(input) {
  try {
    return cvDataSchema.parse(input);
  } catch {
    return cvDataSchema.parse({});
  }
}

// Guard for API routes. Returns { ok, data } or { ok:false, error }.
export function validateCvData(input) {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return { ok: false, error: "CV data is missing or malformed." };
  }
  return { ok: true, data: parseCvData(input) };
}

// Pulls the name / title out of validated CV data for the denormalised columns
// used by the dashboard and admin listings. Always returns strings or null.
export function extractCvMeta(cvData) {
  const p = (cvData && cvData.personal) || {};
  return {
    fullName: typeof p.fullName === "string" && p.fullName ? p.fullName.slice(0, 200) : null,
    jobTitle: typeof p.jobTitle === "string" && p.jobTitle ? p.jobTitle.slice(0, 200) : null,
  };
}
