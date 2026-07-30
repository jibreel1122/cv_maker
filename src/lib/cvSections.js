// ============================================================================
// Section vocabulary — the standard headings a CV can carry, and the presets
// offered when renaming or creating one.
//
// Plain constants with no dependencies, deliberately kept out of
// `validations/cv.js`: the renderer and the builder UI both need these names,
// and neither should pull a validation library into the browser bundle to get
// them.
//
// The wording matters. These are the category names recruiters scan for and ATS
// parsers match against, so they should stay conventional rather than clever.
// ============================================================================

// The built-in sections, and the heading each one uses when the user has not
// renamed it.
export const DEFAULT_SECTION_TITLES = {
  summary: "Professional Summary",
  experience: "Work Experience",
  education: "Education",
  skills: "Skills",
  languages: "Languages",
  certifications: "Certifications",
};

export const SECTION_KEYS = Object.keys(DEFAULT_SECTION_TITLES);

// Alternative headings offered per section when renaming.
export const SECTION_TITLE_PRESETS = {
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
};

// Headings offered when creating a brand-new custom section.
export const CUSTOM_SECTION_PRESETS = [
  "Projects & Portfolios",
  "Volunteering & Leadership",
  "Publications",
  "Honors & Awards",
  "Courses & Training",
  "References",
];
