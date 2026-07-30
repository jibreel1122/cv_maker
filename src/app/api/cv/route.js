import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { sameOrigin } from "@/lib/security";
import { validateCvData, extractCvMeta } from "@/lib/validations/cv";
import { resolveTemplateId, DEFAULT_TEMPLATE_ID } from "@/lib/cvTemplates";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/cv — list the signed-in user's CVs.
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const cvs = await prisma.cV.findMany({
    where: { userId: user.id },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      title: true,
      templateId: true,
      fullName: true,
      jobTitle: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return NextResponse.json({ cvs });
}

// POST /api/cv — create a new CV for the signed-in user.
export async function POST(request) {
  if (!sameOrigin(request)) {
    return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
  }

  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const { cvData, templateId, title } = body || {};
  const validated = validateCvData(cvData);
  if (!validated.ok) {
    return NextResponse.json({ error: validated.error }, { status: 400 });
  }

  const tpl = resolveTemplateId(templateId) || DEFAULT_TEMPLATE_ID;
  const meta = extractCvMeta(validated.data);
  const cvTitle =
    (typeof title === "string" && title.trim()) || meta.fullName || "Untitled CV";

  const cv = await prisma.cV.create({
    data: {
      userId: user.id,
      title: cvTitle.slice(0, 120),
      templateId: tpl,
      // Store the normalised form so every reader gets a known-good shape.
      data: JSON.stringify(validated.data),
      fullName: meta.fullName,
      jobTitle: meta.jobTitle,
    },
    select: { id: true },
  });

  return NextResponse.json({ id: cv.id });
}
