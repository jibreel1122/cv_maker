# Bundled fonts

`cairo-arabic.woff2` / `cairo-latin.woff2` — Google's **Cairo**, split into the
Arabic and Latin subsets. Licensed under the SIL Open Font License 1.1.

They are vendored rather than loaded from Google Fonts so that:

- the preview and the PDF use byte-identical fonts,
- PDF generation needs no outbound network call, and
- no visitor data is sent to a third-party font CDN.

The container running Puppeteer has no Arabic system font, so without these an
Arabic CV renders as tofu boxes. `src/lib/cvFonts.js` inlines them as base64 for
the PDF and serves them by URL for the on-screen preview.
