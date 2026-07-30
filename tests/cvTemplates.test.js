import { describe, it, expect } from "vitest";
import { buildCvHtml, resolveTemplateId, templateName } from "@/lib/cvTemplates";
import { TEMPLATES } from "@/lib/cvTemplateMeta";
import { parseCvData } from "@/lib/validations/cv";

const ENGLISH_CV = {
  settings: { language: "en", density: "standard" },
  personal: { fullName: "Layla Khalil", jobTitle: "Frontend Developer", email: "l@e.com" },
  summary: "Frontend developer with four years of experience.",
  experiences: [
    { jobTitle: "Senior Developer", company: "Tech", startDate: "2022", current: true, bullets: ["Led a rebuild."] },
  ],
  skills: ["React", "TypeScript"],
};

const ARABIC_CV = {
  settings: { language: "ar", density: "standard" },
  personal: { fullName: "ليلى خليل", jobTitle: "مطوّرة واجهات", email: "l@e.com" },
  summary: "مطوّرة واجهات أمامية بخبرة أربع سنوات.",
  experiences: [
    { jobTitle: "مطوّرة أولى", company: "حلول تقنية", startDate: "2022", current: true, bullets: ["قدت إعادة البناء."] },
  ],
  skills: ["React", "تصميم الواجهات"],
};

function headings(html) {
  return [...html.matchAll(/class="section-title">([^<]+)</g)].map((m) => m[1]);
}

describe("malformed input", () => {
  // These exact shapes used to throw `TypeError: s.trim is not a function`,
  // which meant one bad record could take down the admin dashboard the moment
  // an admin clicked preview on it.
  const hostile = {
    "skill as number": { skills: [123] },
    "skill as object": { skills: [{ deep: true }] },
    "bullet as number": { experiences: [{ jobTitle: "X", bullets: [42] }] },
    "summary as object": { summary: { a: 1 } },
    "personal as string": { personal: "not an object" },
    "everything null": { personal: null, skills: null, experiences: null, customSections: null },
    "arrays where objects belong": { experiences: [[[]]], education: "str", languages: [[1]] },
    "custom sections of junk": { customSections: ["x", 5, { items: "no" }] },
    "settings garbage": { settings: "nope" },
  };

  for (const [name, data] of Object.entries(hostile)) {
    it(`renders without throwing: ${name}`, () => {
      expect(() => buildCvHtml(data, "classic-corporate")).not.toThrow();
      expect(buildCvHtml(data, "classic-corporate")).toContain("<!DOCTYPE html>");
    });
  }

  it("renders degenerate top-level values", () => {
    for (const bad of [null, undefined, "string", 42, [], true]) {
      expect(() => buildCvHtml(bad, "classic-corporate")).not.toThrow();
    }
  });

  it("never emits [object Object] for a mis-typed field", () => {
    const html = buildCvHtml(parseCvData({ summary: { a: 1 }, skills: [{ b: 2 }] }), "classic-corporate");
    expect(html).not.toContain("[object Object]");
  });
});

describe("escaping", () => {
  it("escapes markup in every user-supplied field", () => {
    const html = buildCvHtml(
      {
        personal: { fullName: '<img src=x onerror=alert(1)>', jobTitle: '"><b>bold' },
        summary: "</style><script>alert(2)</script>",
        skills: ["<script>x</script>"],
        customSections: [
          { title: "<script>bad()</script>", layout: "freeText", text: "</p><script>y</script>" },
        ],
      },
      "classic-corporate"
    );

    expect(html).not.toContain("<script>");
    expect(html).not.toContain("<img src=x");
    expect(html).not.toContain('"><b>bold');
    expect(html).toContain("&lt;script&gt;");
  });
});

describe("Arabic / RTL output", () => {
  it("marks the document right-to-left and Arabic", () => {
    const html = buildCvHtml(parseCvData(ARABIC_CV), "classic-corporate");
    expect(html).toMatch(/<html lang="ar" dir="rtl">/);
    expect(html).toContain("direction:rtl");
    expect(html).toContain("text-align:right");
  });

  it("declares the Cairo family for Arabic", () => {
    const html = buildCvHtml(parseCvData(ARABIC_CV), "classic-corporate");
    expect(html).toMatch(/font-family:'Cairo'/);
  });

  it("passes through @font-face rules supplied by the caller", () => {
    // The PDF path inlines base64 fonts; the preview passes URLs. Either way the
    // renderer must emit them verbatim and must not scale anything inside them.
    const face = "@font-face{font-family:'Cairo';src:url(/fonts/cairo-arabic.woff2) format('woff2');}";
    const html = buildCvHtml(parseCvData(ARABIC_CV), "classic-corporate", { fontFaceCss: face });
    expect(html).toContain(face);
  });

  it("uses Arabic section headings and a localised Present", () => {
    const html = buildCvHtml(parseCvData(ARABIC_CV), "classic-corporate");
    expect(headings(html)).toContain("الملخص المهني");
    expect(headings(html)).toContain("الخبرات العملية");
    expect(html).toContain("حتى الآن");
    expect(html).not.toContain("Present");
  });

  it("uses logical properties so bullets flip with direction", () => {
    const html = buildCvHtml(parseCvData(ARABIC_CV), "classic-corporate");
    expect(html).toContain("padding-inline-start");
    expect(html).toContain("inset-inline-start");
  });

  it("leaves an English CV left-to-right", () => {
    const html = buildCvHtml(parseCvData(ENGLISH_CV), "classic-corporate");
    expect(html).toMatch(/<html lang="en" dir="ltr">/);
    expect(html).toContain("Present");
    expect(headings(html)).toContain("Work Experience");
  });

  it("honours a user's renamed heading over the default", () => {
    const html = buildCvHtml(
      parseCvData({ ...ENGLISH_CV, sectionTitles: { experience: "Relevant Experience" } }),
      "classic-corporate"
    );
    expect(headings(html)).toContain("Relevant Experience");
    expect(headings(html)).not.toContain("Work Experience");
  });
});

describe("density", () => {
  const sizes = (html) =>
    [...html.matchAll(/\.page\{font-size:([\d.]+)pt/g)].map((m) => Number(m[1])).pop();

  it("scales type down for compact and up for spacious", () => {
    const compact = sizes(buildCvHtml(parseCvData({ ...ENGLISH_CV, settings: { density: "compact" } }), "classic-corporate"));
    const standard = sizes(buildCvHtml(parseCvData({ ...ENGLISH_CV, settings: { density: "standard" } }), "classic-corporate"));
    const spacious = sizes(buildCvHtml(parseCvData({ ...ENGLISH_CV, settings: { density: "spacious" } }), "classic-corporate"));

    expect(compact).toBeLessThan(standard);
    expect(standard).toBeLessThan(spacious);
  });

  it("keeps every density inside the 9-12pt band recruiters accept", () => {
    for (const density of ["compact", "standard", "spacious"]) {
      for (const tpl of TEMPLATES) {
        const pt = sizes(buildCvHtml(parseCvData({ ...ENGLISH_CV, settings: { density } }), tpl.id));
        expect(pt, `${tpl.id} @ ${density}`).toBeGreaterThanOrEqual(9);
        expect(pt, `${tpl.id} @ ${density}`).toBeLessThanOrEqual(12);
      }
    }
  });

  it("never scales the A4 page box", () => {
    // Only pt/px are scaled; mm defines the paper and must stay put.
    for (const density of ["compact", "spacious"]) {
      const html = buildCvHtml(parseCvData({ ...ENGLISH_CV, settings: { density } }), "classic-corporate");
      expect(html).toContain("width:210mm");
      expect(html).toContain("min-height:297mm");
    }
  });
});

describe("templates", () => {
  it("renders all five without throwing", () => {
    for (const tpl of TEMPLATES) {
      expect(() => buildCvHtml(parseCvData(ENGLISH_CV), tpl.id)).not.toThrow();
    }
    expect(TEMPLATES).toHaveLength(5);
  });

  it("maps every legacy template id onto a live one", () => {
    const legacy = {
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
    for (const [old, expected] of Object.entries(legacy)) {
      expect(resolveTemplateId(old), old).toBe(expected);
    }
  });

  it("never shows a raw slug for an unknown id", () => {
    expect(resolveTemplateId("nonsense")).toBeNull();
    expect(templateName("nonsense")).toBe("Classic Corporate");
    expect(templateName(undefined)).toBe("Classic Corporate");
  });

  it("gives print mode a smaller CSS padding than preview", () => {
    // Puppeteer applies part of the page margin itself, so the stylesheet
    // contributes only the remainder — that is what keeps the PDF and the
    // on-screen preview geometrically identical.
    const preview = buildCvHtml(parseCvData(ENGLISH_CV), "classic-corporate", { mode: "preview" });
    const print = buildCvHtml(parseCvData(ENGLISH_CV), "classic-corporate", { mode: "print" });
    expect(preview).toContain("padding:0.75in");
    expect(print).toContain("padding:0.35in");
  });
});

describe("free-text custom sections", () => {
  it("renders prose and preserves the user's line breaks", () => {
    const html = buildCvHtml(
      parseCvData({
        ...ENGLISH_CV,
        customSections: [{ title: "About", layout: "freeText", text: "Line one.\nLine two." }],
      }),
      "classic-corporate"
    );
    expect(html).toContain('class="free-text"');
    expect(html).toContain("white-space:pre-wrap");
    expect(headings(html)).toContain("About");
  });

  it("drops a custom section with no title", () => {
    const html = buildCvHtml(
      parseCvData({ ...ENGLISH_CV, customSections: [{ title: "", layout: "freeText", text: "orphan" }] }),
      "classic-corporate"
    );
    expect(html).not.toContain("orphan");
  });
});
