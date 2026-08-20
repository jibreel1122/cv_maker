// The Word and LaTeX exports lay themselves out from `cvTypography`, while the
// preview and the PDF are laid out by the stylesheet in `cvTemplates`. Nothing
// forces those two to agree at runtime, so these tests parse the generated CSS
// and assert that every size, rule and margin in the table is still exactly what
// the stylesheet applies. A change to one without the other fails here rather
// than shipping a Word file that quietly no longer matches the PDF.

import { describe, it, expect } from "vitest";
import { buildCvHtml } from "@/lib/cvTemplates";
import { TEMPLATES } from "@/lib/cvTemplateMeta";
import { TYPOGRAPHY, typography, pxToPt, docFont } from "@/lib/cvTypography";
import { DENSITIES } from "@/lib/cvSections";

const CV = { personal: { fullName: "Test" }, summary: "x" };

// Extracts the effective value of one CSS property for one selector: the last
// declaration wins, which is how the cascade resolves a base rule and the
// template variant that overrides it.
function effective(css, selector, property) {
  const rules = [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)];
  let found;
  for (const [, selectors, body] of rules) {
    const matches = selectors
      .split(",")
      .map((s) => s.trim())
      .includes(selector);
    if (!matches) continue;
    const decl = [...body.matchAll(/([a-z-]+)\s*:\s*([^;]+)/g)];
    for (const [, prop, value] of decl) {
      if (prop === property) found = value.trim();
    }
  }
  return found;
}

function cssFor(templateId, density = "standard") {
  const html = buildCvHtml({ ...CV, settings: { language: "en", density } }, templateId);
  return html.slice(html.indexOf("<style>") + 7, html.indexOf("</style>"));
}

describe("the type scale matches the stylesheet", () => {
  for (const tpl of TEMPLATES) {
    const css = cssFor(tpl.id);
    const typo = TYPOGRAPHY[tpl.id];

    it(`${tpl.id}: font sizes`, () => {
      expect(effective(css, ".page", "font-size")).toBe(`${typo.body}pt`);
      expect(effective(css, ".name", "font-size")).toBe(`${typo.name}pt`);
      expect(effective(css, ".job-title", "font-size")).toBe(`${typo.jobTitle}pt`);
      expect(effective(css, ".section-title", "font-size")).toBe(`${typo.sectionTitle}pt`);
      expect(effective(css, ".item-title", "font-size")).toBe(`${typo.itemTitle}pt`);
      expect(effective(css, ".item-date", "font-size")).toBe(`${typo.itemDate}pt`);
      expect(effective(css, ".contact", "font-size")).toBe(`${typo.contact}pt`);
      expect(effective(css, ".inline-list li", "font-size")).toBe(`${typo.inlineList}pt`);
    });

    it(`${tpl.id}: line height`, () => {
      // `body` carries the shared default; a template variant may override it
      // on `.page`, which is the more specific — and therefore effective — rule
      // for body text. The RTL bonus is applied on top and asserted separately.
      const line = effective(css, ".page", "line-height") ?? effective(css, "body", "line-height");
      expect(Number(line)).toBeCloseTo(typo.lineHeight, 5);
    });

    it(`${tpl.id}: rules and vertical rhythm`, () => {
      const headerRule = effective(css, ".header", "border-bottom");
      if (typo.headerRulePx > 0) {
        expect(headerRule).toContain(`${typo.headerRulePx}px`);
      } else {
        expect(headerRule).toBeUndefined();
      }

      const sectionRule = effective(css, ".section-title", "border-bottom");
      if (typo.sectionRulePx > 0) {
        expect(sectionRule).toContain(`${typo.sectionRulePx}px`);
      } else {
        expect(sectionRule).toBeUndefined();
      }

      expect(effective(css, ".header", "padding-bottom")).toBe(`${typo.space.headerPad}px`);
      expect(effective(css, ".section", "margin-top")).toBe(`${typo.space.sectionGap}px`);
      expect(effective(css, ".section:first-of-type", "margin-top")).toBe(
        `${typo.space.sectionFirstGap}px`
      );
      expect(effective(css, ".item", "margin-top")).toBe(`${typo.space.itemGap}px`);
      expect(effective(css, ".item:first-child", "margin-top")).toBe(
        `${typo.space.itemFirstGap}px`
      );
      expect(effective(css, ".bullets", "margin-top")).toBe(`${typo.space.bulletsTop}px`);
      expect(effective(css, ".bullets li", "margin-top")).toBe(`${typo.space.bulletGap}px`);
      expect(effective(css, ".inline-list", "margin-top")).toBe(
        `${typo.space.inlineListTop}px`
      );
      expect(effective(css, ".item-detail", "margin-top")).toBe(`${typo.space.detailTop}px`);
      expect(effective(css, ".job-title", "margin-top")).toBe(`${typo.space.jobTitleTop}px`);
    });
  }
});

describe("density scaling", () => {
  for (const density of DENSITIES) {
    it(`${density} scales the table the same way it scales the CSS`, () => {
      for (const tpl of TEMPLATES) {
        const css = cssFor(tpl.id, density);
        const typo = typography(tpl.id, { density });
        expect(effective(css, ".page", "font-size")).toBe(`${typo.body}pt`);
        expect(effective(css, ".name", "font-size")).toBe(`${typo.name}pt`);
        expect(effective(css, ".section", "margin-top")).toBe(`${typo.space.sectionGap}px`);
      }
    });
  }
});

describe("helpers", () => {
  it("converts CSS pixels to points", () => {
    expect(pxToPt(96)).toBe(72);
    expect(pxToPt(1.5)).toBe(1.13);
  });

  it("names a single, Word-installable font per template", () => {
    for (const tpl of TEMPLATES) {
      const font = docFont(tpl.id, false);
      expect(tpl.font.startsWith(font)).toBe(true);
    }
    expect(docFont("classic-corporate", true)).toBe("Cairo");
  });

  it("adds the Arabic leading bonus for an RTL CV", () => {
    const ltr = typography("academic", { density: "standard", rtl: false });
    const rtl = typography("academic", { density: "standard", rtl: true });
    expect(rtl.lineHeight).toBeCloseTo(ltr.lineHeight + 0.15, 5);
  });
});
