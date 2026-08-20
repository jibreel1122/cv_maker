import { buildCvHtml } from "@/lib/cvTemplates";
import { htmlToPdf } from "@/lib/pdf";
import { fontFaceCssForPrint } from "@/lib/cvFonts.server";
import { json, loadCvForDownload, downloadHeaders } from "@/lib/cvExport.server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// Rendering a PDF through Chrome can take a few seconds.
export const maxDuration = 60;

// Each PDF costs a Chrome tab and a second or two of CPU, so this is the most
// expensive endpoint in the app. 20 per 5 minutes is far above normal use
// (download, tweak, download again) but stops a loop from exhausting the render
// pool for everyone else.
const PDF_MAX = 20;
const PDF_WINDOW_MS = 5 * 60 * 1000;

// GET /api/cv/[id]/pdf — generate and download a CV as a PDF.
// Allowed for the CV owner or any admin/owner.
export async function GET(request, { params }) {
  const loaded = await loadCvForDownload(params.id, {
    bucket: "pdf",
    max: PDF_MAX,
    windowMs: PDF_WINDOW_MS,
  });
  if (loaded.error) return loaded.error;

  try {
    // "print" mode assumes Puppeteer applies part of the page margin itself, so
    // the PDF comes out geometrically identical to the on-screen preview.
    const html = buildCvHtml(loaded.cvData, loaded.cv.templateId, {
      mode: "print",
      // Inlined as base64 so Chrome never makes a network request mid-render,
      // and so an Arabic CV is not rendered as tofu on a host with no Arabic
      // system font.
      fontFaceCss: fontFaceCssForPrint(),
    });
    const pdf = await htmlToPdf(html);

    return new Response(pdf, {
      status: 200,
      headers: downloadHeaders(loaded.cv, "pdf", "application/pdf"),
    });
  } catch (e) {
    console.error("PDF generation error:", e);
    return json({ error: "Could not generate the PDF." }, 500);
  }
}
