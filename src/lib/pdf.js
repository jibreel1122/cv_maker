// PDF generation via Puppeteer (headless Chrome).
//
// We render the exact same HTML used for the live preview and convert it to a
// PDF, which guarantees the file matches what the user sees in the browser.
//
// Deployment note: on serverless platforms (e.g. Vercel) replace `puppeteer`
// with `puppeteer-core` + `@sparticuz/chromium` (see the README).

import puppeteer from "puppeteer";

export async function htmlToPdf(html) {
  const browser = await puppeteer.launch({
    headless: "new",
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--font-render-hinting=none",
    ],
  });

  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0", timeout: 30000 });

    // Wait for web fonts so the PDF does not fall back to a default font.
    await page.evaluateHandle("document.fonts.ready");

    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      preferCSSPageSize: true,
      margin: { top: "0", right: "0", bottom: "0", left: "0" },
    });

    return pdf;
  } finally {
    await browser.close();
  }
}
