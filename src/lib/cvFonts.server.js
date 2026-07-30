// Server-only half of the CV font pipeline: inlines the vendored woff2 files as
// base64 so Puppeteer renders Arabic without a network round-trip — and without
// depending on the host having an Arabic system font, which the render container
// does not.
//
// Kept separate from `cvFonts.js` so that `node:fs` and the font bytes never
// enter a client bundle.

import fs from "node:fs";
import path from "node:path";
import { FONT_FILES, faceCss } from "@/lib/cvFonts";

let cached = null;

export function fontFaceCssForPrint() {
  // Read once per process: the files never change at runtime, and every PDF
  // request would otherwise re-read and re-encode ~65KB.
  if (cached !== null) return cached;

  const dir = path.join(process.cwd(), "public", "fonts");
  cached = Object.entries(FONT_FILES)
    .map(([subset, file]) => {
      try {
        const base64 = fs.readFileSync(path.join(dir, file)).toString("base64");
        return faceCss(`data:font/woff2;base64,${base64}`, subset);
      } catch (e) {
        // A missing font file must not break PDF generation. Arabic then falls
        // back to whatever the system offers, which is worse but not fatal.
        console.error(`[cvFonts] could not inline ${file}:`, e?.message || e);
        return "";
      }
    })
    .join("");

  return cached;
}
