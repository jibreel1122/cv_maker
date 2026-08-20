// ============================================================================
// The effective type scale of every template, as one machine-readable table.
//
// `cvTemplates.js` renders the CV to HTML (which drives both the live preview
// and the PDF). The Word and LaTeX exports cannot reuse that stylesheet, so they
// read their sizes, weights and rules from here instead — which is what keeps
// the three formats visually identical.
//
// Every number below is the *effective* value the stylesheet ends up applying
// for that template (base rule plus its variant override), in points, before the
// density multiplier. `tests/cvTypography.test.js` parses the generated CSS and
// asserts each value still matches, so the table can never silently drift away
// from what the preview shows.
// ============================================================================

import { getTemplate, RTL_LINE_HEIGHT_BONUS } from "@/lib/cvTemplateMeta";
import { densityScale } from "@/lib/cvSections";

export const TYPOGRAPHY = {
  "classic-corporate": {
    body: 10.5,
    lineHeight: 1.45,
    name: 24,
    jobTitle: 12.5,
    jobTitleStyle: "semibold",
    sectionTitle: 12.5,
    itemTitle: 11,
    itemDate: 10,
    contact: 10,
    summary: 10.5,
    inlineList: 10,
    headerAlign: "center",
    headerRulePx: 1.5,
    headerRuleColor: "accent",
    sectionRulePx: 1,
    sectionRuleColor: "#d4d4d4",
    twoColumnHeader: false,
    stackedContact: false,
    itemSubItalic: false,
    itemDateItalic: false,
    // Vertical rhythm, in CSS pixels straight from the stylesheet.
    space: {
      headerPad: 10,
      contactTop: 6,
      jobTitleTop: 2,
      sectionGap: 15,
      sectionFirstGap: 13,
      sectionTitlePad: 3,
      sectionTitleGap: 3,
      itemGap: 9,
      itemFirstGap: 5,
      detailTop: 2,
      bulletsTop: 3,
      bulletGap: 2,
      inlineListTop: 5,
    },
  },
  "modern-professional": {
    body: 10,
    lineHeight: 1.4,
    name: 22,
    jobTitle: 11.5,
    jobTitleStyle: "semibold-accent",
    sectionTitle: 12,
    itemTitle: 10.5,
    itemDate: 10,
    contact: 9.5,
    summary: 10,
    inlineList: 10,
    headerAlign: "start",
    headerRulePx: 2,
    headerRuleColor: "accent",
    sectionRulePx: 0,
    sectionRuleColor: "",
    twoColumnHeader: true,
    stackedContact: true,
    itemSubItalic: false,
    itemDateItalic: false,
    // Vertical rhythm, in CSS pixels straight from the stylesheet.
    space: {
      headerPad: 9,
      contactTop: 0,
      jobTitleTop: 2,
      sectionGap: 13,
      sectionFirstGap: 13,
      sectionTitlePad: 0,
      sectionTitleGap: 3,
      itemGap: 9,
      itemFirstGap: 5,
      detailTop: 2,
      bulletsTop: 3,
      bulletGap: 2,
      inlineListTop: 5,
    },
  },
  "tech-minimalist": {
    body: 10,
    lineHeight: 1.38,
    name: 20,
    jobTitle: 11,
    jobTitleStyle: "semibold",
    sectionTitle: 12,
    itemTitle: 10.5,
    itemDate: 10,
    contact: 9.5,
    summary: 10,
    inlineList: 10,
    headerAlign: "start",
    headerRulePx: 1,
    headerRuleColor: "#d4d4d4",
    sectionRulePx: 0,
    sectionRuleColor: "",
    twoColumnHeader: false,
    stackedContact: false,
    itemSubItalic: false,
    itemDateItalic: false,
    // Vertical rhythm, in CSS pixels straight from the stylesheet.
    space: {
      headerPad: 8,
      contactTop: 5,
      jobTitleTop: 2,
      sectionGap: 12,
      sectionFirstGap: 13,
      sectionTitlePad: 0,
      sectionTitleGap: 2,
      itemGap: 7,
      itemFirstGap: 5,
      detailTop: 2,
      bulletsTop: 3,
      bulletGap: 1,
      inlineListTop: 5,
    },
  },
  executive: {
    body: 11,
    lineHeight: 1.45,
    name: 24,
    jobTitle: 12.5,
    jobTitleStyle: "italic",
    sectionTitle: 13,
    itemTitle: 11.5,
    itemDate: 10,
    contact: 10,
    summary: 11.5,
    inlineList: 10,
    headerAlign: "center",
    headerRulePx: 1.5,
    headerRuleColor: "accent",
    sectionRulePx: 1,
    sectionRuleColor: "#cccccc",
    twoColumnHeader: false,
    stackedContact: false,
    itemSubItalic: true,
    itemDateItalic: false,
    // Vertical rhythm, in CSS pixels straight from the stylesheet.
    space: {
      headerPad: 12,
      contactTop: 7,
      jobTitleTop: 2,
      sectionGap: 17,
      sectionFirstGap: 13,
      sectionTitlePad: 3,
      sectionTitleGap: 4,
      itemGap: 9,
      itemFirstGap: 5,
      detailTop: 2,
      bulletsTop: 3,
      bulletGap: 2,
      inlineListTop: 5,
    },
  },
  academic: {
    body: 11,
    lineHeight: 1.5,
    name: 21,
    jobTitle: 11.5,
    jobTitleStyle: "plain",
    sectionTitle: 12,
    itemTitle: 11,
    itemDate: 10,
    contact: 10,
    summary: 11,
    inlineList: 10,
    headerAlign: "center",
    headerRulePx: 0,
    headerRuleColor: "",
    sectionRulePx: 1.2,
    sectionRuleColor: "accent",
    twoColumnHeader: false,
    stackedContact: false,
    itemSubItalic: true,
    itemDateItalic: true,
    // Vertical rhythm, in CSS pixels straight from the stylesheet.
    space: {
      headerPad: 9,
      contactTop: 5,
      jobTitleTop: 2,
      sectionGap: 14,
      sectionFirstGap: 13,
      sectionTitlePad: 2,
      sectionTitleGap: 4,
      itemGap: 9,
      itemFirstGap: 5,
      detailTop: 2,
      bulletsTop: 3,
      bulletGap: 2,
      inlineListTop: 5,
    },
  },
};

// Colours the stylesheet uses for non-accent text, mirrored here so Word and
// LaTeX print the same greys.
export const COLORS = {
  body: "#1a1a1a",
  itemSub: "#3a3a3a",
  itemDetail: "#3a3a3a",
  itemDate: "#555555",
  contact: "#333333",
  jobTitle: "#333333",
  jobTitleExecutive: "#444444",
  summaryExecutive: "#222222",
  separator: "#999999",
  inlineSeparator: "#bbbbbb",
};

// Word-safe font name for a template. The CSS stacks list fallbacks, but a
// Word document names exactly one family per run, so this picks the head of the
// stack — the face the preview and the PDF actually use.
export const DOC_FONTS = {
  "classic-corporate": "Arial",
  "modern-professional": "Calibri",
  "tech-minimalist": "Arial",
  executive: "Georgia",
  academic: "Garamond",
};

// Arabic is set in Cairo everywhere on the site (the Latin faces have no Arabic
// coverage). Word substitutes a system face when Cairo is not installed, so the
// export ships the same family name and lets Word fall back.
export const RTL_DOC_FONT = "Cairo";

// Point sizes the density control scales — the same set `scaleLengths` reaches
// in the stylesheet. `lineHeight` is unitless in CSS and therefore never scaled;
// the `*Pt` rule widths are hairline borders, which stay constant too.
const SCALED_KEYS = [
  "body",
  "name",
  "jobTitle",
  "sectionTitle",
  "itemTitle",
  "itemDate",
  "contact",
  "summary",
  "inlineList",
];

// The type scale for a CV, with the density multiplier already applied — the
// same multiplier `scaleLengths` applies to the stylesheet — and the Arabic
// leading bonus folded into the line height, exactly as `buildStyles` does.
export function typography(templateId, { density, rtl = false } = {}) {
  const tpl = getTemplate(templateId);
  const base = TYPOGRAPHY[tpl.id] || TYPOGRAPHY["classic-corporate"];
  const factor = densityScale(density);
  const scaled = { ...base };
  for (const key of SCALED_KEYS) {
    scaled[key] = Math.round(base[key] * factor * 100) / 100;
  }
  // CSS pixels are scaled by the density dial too — `scaleLengths` rewrites
  // every px length in the stylesheet — so the vertical rhythm follows.
  scaled.space = Object.fromEntries(
    Object.entries(base.space).map(([key, px]) => [key, Math.round(px * factor * 100) / 100])
  );
  scaled.lineHeight = rtl ? base.lineHeight + RTL_LINE_HEIGHT_BONUS : base.lineHeight;
  scaled.accent = tpl.accent;
  scaled.templateId = tpl.id;
  // The density multiplier itself, so exporters can scale their own vertical
  // rhythm (paragraph spacing, rules) the way `scaleLengths` scales the CSS.
  scaled.scale = factor;
  return scaled;
}

// CSS pixels are 1/96in and points 1/72in, so a length copied out of the
// stylesheet has to be converted before Word or LaTeX can use it.
export function pxToPt(px) {
  return Math.round(Number(px) * 0.75 * 100) / 100;
}

export function docFont(templateId, rtl) {
  if (rtl) return RTL_DOC_FONT;
  const tpl = getTemplate(templateId);
  return DOC_FONTS[tpl.id] || "Arial";
}
