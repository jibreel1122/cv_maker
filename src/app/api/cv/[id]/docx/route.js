import { cvToDocx } from "@/lib/cvDocx";
import { json, loadCvForDownload, downloadHeaders } from "@/lib/cvExport.server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Building OOXML is pure CPU with no browser involved — orders of magnitude
// cheaper than the PDF route — so the allowance is correspondingly generous.
const DOCX_MAX = 60;
const DOCX_WINDOW_MS = 5 * 60 * 1000;

const DOCX_TYPE =
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

// GET /api/cv/[id]/docx — download a CV as an editable Word document.
// Allowed for the CV owner or any admin/owner.
export async function GET(request, { params }) {
  const loaded = await loadCvForDownload(params.id, {
    bucket: "docx",
    max: DOCX_MAX,
    windowMs: DOCX_WINDOW_MS,
  });
  if (loaded.error) return loaded.error;

  try {
    const buffer = await cvToDocx(loaded.cvData, loaded.cv.templateId);
    return new Response(buffer, {
      status: 200,
      headers: downloadHeaders(loaded.cv, "docx", DOCX_TYPE),
    });
  } catch (e) {
    console.error("DOCX generation error:", e);
    return json({ error: "Could not generate the Word file." }, 500);
  }
}
