// ============================================================================
// Section vocabulary — the standard headings a CV can carry, in both languages,
// and the presets offered when renaming or creating one.
//
// Plain constants with no dependencies, deliberately kept out of
// `validations/cv.js`: the renderer and the builder UI both need these names,
// and neither should pull a validation library into the browser bundle to get
// them.
//
// The wording matters. These are the category names recruiters scan for and ATS
// parsers match against, so they stay conventional rather than clever — the
// Arabic headings are the ones used on CVs across the Levant and the Gulf.
// ============================================================================

// The built-in sections, and the heading each uses when not renamed.
export const DEFAULT_SECTION_TITLES = {
  en: {
    summary: "Professional Summary",
    experience: "Work Experience",
    education: "Education",
    skills: "Skills",
    languages: "Languages",
    certifications: "Certifications",
  },
  ar: {
    summary: "الملخص المهني",
    experience: "الخبرات العملية",
    education: "المؤهلات التعليمية",
    skills: "المهارات والتقنيات",
    languages: "اللغات",
    certifications: "الشهادات والدورات",
  },
};

export const SECTION_KEYS = Object.keys(DEFAULT_SECTION_TITLES.en);

// The language a CV is written in — independent of the site's interface
// language. Someone may well use the Arabic interface to write an English CV.
export const CV_LANGUAGES = ["en", "ar"];
export const DEFAULT_CV_LANGUAGE = "en";

export const CV_LANGUAGE_LABELS = {
  en: { en: "English", ar: "الإنجليزية" },
  ar: { en: "Arabic", ar: "العربية" },
};

export function cvLanguage(value) {
  return CV_LANGUAGES.includes(value) ? value : DEFAULT_CV_LANGUAGE;
}

export function isRtlCv(language) {
  return cvLanguage(language) === "ar";
}

// Default heading for a section in a given CV language.
export function defaultSectionTitle(sectionKey, language) {
  const table = DEFAULT_SECTION_TITLES[cvLanguage(language)] || DEFAULT_SECTION_TITLES.en;
  return table[sectionKey] || "";
}

// Word shown for "Present" on an open-ended date range.
export const PRESENT_LABEL = { en: "Present", ar: "حتى الآن" };

// --- Density -----------------------------------------------------------------
// One control that scales the whole document, so a non-technical user can make
// their content fit a page without touching individual sizes.

export const DENSITIES = ["compact", "standard", "spacious"];
export const DEFAULT_DENSITY = "standard";

// Chosen so that every template stays inside the 9–12pt body range recruiters
// and ATS parsers accept, at every density:
//   compact  × 0.90 — smallest base is 10pt (tech / modern) → 9.0pt
//   spacious × 1.09 — largest base is 11pt (executive / academic) → 11.99pt
// 1.1 would take Executive to 12.1pt and out of the band, which is why this is
// not the rounder number it looks like it should be. `tests/cvTemplates.test.js`
// asserts the bound across the full template × density matrix.
export const DENSITY_SCALE = {
  compact: 0.9,
  standard: 1,
  spacious: 1.09,
};

export function densityValue(value) {
  return DENSITIES.includes(value) ? value : DEFAULT_DENSITY;
}

export function densityScale(value) {
  return DENSITY_SCALE[densityValue(value)];
}

// --- Rename / create presets -------------------------------------------------

export const SECTION_TITLE_PRESETS = {
  en: {
    summary: ["Professional Summary", "Summary", "Objective", "Career Objective", "Profile"],
    experience: [
      "Work Experience",
      "Employment History",
      "Relevant Experience",
      "Professional Experience",
    ],
    education: ["Education", "Education & Qualifications", "Academic Background"],
    skills: ["Skills", "Technical & Soft Skills", "Core Competencies", "Technical Skills"],
    languages: ["Languages", "Languages & Proficiency"],
    certifications: [
      "Certifications",
      "Certifications & Licenses",
      "Professional Certifications",
    ],
  },
  ar: {
    summary: ["الملخص المهني", "نبذة مختصرة", "الهدف الوظيفي", "الملف الشخصي"],
    experience: ["الخبرات العملية", "السجل الوظيفي", "الخبرات ذات الصلة", "الخبرة المهنية"],
    education: ["المؤهلات التعليمية", "التعليم والمؤهلات", "الخلفية الأكاديمية"],
    skills: ["المهارات والتقنيات", "المهارات", "المهارات التقنية والشخصية", "الكفاءات الأساسية"],
    languages: ["اللغات", "اللغات ومستوى الإتقان"],
    certifications: ["الشهادات والدورات", "الشهادات والتراخيص", "الشهادات المهنية"],
  },
};

export const CUSTOM_SECTION_PRESETS = {
  en: [
    "Projects & Portfolios",
    "Volunteering & Leadership",
    "Publications",
    "Honors & Awards",
    "Courses & Training",
    "References",
  ],
  ar: [
    "المشاريع",
    "الأعمال التطوعية والقيادية",
    "المنشورات",
    "الجوائز والتكريمات",
    "الدورات التدريبية",
    "المراجع",
  ],
};

export function sectionTitlePresets(sectionKey, language) {
  const table = SECTION_TITLE_PRESETS[cvLanguage(language)] || SECTION_TITLE_PRESETS.en;
  return table[sectionKey] || [];
}

export function customSectionPresets(language) {
  return CUSTOM_SECTION_PRESETS[cvLanguage(language)] || CUSTOM_SECTION_PRESETS.en;
}

// --- Custom section layouts --------------------------------------------------
// "entries" is the structured shape shared with the built-in sections.
// "freeText" exists for people who would rather just write a paragraph than
// fill in a form — a common request from non-technical users.
export const CUSTOM_LAYOUTS = ["entries", "freeText"];
export const DEFAULT_CUSTOM_LAYOUT = "entries";

export function customLayout(value) {
  return CUSTOM_LAYOUTS.includes(value) ? value : DEFAULT_CUSTOM_LAYOUT;
}
