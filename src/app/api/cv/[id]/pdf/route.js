import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { isAdmin } from "@/lib/auth";
import { buildCvHtml } from "@/lib/cvTemplates";
import { htmlToPdf } from "@/lib/pdf";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// Rendering a PDF through Chrome can take a few seconds.
export const maxDuration = 60;

function json(body, status) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

// GET /api/cv/[id]/pdf — generate and download a CV as a PDF.
// Allowed for the CV owner or any admin/owner.
export async function GET(request, { params }) {
  const user = await getCurrentUser();
  if (!user) return json({ error: "Unauthorized." }, 401);

  const cv = await prisma.cV.findUnique({ where: { id: params.id } });
  if (!cv) return json({ error: "CV not found." }, 404);

  if (cv.userId !== user.id && !isAdmin(user.role)) {
    return json({ error: "Forbidden." }, 403);
  }

  let cvData;
  try {
    cvData = JSON.parse(cv.data);
  } catch {
    return json({ error: "CV data is corrupted." }, 500);
  }

  try {
    const html = buildCvHtml(cvData, cv.templateId);
    const pdf = await htmlToPdf(html);

    const rawName = (cv.fullName || cv.title || "cv").slice(0, 40);
    const asciiName =
      rawName.replace(/[^A-Za-z0-9_-]+/g, "_").replace(/^_+|_+$/g, "") || "cv";
    const utf8Name = encodeURIComponent(`${rawName}.pdf`);
    const disposition = `attachment; filename="${asciiName}.pdf"; filename*=UTF-8''${utf8Name}`;

    return new Response(pdf, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": disposition,
        "Cache-Control": "no-store",
      },
    });
  } catch (e) {
    console.error("PDF generation error:", e);
    return json({ error: "Could not generate the PDF." }, 500);
  }
}
