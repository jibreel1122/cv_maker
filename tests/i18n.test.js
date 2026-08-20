// A missing Arabic string silently falls back to English at runtime, which is
// the right behaviour in production and exactly why a gap can go unnoticed for
// months. This test makes the gap fail the build instead.

import { describe, it, expect } from "vitest";
import en from "@/lib/i18n/en";
import ar from "@/lib/i18n/ar";
import { createTranslator } from "@/lib/i18n";

function paths(node, prefix = "") {
  if (node === null || typeof node !== "object") return [prefix];
  if (Array.isArray(node)) return node.flatMap((v, i) => paths(v, `${prefix}[${i}]`));
  return Object.entries(node).flatMap(([key, value]) =>
    paths(value, prefix ? `${prefix}.${key}` : key)
  );
}

describe("translations", () => {
  it("cover the same keys in both languages", () => {
    const inEnglish = paths(en);
    const inArabic = paths(ar);
    expect(inArabic.filter((p) => !inEnglish.includes(p))).toEqual([]);
    expect(inEnglish.filter((p) => !inArabic.includes(p))).toEqual([]);
  });

  it("interpolate variables in both languages", () => {
    for (const locale of ["en", "ar"]) {
      const t = createTranslator(locale);
      expect(t("builder.majors.browse", { n: 42 })).toContain("42");
      expect(t("dashboard.updated", { date: "1 May" })).toContain("1 May");
    }
  });

  it("name all three download formats", () => {
    for (const locale of ["en", "ar"]) {
      const t = createTranslator(locale);
      for (const key of ["download.button", "download.pdf", "download.word", "download.latex"]) {
        expect(t(key)).not.toBe(key);
      }
    }
  });
});
