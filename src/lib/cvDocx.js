// ============================================================================
// Word (.docx) export.
//
// The goal is a file that looks like the PDF and edits like a normal Word
// document — not an HTML file with a .doc extension. So this builds real OOXML
// through `docx`: an A4 section with the same 0.75in margins, the same fonts at
// the same point sizes (from `cvTypography`, which the preview's stylesheet is
// tested against), the same accent colour, the same rules under the header and
// the section titles, and the same content in the same order (from
// `cvDocModel`, which the preview renders from as well).
//
// Fidelity choices worth knowing:
//   - Bullets are a literal "•" run plus a hanging indent, exactly as the CSS
//     draws them, rather than a Word list. That reproduces the accent-coloured
//     bullet, survives copy/paste into an ATS, and still edits normally.
//   - The two-column header (Modern Professional) is a borderless table, which
//     is how Word expresses that layout. The body itself is never tabular, so
//     the ATS contract in `cvTemplates.js` still holds.
//   - Line breaks inside a field become real Word line breaks, so a two-line
//     job title stays two lines.
// ============================================================================

import {
  AlignmentType,
  BorderStyle,
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  LineRuleType,
  Table,
  TableCell,
  TableRow,
  TabStopType,
  TextRun,
  VerticalAlign,
  WidthType,
} from "docx";
import { buildCvModel } from "@/lib/cvDocModel";
import { COLORS, pxToPt } from "@/lib/cvTypography";
import { PAGE_MARGIN_IN } from "@/lib/cvTemplateMeta";

// Word measures in twips (1/20 pt); 1 inch = 1440 twips.
const TWIPS_PER_INCH = 1440;
const A4_WIDTH_TWIPS = Math.round(8.27 * TWIPS_PER_INCH);
const A4_HEIGHT_TWIPS = Math.round(11.69 * TWIPS_PER_INCH);
const MARGIN_TWIPS = Math.round(PAGE_MARGIN_IN * TWIPS_PER_INCH);

// The CSS bullet sits 13px from the text edge; 13px ≈ 9.75pt ≈ 195 twips.
const BULLET_INDENT_TWIPS = 195;

// Word colours are hex without the leading "#".
const hex = (color) => String(color || "").replace("#", "");

// docx sizes are half-points; spacing is twips.
const halfPt = (pt) => Math.round(pt * 2);
const ptToTwips = (pt) => Math.round(pt * 20);
// A margin copied from the stylesheet, in CSS pixels, as twips.
const pxToTwips = (px) => ptToTwips(pxToPt(px));

// CSS `line-height: 1.45` on 10.5pt text is exactly 15.2pt of leading. Word's
// "exact" rule takes that measurement in twips, which is what keeps the two
// documents setting — and paginating — alike. The "auto" rule would instead
// multiply Word's own font-dependent single-line height and come out looser.
function lineSpacing(sizePt, lineHeight) {
  return { line: ptToTwips(sizePt * lineHeight), lineRule: LineRuleType.EXACT };
}

// A run of text, splitting the user's newlines into real Word breaks.
function runs(text, style) {
  const lines = String(text ?? "").split("\n");
  return lines.map(
    (line, i) => new TextRun({ ...style, text: line, break: i === 0 ? 0 : 1 })
  );
}

// `widthPx` and `padPx` are the CSS border-width and padding-bottom.
function bottomBorder(widthPx, color, padPx = 1) {
  return {
    bottom: {
      style: BorderStyle.SINGLE,
      // Word border sizes are eighths of a point.
      size: Math.max(2, Math.round(pxToPt(widthPx) * 8)),
      color: hex(color),
      // ...and the gap between text and border is in whole points.
      space: Math.max(0, Math.round(pxToPt(padPx))),
    },
  };
}

// The rule under the header: an empty, bottom-bordered paragraph, so the line
// spans the full text width exactly as the CSS border does. `gapPx` is the
// header's CSS padding-bottom — the space between the last contact line and the
// rule.
function ruleParagraph(gapPx, widthPx, color) {
  return new Paragraph({
    children: [new TextRun({ text: "", size: 2 })],
    spacing: { before: pxToTwips(gapPx), after: 0, line: 20, lineRule: LineRuleType.EXACT },
    border: bottomBorder(widthPx, color, 0),
  });
}

// --- Header ------------------------------------------------------------------

function nameParagraph(model, { alignment, spacingAfter = 0, border }) {
  const { typo, font } = model;
  return new Paragraph({
    children: runs(model.header.name, {
      font,
      size: halfPt(typo.name),
      bold: true,
      color: hex(model.accent),
      rightToLeft: model.rtl,
    }),
    alignment,
    spacing: { after: spacingAfter, ...lineSpacing(typo.name, 1.15) },
    bidirectional: model.rtl,
    ...(border ? { border } : {}),
  });
}

function jobTitleParagraph(model, { alignment, border }) {
  const { typo, font } = model;
  const style = typo.jobTitleStyle;
  return new Paragraph({
    children: runs(model.header.jobTitle, {
      font,
      size: halfPt(typo.jobTitle),
      bold: style === "semibold" || style === "semibold-accent",
      italics: style === "italic",
      color:
        style === "semibold-accent"
          ? hex(model.accent)
          : hex(style === "italic" ? COLORS.jobTitleExecutive : COLORS.jobTitle),
      rightToLeft: model.rtl,
    }),
    alignment,
    spacing: { before: pxToTwips(typo.space.jobTitleTop), ...lineSpacing(typo.jobTitle, 1.2) },
    bidirectional: model.rtl,
    ...(border ? { border } : {}),
  });
}

// Contact line(s). The stacked variant (Modern Professional) puts each detail on
// its own line; every other template joins them with a grey pipe.
function contactParagraphs(model, { alignment, border }) {
  const { typo, font, header } = model;
  if (!header.contacts.length) return [];
  const style = {
    font,
    size: halfPt(typo.contact),
    color: hex(COLORS.contact),
    rightToLeft: model.rtl,
  };

  if (typo.stackedContact) {
    return header.contacts.map((value, i) => {
      const last = i === header.contacts.length - 1;
      return new Paragraph({
        children: [new TextRun({ ...style, text: value })],
        alignment,
        spacing: lineSpacing(typo.contact, 1.7),
        bidirectional: model.rtl,
        ...(last && border ? { border } : {}),
      });
    });
  }

  const children = [];
  header.contacts.forEach((value, i) => {
    if (i > 0) {
      children.push(
        new TextRun({ ...style, color: hex(COLORS.separator), text: "  |  " })
      );
    }
    children.push(new TextRun({ ...style, text: value }));
  });

  return [
    new Paragraph({
      children,
      alignment,
      spacing: { before: pxToTwips(typo.space.contactTop), ...lineSpacing(typo.contact, 1.35) },
      bidirectional: model.rtl,
      ...(border ? { border } : {}),
    }),
  ];
}

// Borderless two-column header: name and job title on one side, contact details
// on the other, with the accent rule spanning both.
function twoColumnHeader(model) {
  const start = AlignmentType.START;
  const end = AlignmentType.END;

  const left = [nameParagraph(model, { alignment: start })];
  if (model.header.jobTitle) left.push(jobTitleParagraph(model, { alignment: start }));
  const right = contactParagraphs(model, { alignment: end });

  // `align-items: flex-end` in the CSS — the name block and the contact block
  // sit on the same bottom edge, not the same top edge.
  const cells = [
    new TableCell({
      children: left,
      margins: NO_CELL_MARGINS,
      verticalAlign: VerticalAlign.BOTTOM,
    }),
    new TableCell({
      children: right.length ? right : [new Paragraph("")],
      margins: NO_CELL_MARGINS,
      verticalAlign: VerticalAlign.BOTTOM,
    }),
  ];

  return [
    new Table({
      rows: [new TableRow({ children: cells })],
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: INVISIBLE_BORDERS,
      visuallyRightToLeft: model.rtl,
    }),
    ruleParagraph(model.typo.space.headerPad, model.typo.headerRulePx, model.accent),
  ];
}

function renderHeader(model) {
  const { typo } = model;
  if (typo.twoColumnHeader) return twoColumnHeader(model);

  const alignment =
    typo.headerAlign === "center" ? AlignmentType.CENTER : AlignmentType.START;

  const out = [nameParagraph(model, { alignment })];
  if (model.header.jobTitle) out.push(jobTitleParagraph(model, { alignment }));
  out.push(...contactParagraphs(model, { alignment }));

  if (typo.headerRulePx > 0) {
    const color = typo.headerRuleColor === "accent" ? model.accent : typo.headerRuleColor;
    out.push(ruleParagraph(typo.space.headerPad, typo.headerRulePx, color));
  }
  return out;
}

// --- Body --------------------------------------------------------------------

function sectionTitle(model, title, first) {
  const { typo, font } = model;
  const border =
    typo.sectionRulePx > 0
      ? bottomBorder(
          typo.sectionRulePx,
          typo.sectionRuleColor === "accent" ? model.accent : typo.sectionRuleColor,
          typo.space.sectionTitlePad
        )
      : undefined;

  return new Paragraph({
    children: runs(title.toUpperCase(), {
      font,
      size: halfPt(typo.sectionTitle),
      bold: true,
      color: hex(model.accent),
      characterSpacing: 9, // 0.6px of CSS letter-spacing = 0.45pt, in twips
      rightToLeft: model.rtl,
    }),
    // Word needs a real heading level for the navigation pane and for
    // accessibility; the visual styling is entirely explicit above.
    heading: HeadingLevel.HEADING_2,
    alignment: AlignmentType.START,
    spacing: {
      before: pxToTwips(first ? typo.space.sectionFirstGap : typo.space.sectionGap),
      after: pxToTwips(typo.space.sectionTitleGap),
    },
    bidirectional: model.rtl,
    keepNext: true,
    ...(border ? { border } : {}),
  });
}

// Base run style for body-sized text.
function bodyRun(model, extra = {}) {
  return {
    font: model.font,
    size: halfPt(model.typo.body),
    color: hex(COLORS.body),
    rightToLeft: model.rtl,
    ...extra,
  };
}

// Borderless table cell borders, shared by the two places that need a layout
// table with nothing drawn around it.
const INVISIBLE_BORDERS = {
  top: { style: BorderStyle.NONE, size: 0, color: "auto" },
  bottom: { style: BorderStyle.NONE, size: 0, color: "auto" },
  left: { style: BorderStyle.NONE, size: 0, color: "auto" },
  right: { style: BorderStyle.NONE, size: 0, color: "auto" },
  insideHorizontal: { style: BorderStyle.NONE, size: 0, color: "auto" },
  insideVertical: { style: BorderStyle.NONE, size: 0, color: "auto" },
};

const NO_CELL_MARGINS = { top: 0, bottom: 0, left: 0, right: 0 };

// The head of an entry whose title spans several lines: title on one side, date
// held level with its first line on the other.
function entryHeadTable(model, item, { titleStyle, dateStyle, spacing }) {
  const start = AlignmentType.START;
  const end = AlignmentType.END;

  const cells = [
    new TableCell({
      children: [
        new Paragraph({
          children: runs(item.title, titleStyle),
          alignment: start,
          spacing,
          bidirectional: model.rtl,
        }),
      ],
      width: { size: 74, type: WidthType.PERCENTAGE },
      margins: NO_CELL_MARGINS,
    }),
    new TableCell({
      children: [
        new Paragraph({
          children: [new TextRun({ ...dateStyle, text: item.date })],
          alignment: end,
          spacing,
          bidirectional: model.rtl,
        }),
      ],
      width: { size: 26, type: WidthType.PERCENTAGE },
      margins: NO_CELL_MARGINS,
    }),
  ];

  return new Table({
    // `visuallyRightToLeft` already flips the cell order for an RTL document;
    // reversing the array as well would cancel it out.
    rows: [new TableRow({ children: cells, cantSplit: true })],
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: INVISIBLE_BORDERS,
    visuallyRightToLeft: model.rtl,
  });
}

function entryParagraphs(model, item, first) {
  const { typo, font } = model;
  const out = [];
  const alignment = AlignmentType.START;

  const titleStyle = {
    font,
    size: halfPt(typo.itemTitle),
    bold: true,
    color: hex(COLORS.body),
    rightToLeft: model.rtl,
  };
  const dateStyle = {
    font,
    size: halfPt(typo.itemDate),
    color: hex(COLORS.itemDate),
    italics: typo.itemDateItalic,
    rightToLeft: model.rtl,
  };
  const spacing = {
    before: pxToTwips(first ? typo.space.itemFirstGap : typo.space.itemGap),
    ...lineSpacing(typo.itemTitle, typo.lineHeight),
  };
  const keepNext = Boolean(item.subtitle || item.detail || item.bullets.length);

  // Title on one side, date on the other. A tab stop at the far text margin is
  // how Word expresses `justify-content: space-between` — but a tab always
  // lands on the paragraph's *last* line, so once the title carries its own
  // line breaks the date would drift down with it. In that case only, the head
  // becomes a borderless two-cell table, which keeps the date beside the first
  // line where the preview puts it.
  if (item.date && item.title.includes("\n")) {
    out.push(entryHeadTable(model, item, { titleStyle, dateStyle, spacing }));
  } else {
    const titleChildren = runs(item.title, titleStyle);
    if (item.date) titleChildren.push(new TextRun({ ...dateStyle, text: `\t${item.date}` }));
    out.push(
      new Paragraph({
        children: titleChildren,
        alignment,
        tabStops: item.date
          ? [
              { type: TabStopType.END, position: A4_WIDTH_TWIPS - MARGIN_TWIPS * 2 },
            ]
          : undefined,
        spacing,
        bidirectional: model.rtl,
        keepLines: true,
        keepNext,
      })
    );
  }

  if (item.subtitle) {
    out.push(
      new Paragraph({
        children: runs(
          item.subtitle,
          bodyRun(model, { color: hex(COLORS.itemSub), italics: typo.itemSubItalic })
        ),
        alignment,
        spacing: lineSpacing(typo.body, typo.lineHeight),
        bidirectional: model.rtl,
        keepLines: true,
      })
    );
  }

  if (item.detail) {
    out.push(
      new Paragraph({
        children: runs(item.detail, bodyRun(model, { color: hex(COLORS.itemDetail) })),
        alignment,
        spacing: {
          before: pxToTwips(typo.space.detailTop),
          ...lineSpacing(typo.body, typo.lineHeight),
        },
        bidirectional: model.rtl,
        keepLines: true,
      })
    );
  }

  item.bullets.forEach((bullet, i) => {
    out.push(bulletParagraph(model, bullet, i === 0));
  });

  return out;
}

function bulletParagraph(model, text, first) {
  const { typo } = model;
  const marker = new TextRun(bodyRun(model, { text: "•", color: hex(model.accent) }));
  const tab = new TextRun(bodyRun(model, { text: "\t" }));
  return new Paragraph({
    children: [marker, tab, ...runs(text, bodyRun(model))],
    alignment: AlignmentType.START,
    indent: { start: BULLET_INDENT_TWIPS, hanging: BULLET_INDENT_TWIPS },
    tabStops: [{ type: TabStopType.START, position: BULLET_INDENT_TWIPS }],
    spacing: {
      before: pxToTwips(first ? typo.space.bulletsTop : typo.space.bulletGap),
      ...lineSpacing(typo.body, typo.lineHeight),
    },
    bidirectional: model.rtl,
    keepLines: true,
  });
}

// Skills and languages: one flowing line separated by grey bullets, matching the
// CSS inline list.
function inlineParagraph(model, items) {
  const { typo, font } = model;
  const style = {
    font,
    size: halfPt(typo.inlineList),
    color: hex(COLORS.body),
    rightToLeft: model.rtl,
  };
  const children = [];
  items.forEach((item, i) => {
    if (i > 0) {
      children.push(new TextRun({ ...style, color: hex(COLORS.inlineSeparator), text: "   •   " }));
    }
    children.push(new TextRun({ ...style, text: item }));
  });
  return new Paragraph({
    children,
    alignment: AlignmentType.START,
    spacing: {
      before: pxToTwips(typo.space.inlineListTop),
      ...lineSpacing(typo.inlineList, typo.lineHeight),
    },
    bidirectional: model.rtl,
  });
}

function textParagraph(model, block) {
  const { typo, font } = model;
  const isSummary = block.variant === "summary";
  const size = isSummary ? typo.summary : typo.body;
  const lh = isSummary && model.templateId === "executive" ? 1.55 : typo.lineHeight;
  const color =
    isSummary && model.templateId === "executive" ? COLORS.summaryExecutive : COLORS.body;

  return new Paragraph({
    children: runs(block.text, {
      font,
      size: halfPt(size),
      color: hex(color),
      rightToLeft: model.rtl,
    }),
    alignment: AlignmentType.START,
    spacing: lineSpacing(size, lh),
    bidirectional: model.rtl,
  });
}

function renderSection(model, block, first) {
  const out = [sectionTitle(model, block.title, first)];
  if (block.kind === "text") {
    out.push(textParagraph(model, block));
  } else if (block.kind === "inline") {
    out.push(inlineParagraph(model, block.items));
  } else {
    block.entries.forEach((item, i) => out.push(...entryParagraphs(model, item, i === 0)));
  }
  return out;
}

// --- Entry point -------------------------------------------------------------

// Builds a Word document for a CV and returns it as a Buffer.
export async function cvToDocx(cvData, templateId) {
  const model = buildCvModel(cvData, templateId);

  const children = [
    ...renderHeader(model),
    ...model.sections.flatMap((block, i) => renderSection(model, block, i === 0)),
  ];

  const doc = new Document({
    title: model.documentTitle,
    description: "Created with Bornat CV Maker",
    styles: {
      default: {
        document: {
          run: {
            font: model.font,
            size: halfPt(model.typo.body),
            color: hex(COLORS.body),
          },
          paragraph: {
            spacing: lineSpacing(model.typo.body, model.typo.lineHeight),
          },
        },
      },
    },
    sections: [
      {
        properties: {
          page: {
            size: { width: A4_WIDTH_TWIPS, height: A4_HEIGHT_TWIPS },
            margin: {
              top: MARGIN_TWIPS,
              right: MARGIN_TWIPS,
              bottom: MARGIN_TWIPS,
              left: MARGIN_TWIPS,
            },
          },
          ...(model.rtl ? { bidi: true } : {}),
        },
        children,
      },
    ],
  });

  return Packer.toBuffer(doc);
}
