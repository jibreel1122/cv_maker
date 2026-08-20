// The three download formats and the model they share.
//
// The point of every assertion here is agreement: whatever the preview shows,
// the PDF, the Word file and the LaTeX source must show too — same sections, in
// the same order, with the same headings, dates and line breaks.

import { describe, it, expect } from "vitest";
import { buildCvModel } from "@/lib/cvDocModel";
import { buildCvHtml } from "@/lib/cvTemplates";
import { cvToDocx } from "@/lib/cvDocx";
import { cvToLatex, tex } from "@/lib/cvLatex";
import { parseCvData } from "@/lib/validations/cv";
import { TEMPLATES } from "@/lib/cvTemplateMeta";
import { majorOptions, majorGroups, majorCount } from "@/lib/cvMajors";
// JSZip ships with `docx` — the same library it packs the .docx with, so a
// test can unpack one without adding a dependency of its own.
import JSZip from "jszip";

const CV = {
  settings: { language: "en", density: "standard" },
  personal: {
    fullName: "Layla Khalil",
    jobTitle: "Frontend Developer\nBSc in Computer Engineering",
    email: "layla@email.com",
    phone: "+970 59 000 0000",
  },
  summary: "Frontend developer with four years of experience.",
  experiences: [
    {
      jobTitle: "Senior Developer",
      company: "Tech Solutions",
      location: "Ramallah",
      startDate: "2022",
      current: true,
      bullets: ["Led a rebuild.\nAcross two teams.", "Mentored 3 developers."],
    },
  ],
  education: [
    {
      degree: "BSc in Computer Engineering\nMinor in Mathematics",
      institution: "Birzeit University",
      startDate: "2015",
      endDate: "2019",
      details: "GPA 3.8",
    },
  ],
  skills: ["React", "TypeScript"],
  languages: [{ name: "Arabic", level: "Native" }],
  certifications: [{ name: "Meta Front-End", issuer: "Coursera", date: "2023" }],
  customSections: [
    { title: "Projects", layout: "entries", items: [{ title: "Library", dateRange: "2023", descriptionBullets: ["Shipped it."] }], text: "" },
    { title: "Notes", layout: "freeText", items: [], text: "Line one.\nLine two." },
  ],
};

async function docxFiles(buffer) {
  const zip = await JSZip.loadAsync(buffer);
  return zip;
}

async function docxText(buffer) {
  const zip = await docxFiles(buffer);
  return zip.file("word/document.xml").async("string");
}

describe("the document model", () => {
  it("follows the template's section order", () => {
    for (const tpl of TEMPLATES) {
      const model = buildCvModel(CV, tpl.id);
      const keys = model.sections.map((s) => s.key.replace(/-\d+$/, ""));
      const expected = tpl.order.flatMap((key) =>
        key === "custom" ? ["custom", "custom"] : [key]
      );
      expect(keys).toEqual(expected);
    }
  });

  it("puts the same headings on the model as the HTML renders", () => {
    const model = buildCvModel(CV, "classic-corporate");
    const html = buildCvHtml(CV, "classic-corporate");
    const rendered = [...html.matchAll(/class="section-title">([^<]+)</g)].map((m) => m[1]);
    expect(rendered).toEqual(model.sections.map((s) => s.title));
  });

  it("honours a renamed section heading", () => {
    const model = buildCvModel(
      { ...CV, sectionTitles: { experience: "Relevant Experience" } },
      "classic-corporate"
    );
    expect(model.sections.find((s) => s.key === "experience").title).toBe(
      "Relevant Experience"
    );
  });

  it("normalises Windows line endings so every format breaks in the same place", () => {
    const model = buildCvModel(
      { ...CV, personal: { ...CV.personal, jobTitle: "One\r\nTwo" } },
      "classic-corporate"
    );
    expect(model.header.jobTitle).toBe("One\nTwo");
  });

  it("drops empty entries and untitled custom sections", () => {
    const model = buildCvModel(
      {
        ...CV,
        experiences: [{ jobTitle: "", company: "", bullets: ["", ""] }],
        customSections: [{ title: "", layout: "entries", items: [{ title: "x" }] }],
      },
      "classic-corporate"
    );
    expect(model.sections.some((s) => s.key === "experience")).toBe(false);
    expect(model.sections.some((s) => s.key.startsWith("custom"))).toBe(false);
  });

  it("never throws on malformed data", () => {
    for (const bad of [null, undefined, 42, "text", [], { personal: "x", skills: 1 }]) {
      expect(() => buildCvModel(bad, "classic-corporate")).not.toThrow();
    }
  });
});

describe("multi-line values", () => {
  it("survive validation intact", () => {
    const parsed = parseCvData(CV);
    expect(parsed.personal.jobTitle).toBe("Frontend Developer\nBSc in Computer Engineering");
    expect(parsed.education[0].degree).toContain("\n");
    expect(parsed.experiences[0].bullets[0]).toContain("\n");
  });

  it("are preserved in the HTML, which sets them with pre-wrap", () => {
    const html = buildCvHtml(CV, "classic-corporate");
    expect(html).toContain("Frontend Developer\nBSc in Computer Engineering");
    expect(html).toMatch(/\.name,\.job-title[^{]*\{white-space:pre-wrap/);
  });

  it("become real line breaks in Word", async () => {
    const xml = await docxText(await cvToDocx(CV, "classic-corporate"));
    expect(xml).toContain("<w:br/>");
    expect(xml).toContain("BSc in Computer Engineering");
  });

  it("become explicit breaks in LaTeX, and a blank line becomes a paragraph", () => {
    const source = cvToLatex(CV, "classic-corporate");
    expect(source).toContain("Frontend Developer\\\\\nBSc in Computer Engineering");
    expect(tex("a\n\nb")).toBe("a\n\nb");
    expect(tex("a\nb")).toBe("a\\\\\nb");
  });
});

describe("the Word export", () => {
  it("produces a valid OOXML package for every template", async () => {
    for (const tpl of TEMPLATES) {
      const zip = await docxFiles(await cvToDocx(CV, tpl.id));
      expect(zip.file("word/document.xml")).toBeTruthy();
      expect(zip.file("[Content_Types].xml")).toBeTruthy();
      const xml = await zip.file("word/document.xml").async("string");
      expect(xml.startsWith("<?xml")).toBe(true);
    }
  });

  it("carries every section heading and entry", async () => {
    const xml = await docxText(await cvToDocx(CV, "classic-corporate"));
    for (const heading of ["PROFESSIONAL SUMMARY", "WORK EXPERIENCE", "PROJECTS", "NOTES"]) {
      expect(xml).toContain(heading);
    }
    expect(xml).toContain("Senior Developer");
    expect(xml).toContain("2022 — Present");
    expect(xml).toContain("Tech Solutions — Ramallah");
  });

  it("sets an A4 page with the same margins as the PDF", async () => {
    const xml = await docxText(await cvToDocx(CV, "classic-corporate"));
    // 0.75in = 1080 twips; A4 = 11909 x 16834 twips.
    expect(xml).toContain('w:top="1080"');
    expect(xml).toContain('w:w="11909"');
  });

  it("uses the template's own font and accent colour", async () => {
    const xml = await docxText(await cvToDocx(CV, "academic"));
    expect(xml).toContain('w:ascii="Garamond"');
    expect(xml).toContain('w:val="111827"');
  });

  it("marks an Arabic CV right-to-left", async () => {
    const xml = await docxText(
      await cvToDocx({ ...CV, settings: { language: "ar" } }, "classic-corporate")
    );
    expect(xml).toContain("<w:bidi/>");
    expect(xml).toContain('w:ascii="Cairo"');
  });

  it("never throws on malformed data", async () => {
    await expect(cvToDocx(null, "classic-corporate")).resolves.toBeTruthy();
    await expect(cvToDocx({ skills: 3 }, "nope")).resolves.toBeTruthy();
  });
});

describe("the LaTeX export", () => {
  it("is a complete document for every template", () => {
    for (const tpl of TEMPLATES) {
      const source = cvToLatex(CV, tpl.id);
      expect(source).toContain("\\documentclass[a4paper]{article}");
      expect(source).toContain("\\begin{document}");
      expect(source.trimEnd().endsWith("\\end{document}")).toBe(true);
      expect(source).toContain("\\usepackage[margin=0.75in]{geometry}");
    }
  });

  it("escapes LaTeX syntax in user text exactly once", () => {
    expect(tex("100% & {ok} #1 _x_ $5 ~ ^")).toBe(
      "100\\% \\& \\{ok\\} \\#1 \\_x\\_ \\$5 \\textasciitilde{} \\textasciicircum{}"
    );
    expect(tex("C:\\path")).toBe("C:\\textbackslash{}path");
  });

  it("switches to a Unicode engine for Arabic", () => {
    const source = cvToLatex({ ...CV, settings: { language: "ar" } }, "classic-corporate");
    expect(source).toContain("xelatex");
    expect(source).toContain("\\usepackage{polyglossia}");
    expect(source).toContain("\\begin{arabic}");
  });

  it("keeps every section, in order", () => {
    const model = buildCvModel(CV, "executive");
    const source = cvToLatex(CV, "executive");
    let cursor = 0;
    for (const section of model.sections) {
      const at = source.indexOf(`{${section.title}}`, cursor);
      expect(at).toBeGreaterThan(-1);
      cursor = at;
    }
  });

  it("never throws on malformed data", () => {
    for (const bad of [null, { summary: {} }, []]) {
      expect(() => cvToLatex(bad, "classic-corporate")).not.toThrow();
    }
  });
});

describe("the majors catalogue", () => {
  it("offers a substantial, de-duplicated list in both languages", () => {
    expect(majorCount()).toBeGreaterThan(120);
    for (const locale of ["en", "ar"]) {
      const options = majorOptions(locale);
      expect(options.length).toBe(new Set(options).size);
      expect(options.every((m) => typeof m === "string" && m.length > 1)).toBe(true);
    }
  });

  it("translates every major, so neither language has gaps", () => {
    expect(majorOptions("en").length).toBe(majorCount());
    expect(majorOptions("ar").length).toBe(majorCount());
  });

  it("groups them for the picker and falls back to English for an unknown locale", () => {
    const groups = majorGroups("fr");
    expect(groups.length).toBeGreaterThan(5);
    expect(groups[0].majors).toContain("Computer Engineering");
  });
});
