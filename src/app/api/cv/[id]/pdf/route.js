import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { isAdmin } from "@/lib/auth";
import { buildCvHtml } from "@/lib/cvTemplates";
import { htmlToPdf } from "@/lib/pdf";
import { fontFaceCssForPrint } from "@/lib/cvFonts.server";
import { hit } from "@/lib/rateLimit";

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

  // Keyed by account, not IP: the caller is authenticated here, so the user id
  // is both more accurate and impossible to rotate by changing networks.
  const rl = hit(`pdf:${user.id}`, PDF_MAX, PDF_WINDOW_MS);
  if (rl.limited) {
    return new Response(
      JSON.stringify({ error: "Too many PDF downloads. Please wait a moment." }),
      {
        status: 429,
        headers: {
          "Content-Type": "application/json",
          "Retry-After": String(rl.retryAfterSeconds),
        },
      }
    );
  }

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
    // "print" mode assumes Puppeteer applies part of the page margin itself, so
    // the PDF comes out geometrically identical to the on-screen preview.
    const html = buildCvHtml(cvData, cv.templateId, {
      mode: "print",
      // Inlined as base64 so Chrome never makes a network request mid-render,
      // and so an Arabic CV is not rendered as tofu on a host with no Arabic
      // system font.
      fontFaceCss: fontFaceCssForPrint(),
    });
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
