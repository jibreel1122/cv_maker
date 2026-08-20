import { cvToLatex } from "@/lib/cvLatex";
import { json, loadCvForDownload, downloadHeaders } from "@/lib/cvExport.server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Assembling a .tex file is string work — as cheap as the Word export.
const LATEX_MAX = 60;
const LATEX_WINDOW_MS = 5 * 60 * 1000;

// GET /api/cv/[id]/latex — download the CV as LaTeX source to compile or edit.
// Allowed for the CV owner or any admin/owner.
export async function GET(request, { params }) {
  const loaded = await loadCvForDownload(params.id, {
    bucket: "latex",
    max: LATEX_MAX,
    windowMs: LATEX_WINDOW_MS,
  });
  if (loaded.error) return loaded.error;

  try {
    const source = cvToLatex(loaded.cvData, loaded.cv.templateId);
    return new Response(source, {
      status: 200,
      headers: downloadHeaders(loaded.cv, "tex", "application/x-tex; charset=utf-8"),
    });
  } catch (e) {
    console.error("LaTeX generation error:", e);
    return json({ error: "Could not generate the LaTeX file." }, 500);
  }
}
