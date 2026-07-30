// Font delivery for the CV document.
//
// The two consumers need the same font by different routes:
//
//   preview  an iframe in the browser, which can fetch /fonts/*.woff2 normally
//   print    a Puppeteer page created with setContent(), which has no base URL
//            and should not depend on the app being reachable from itself
//
// So the preview gets a URL and the PDF gets the same file inlined as base64.
// The inlining lives in `cvFonts.server.js`: it reads from disk, and keeping it
// out of this module means a client component importing the preview helper
// never drags `node:fs` — or 65KB of font bytes — into the browser bundle.

import { NON_LATIN_STACK } from "@/lib/cvTemplateMeta";

export const FONT_FILES = {
  arabic: "cairo-arabic.woff2",
  latin: "cairo-latin.woff2",
};

// unicode-range keeps the browser from downloading the Arabic subset for an
// English CV, and vice versa.
export const UNICODE_RANGES = {
  arabic:
    "U+0600-06FF, U+0750-077F, U+0870-088E, U+0890-0891, U+0898-08E1, U+08E3-08FF, U+200C-200E, U+2010-2011, U+204F, U+2E41, U+FB50-FDFF, U+FE70-FEFF",
  latin:
    "U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD",
};

export function faceCss(src, subset) {
  return `@font-face{font-family:'Cairo';font-style:normal;font-weight:400 700;font-display:block;src:url(${src}) format('woff2');unicode-range:${UNICODE_RANGES[subset]};}`;
}

// @font-face rules pointing at the public files. Used by the live preview.
export function fontFaceCssForPreview() {
  return Object.entries(FONT_FILES)
    .map(([subset, file]) => faceCss(`/fonts/${file}`, subset))
    .join("");
}

export { NON_LATIN_STACK };
