// توليد PDF عبر Puppeteer (headless Chrome).
//
// نعرض نفس HTML الخاص بالمعاينة ونحوّله إلى PDF — ما يضمن ظهور النص العربي
// (التشكيل/الربط بين الحروف) بشكل سليم تمامًا كما في المتصفح. لا نستخدم
// مكتبات مثل jsPDF/react-pdf لأنها لا تدعم تشكيل العربية بشكل صحيح.
//
// ملاحظة نشر: على بيئات serverless (Vercel) استبدل puppeteer بـ
// puppeteer-core + @sparticuz/chromium (موضّح في README).

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

    // ننتظر تحميل الخطوط لضمان عدم ظهور خط بديل في الـ PDF.
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
