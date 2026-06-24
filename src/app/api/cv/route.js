import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { extractMeta } from "@/lib/cvDefaults";
import { TEMPLATES } from "@/lib/cvTemplates";

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
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const { cvData, templateId, title } = body || {};
  if (!cvData || typeof cvData !== "object") {
    return NextResponse.json({ error: "CV data is missing." }, { status: 400 });
  }
  const tpl = TEMPLATES.some((t) => t.id === templateId) ? templateId : "classic";
  const meta = extractMeta(cvData);

  const cv = await prisma.cV.create({
    data: {
      userId: user.id,
      title: (title || meta.fullName || "Untitled CV").slice(0, 120),
      templateId: tpl,
      data: JSON.stringify(cvData),
      fullName: meta.fullName,
      jobTitle: meta.jobTitle,
    },
    select: { id: true },
  });

  return NextResponse.json({ id: cv.id });
}
