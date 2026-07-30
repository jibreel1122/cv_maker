// ============================================================================
// CV template HTML generator — the single source of truth.
//
// ⚠️ ATS-compatibility contract (read before any visual change):
// The output here IS the product. It must stay machine-readable by Applicant
// Tracking Systems and acceptable to conservative recruiters, in Palestine and
// internationally. Every template must keep:
//   - A4 page, single-column BODY. (A two-column header is allowed because the
//     DOM order stays linear — name, title, contact — so text extraction is
//     unaffected. The body itself must never be multi-column.)
//   - Standard fonts only: Arial, Calibri, Helvetica, Georgia, Garamond.
//     No decorative, handwritten, or web-loaded fonts.
//   - Typographic hierarchy at the Standard density: Name 20–24pt · Section
//     titles 12–14pt bold UPPERCASE · Body 10–11pt. The density control scales
//     the whole document by ±10%, so Compact can take body text to ~9pt and
//     Spacious to ~12pt. That is the user's deliberate choice for fitting a page
//     and stays inside the 9–12pt range recruiters accept; the default sits in
//     the ideal band.
//   - Page margins between 0.5in and 1in on all sides (see PAGE_MARGIN_IN).
//   - Neutral text colours with at most one restrained accent.
//   - No icons, no profile photo, no complex tables, no graphics.
//   - Everything in English, left-to-right.
//
// The same output drives the live preview (in an iframe) and the Puppeteer PDF,
// so the download always matches the preview. See `mode` in buildCvHtml for how
// the two are kept geometrically identical despite Puppeteer owning part of the
// page margin.
// ============================================================================

import {
  defaultSectionTitle,
  cvLanguage,
  isRtlCv,
  densityScale,
  customLayout,
  PRESENT_LABEL,
} from "@/lib/cvSections";
import {
  TEMPLATES,
  PAGE_MARGIN_IN,
  PRINT_MARGIN_IN,
  DEFAULT_TEMPLATE_ID,
  resolveTemplateId,
  getTemplate,
  templateName,
  NON_LATIN_STACK,
  RTL_LINE_HEIGHT_BONUS,
} from "@/lib/cvTemplateMeta";

// Template metadata lives in `cvTemplateMeta.js` so that consumers which only
// need a template's name do not pull the validation schema (and zod) into their
// bundle. Re-exported here so `cvTemplates` stays the one import for renderers.
export {
  TEMPLATES,
  PRINT_MARGIN_IN,
  DEFAULT_TEMPLATE_ID,
  resolveTemplateId,
  getTemplate,
  templateName,
};

// The stylesheet supplies the full margin on screen, but only the remainder when
// rendering for print — Puppeteer applies PRINT_MARGIN_IN itself.
const PRINT_PADDING_IN = PAGE_MARGIN_IN - PRINT_MARGIN_IN;


// --- Safe rendering primitives ----------------------------------------------

// Escapes a value for HTML. Coerces defensively so a malformed record can never
// throw during render — the schema already normalises input, but the preview
// runs client-side on data that may predate the schema.
function esc(value) {
  if (value === null || value === undefined) return "";
  const str =
    typeof value === "string"
      ? value
      : typeof value === "number" || typeof value === "boolean"
      ? String(value)
      : "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// Normalises any value to a trimmed string. Never throws.
function s(value) {
  if (typeof value === "string") return value.trim();
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return "";
}

// Normalises any value to an array. Never throws.
function arr(value) {
  return Array.isArray(value) ? value : [];
}

function fmtRange(start, end, current, language) {
  const from = esc(s(start));
  const to = current ? esc(PRESENT_LABEL[cvLanguage(language)]) : esc(s(end));
  if (!from && !to) return "";
  if (!from) return to;
  if (!to) return from;
  return `${from} — ${to}`;
}

// Resolves a section heading: the user's override if they set one, else the
// standard label in the CV's own language.
function heading(cvData, key) {
  const custom = s(cvData?.sectionTitles?.[key]);
  return custom || defaultSectionTitle(key, cvData?.settings?.language) || "";
}

function lang(cvData) {
  return cvLanguage(cvData?.settings?.language);
}

// `inner` is trusted HTML assembled by the renderers below; `title` is user text.
function section(title, inner) {
  if (!inner) return "";
  return `<section class="section"><h2 class="section-title">${esc(title)}</h2>${inner}</section>`;
}

function bulletList(items, className = "bullets") {
  const clean = arr(items).map(s).filter(Boolean);
  if (!clean.length) return "";
  return `<ul class="${className}">${clean.map((b) => `<li>${esc(b)}</li>`).join("")}</ul>`;
}

// A dated entry: bold title on the left, date on the right, subtitle beneath.
// Shared by experience, education, certifications and custom sections so every
// block on the page aligns identically.
function entry({ title, date, subtitleParts, detail, bullets }) {
  const t = esc(s(title));
  const d = esc(s(date));
  const sub = arr(subtitleParts).map(s).filter(Boolean).map(esc).join(" — ");
  const det = s(detail);
  if (!t && !sub && !det && !arr(bullets).map(s).filter(Boolean).length) return "";
  return `
    <div class="item">
      <div class="item-head">
        <span class="item-title">${t}</span>
        ${d ? `<span class="item-date">${d}</span>` : ""}
      </div>
      ${sub ? `<div class="item-sub">${sub}</div>` : ""}
      ${det ? `<p class="item-detail">${esc(det)}</p>` : ""}
      ${bulletList(bullets)}
    </div>`;
}

// --- Stylesheet --------------------------------------------------------------
// `mode` is "preview" or "print". In print mode Puppeteer already inset the page
// by PRINT_MARGIN_IN, so the stylesheet contributes only the remainder and the
// page box is not forced to full A4 — giving byte-identical text geometry in
// both modes.

// Multiplies every pt/px length in generated CSS by `factor`, leaving mm alone
// so the A4 page box never changes. This is what the density control drives: one
// dial that shrinks or expands the entire document, letting a non-technical user
// fit their content onto the pages they want without touching individual sizes.
//
// Safe as a regex because the CSS being scaled is generated in this file — it is
// never user input.
function scaleLengths(css, factor) {
  if (factor === 1) return css;
  return css.replace(/(\d*\.?\d+)(pt|px)\b/g, (whole, value, unit) => {
    const scaled = Number.parseFloat(value) * factor;
    // Two decimals is well below a printer dot; more just bloats the stylesheet.
    return `${Math.round(scaled * 100) / 100}${unit}`;
  });
}

function buildStyles(tpl, mode, { rtl = false, density = 1, fontFaceCss = "" } = {}) {
  const isPrint = mode === "print";
  const pagePadding = isPrint ? `${PRINT_PADDING_IN}in` : `${PAGE_MARGIN_IN}in`;
  const pageBox = isPrint
    ? "width:100%;"
    : "width:210mm;min-height:297mm;margin:0 auto;";

  // Arabic is set in Cairo regardless of the template's Latin face — the Latin
  // stacks (Garamond, Calibri…) have no Arabic coverage at all.
  const fontFamily = rtl ? NON_LATIN_STACK : tpl.font;

  const base = `
    *{box-sizing:border-box;margin:0;padding:0;}
    html,body{background:#ffffff;}
    body{
      font-family:${fontFamily};
      color:#1a1a1a;
      direction:${rtl ? "rtl" : "ltr"};
      text-align:${rtl ? "right" : "left"};
      line-height:${rtl ? 1.45 + RTL_LINE_HEIGHT_BONUS : 1.45};
      -webkit-print-color-adjust:exact;
      print-color-adjust:exact;
    }
    .page{${pageBox}padding:${pagePadding};background:#ffffff;}

    /* Typographic hierarchy — see the ATS contract at the top of this file. */
    .name{font-size:23pt;font-weight:700;color:${tpl.accent};line-height:1.15;}
    .job-title{font-size:12pt;color:#333;margin-top:2px;}
    .section-title{
      font-size:12.5pt;font-weight:700;text-transform:uppercase;
      letter-spacing:0.6px;color:${tpl.accent};
    }
    .page{font-size:10.5pt;}

    a{color:inherit;text-decoration:none;}
    ul{list-style:none;}
    .section{margin-top:15px;}
    .section:first-of-type{margin-top:13px;}
    .item{margin-top:9px;}
    .item:first-child{margin-top:5px;}
    .item-head{display:flex;justify-content:space-between;align-items:baseline;gap:12px;}
    .item-title{font-weight:700;font-size:11pt;}
    .item-sub{color:#3a3a3a;}
    .item-date{color:#555;font-size:10pt;white-space:nowrap;}
    .item-detail{color:#3a3a3a;margin-top:2px;}

    .bullets{margin-top:3px;}
    .bullets li{position:relative;padding-inline-start:13px;margin-top:2px;}
    .bullets li::before{
      content:"•";position:absolute;inset-inline-start:0;color:${tpl.accent};
    }

    .contact{color:#333;font-size:10pt;}
    .contact span{white-space:nowrap;}
    .contact .sep{margin:0 7px;color:#999;}

    .inline-list{display:flex;flex-wrap:wrap;gap:4px 9px;margin-top:5px;}
    .inline-list li{font-size:10pt;}
    .inline-list li::after{content:"•";margin-inline-start:9px;color:#bbb;}
    .inline-list li:last-child::after{content:"";}

    /* Keep entries from being split across a page break. */
    .item{break-inside:avoid;page-break-inside:avoid;}
    .section-title{break-after:avoid;page-break-after:avoid;}

    /* Free-text sections: preserve the user's own line breaks. */
    .free-text{white-space:pre-wrap;}

    @page{size:A4;}
  `;

  const variants = {
    "classic-corporate": `
      .header{text-align:center;border-bottom:1.5px solid ${tpl.accent};padding-bottom:10px;}
      .name{font-size:24pt;letter-spacing:0.4px;}
      .job-title{font-size:12.5pt;font-weight:600;}
      .contact{margin-top:6px;text-align:center;}
      .section-title{border-bottom:1px solid #d4d4d4;padding-bottom:3px;margin-bottom:3px;}
    `,
    "modern-professional": `
      .page{font-size:10pt;line-height:1.4;}
      .header{
        display:flex;justify-content:space-between;align-items:flex-end;gap:20px;
        border-bottom:2px solid ${tpl.accent};padding-bottom:9px;
      }
      .header-right{text-align:right;}
      .name{font-size:22pt;}
      .job-title{font-size:11.5pt;font-weight:600;color:${tpl.accent};}
      .contact{font-size:9.5pt;line-height:1.7;}
      .contact .sep{display:none;}
      .contact span{display:block;}
      .section{margin-top:13px;}
      .section-title{font-size:12pt;letter-spacing:1.2px;margin-bottom:3px;}
      .item-title{font-size:10.5pt;}
    `,
    "tech-minimalist": `
      .page{font-size:10pt;line-height:1.38;}
      .header{border-bottom:1px solid #d4d4d4;padding-bottom:8px;}
      .name{font-size:20pt;}
      .job-title{font-size:11pt;font-weight:600;}
      .contact{margin-top:5px;font-size:9.5pt;}
      .section{margin-top:12px;}
      .section-title{font-size:12pt;letter-spacing:1.4px;margin-bottom:2px;}
      .item{margin-top:7px;}
      .item-title{font-size:10.5pt;}
      .bullets li{margin-top:1px;}
      .inline-list{gap:3px 8px;}
    `,
    executive: `
      .page{font-size:11pt;}
      .header{text-align:center;border-bottom:1.5px solid ${tpl.accent};padding-bottom:12px;}
      .name{font-size:24pt;letter-spacing:0.5px;}
      .job-title{font-size:12.5pt;font-style:italic;color:#444;}
      .contact{margin-top:7px;text-align:center;}
      .section{margin-top:17px;}
      .section-title{font-size:13pt;letter-spacing:1.2px;border-bottom:1px solid #ccc;padding-bottom:3px;margin-bottom:4px;}
      /* The summary carries the most weight on an executive CV. */
      .summary-text{font-size:11.5pt;line-height:1.55;color:#222;}
      .item-title{font-size:11.5pt;}
      .item-sub{font-style:italic;}
    `,
    academic: `
      .page{font-size:11pt;line-height:1.5;}
      .header{text-align:center;padding-bottom:9px;}
      .name{font-size:21pt;letter-spacing:0.6px;}
      .job-title{font-size:11.5pt;color:#333;}
      .contact{margin-top:5px;text-align:center;}
      .section{margin-top:14px;}
      .section-title{
        font-size:12pt;letter-spacing:1px;
        border-bottom:1.2px solid ${tpl.accent};padding-bottom:2px;margin-bottom:4px;
      }
      .item-sub{font-style:italic;}
      .item-date{font-style:italic;}
    `,
  };

  const scaled = scaleLengths(
    base + (variants[tpl.id] || variants["classic-corporate"]),
    density
  );
  // @font-face rules are appended unscaled — they carry no lengths, and the
  // base64 payload must not be touched by the regex.
  return fontFaceCss + scaled;
}

// --- Section renderers -------------------------------------------------------

function renderContact(p, tpl) {
  const parts = [p.email, p.phone, p.location, p.linkedin, p.website]
    .map(s)
    .filter(Boolean)
    .map((v) => `<span>${esc(v)}</span>`);
  if (!parts.length) return "";
  // The two-column header stacks contact lines instead of separating them.
  const sep = tpl.id === "modern-professional" ? "" : '<span class="sep">|</span>';
  return `<div class="contact">${parts.join(sep)}</div>`;
}

function renderHeader(data, tpl) {
  const p = data.personal || {};
  const name = esc(s(p.fullName)) || "Full Name";
  const title = s(p.jobTitle);
  const contact = renderContact(p, tpl);

  if (tpl.id === "modern-professional") {
    return `
      <header class="header">
        <div class="header-left">
          <div class="name">${name}</div>
          ${title ? `<div class="job-title">${esc(title)}</div>` : ""}
        </div>
        <div class="header-right">${contact}</div>
      </header>`;
  }

  return `
    <header class="header">
      <div class="name">${name}</div>
      ${title ? `<div class="job-title">${esc(title)}</div>` : ""}
      ${contact}
    </header>`;
}

function renderSummary(data) {
  const text = s(data.summary);
  if (!text) return "";
  return section(heading(data, "summary"), `<p class="summary-text">${esc(text)}</p>`);
}

function renderExperience(data) {
  const inner = arr(data.experiences)
    .map((e) =>
      entry({
        title: e?.jobTitle,
        date: fmtRange(e?.startDate, e?.endDate, e?.current, lang(data)),
        subtitleParts: [e?.company, e?.location],
        bullets: e?.bullets,
      })
    )
    .join("");
  return inner ? section(heading(data, "experience"), inner) : "";
}

function renderEducation(data) {
  const inner = arr(data.education)
    .map((e) =>
      entry({
        title: e?.degree,
        date: fmtRange(e?.startDate, e?.endDate, false, lang(data)),
        subtitleParts: [e?.institution, e?.location],
        detail: e?.details,
      })
    )
    .join("");
  return inner ? section(heading(data, "education"), inner) : "";
}

function renderSkills(data) {
  const list = bulletList(data.skills, "inline-list");
  return list ? section(heading(data, "skills"), list) : "";
}

function renderLanguages(data) {
  const clean = arr(data.languages)
    .map((l) => {
      const name = s(l?.name);
      if (!name) return "";
      const level = s(l?.level);
      return level ? `${name} — ${level}` : name;
    })
    .filter(Boolean);
  const list = bulletList(clean, "inline-list");
  return list ? section(heading(data, "languages"), list) : "";
}

function renderCertifications(data) {
  const inner = arr(data.certifications)
    .map((c) =>
      entry({
        title: c?.name,
        date: c?.date,
        subtitleParts: [c?.issuer],
      })
    )
    .join("");
  return inner ? section(heading(data, "certifications"), inner) : "";
}

// User-defined sections, rendered with the same entry shape as the built-ins so
// they are visually indistinguishable from a native section.
function renderCustomSections(data) {
  return arr(data.customSections)
    .map((sec) => {
      const title = s(sec?.title);
      if (!title) return "";

      // Free text is one block of prose the user typed, newlines and all.
      if (customLayout(sec?.layout) === "freeText") {
        const body = s(sec?.text);
        return body ? section(title, `<p class="free-text">${esc(body)}</p>`) : "";
      }

      const inner = arr(sec?.items)
        .map((it) =>
          entry({
            title: it?.title,
            date: it?.dateRange,
            subtitleParts: [it?.subtitle, it?.location],
            bullets: it?.descriptionBullets,
          })
        )
        .join("");
      return inner ? section(title, inner) : "";
    })
    .join("");
}

const RENDERERS = {
  summary: renderSummary,
  experience: renderExperience,
  education: renderEducation,
  skills: renderSkills,
  languages: renderLanguages,
  certifications: renderCertifications,
  custom: renderCustomSections,
};

// --- Entry point -------------------------------------------------------------

// Builds a complete HTML document for a CV.
//   mode: "preview" (default) — full A4 page box, full margin in CSS.
//         "print"             — assumes Puppeteer applies PRINT_MARGIN_IN.
// Never throws: malformed data degrades field-by-field to empty output.
export function buildCvHtml(
  cvData,
  templateId,
  { mode = "preview", fontFaceCss = "" } = {}
) {
  const tpl = getTemplate(templateId);
  // No schema pass here on purpose. Writes are validated at the API boundary,
  // and every helper below (`s`, `arr`, `esc`, `bulletList`) is total — it
  // accepts any value and yields a string. That keeps the renderer safe against
  // legacy records without pulling a validation library into the browser bundle
  // that ships this module to the preview.
  const data = cvData && typeof cvData === "object" ? cvData : {};

  const language = lang(data);
  const rtl = isRtlCv(language);
  const styles = buildStyles(tpl, mode, {
    rtl,
    density: densityScale(data?.settings?.density),
    fontFaceCss,
  });

  const body = tpl.order.map((key) => RENDERERS[key]?.(data) || "").join("");

  return `<!DOCTYPE html>
<html lang="${language}" dir="${rtl ? "rtl" : "ltr"}">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${esc(s(data.personal?.fullName)) || "CV"}</title>
<style>${styles}</style>
</head>
<body>
  <div class="page">
    ${renderHeader(data, tpl)}
    ${body}
  </div>
</body>
</html>`;
}
