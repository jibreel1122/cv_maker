// ============================================================================
// Static template metadata — names, fonts, accents, section order, and the
// legacy-id mapping.
//
// Kept separate from `cvTemplates.js` (which renders HTML and therefore pulls in
// the validation schema and zod) so that lightweight consumers — the dashboard
// card, the admin table — can label a template without dragging a validation
// library into their bundle.
// ============================================================================

// --- Page geometry -----------------------------------------------------------
// Total whitespace from the paper edge to the text. Kept inside the 0.5–1in band
// recruiters and ATS parsers expect.
export const PAGE_MARGIN_IN = 0.75;
// The slice of that margin Puppeteer applies itself via its `margin` option. The
// stylesheet supplies only the remainder when rendering for print, so printed
// geometry matches the on-screen preview exactly.
export const PRINT_MARGIN_IN = 0.4;

// --- Fonts -------------------------------------------------------------------
// Standard, universally-installed stacks only, so the preview and the PDF render
// identically and offline. No decorative or web-loaded faces — ATS parsers and
// conservative recruiters both expect these.
const ARIAL = "Arial, Helvetica, 'Helvetica Neue', sans-serif";
const CALIBRI = "Calibri, 'Segoe UI', Helvetica, Arial, sans-serif";
const GEORGIA = "Georgia, 'Times New Roman', Times, serif";
const GARAMOND = "Garamond, 'EB Garamond', Georgia, 'Times New Roman', serif";

// --- Templates ---------------------------------------------------------------
// Five ATS-proven layouts. `order` controls section sequence, so a technical CV
// leads with skills while an academic one leads with education — which is what
// recruiters in those fields actually expect. The literal "custom" entry marks
// where user-defined sections are injected.

export const TEMPLATES = [
  {
    id: "classic-corporate",
    name: "Classic Corporate",
    desc: "Traditional single column with centered header — the safest, most widely accepted format.",
    font: ARIAL,
    accent: "#1f2937",
    order: ["summary", "experience", "education", "skills", "languages", "certifications", "custom"],
  },
  {
    id: "modern-professional",
    name: "Modern Professional",
    desc: "Two-column header with subtle rule accents and a denser body — more content per page.",
    font: CALIBRI,
    accent: "#0f766e",
    order: ["summary", "experience", "education", "skills", "languages", "certifications", "custom"],
  },
  {
    id: "tech-minimalist",
    name: "Tech / Minimalist",
    desc: "Compact spacing with skills and projects promoted to the top — built for engineering and IT.",
    font: ARIAL,
    accent: "#1d4ed8",
    order: ["summary", "skills", "experience", "custom", "education", "certifications", "languages"],
  },
  {
    id: "executive",
    name: "Executive",
    desc: "Elegant serif typography with an emphasised summary — suited to senior and leadership roles.",
    font: GEORGIA,
    accent: "#111827",
    order: ["summary", "experience", "education", "skills", "certifications", "languages", "custom"],
  },
  {
    id: "academic",
    name: "Academic / Harvard",
    desc: "Strict, text-heavy Garamond layout leading with education — for research and academic profiles.",
    font: GARAMOND,
    accent: "#111827",
    order: ["summary", "education", "experience", "custom", "certifications", "skills", "languages"],
  },
];

// Template ids used by earlier versions of the app. CVs saved under these must
// keep rendering, so each maps onto its closest surviving equivalent.
const LEGACY_TEMPLATE_IDS = {
  classic: "classic-corporate",
  corporate: "classic-corporate",
  modern: "modern-professional",
  professional: "modern-professional",
  minimal: "tech-minimalist",
  compact: "tech-minimalist",
  technical: "tech-minimalist",
  elegant: "executive",
  harvard: "academic",
};

export const DEFAULT_TEMPLATE_ID = "classic-corporate";

// Maps any stored or submitted template id onto a live one.
// Returns null when the id is unrecognised, so callers choose their own fallback.
export function resolveTemplateId(templateId) {
  if (typeof templateId !== "string") return null;
  if (TEMPLATES.some((t) => t.id === templateId)) return templateId;
  return LEGACY_TEMPLATE_IDS[templateId] || null;
}

export function getTemplate(templateId) {
  const id = resolveTemplateId(templateId) || DEFAULT_TEMPLATE_ID;
  return TEMPLATES.find((t) => t.id === id) || TEMPLATES[0];
}

// Display name for any stored id, including legacy ones, so neither the
// dashboard nor the admin table ever shows a raw slug.
export function templateName(templateId) {
  return getTemplate(templateId).name;
}
