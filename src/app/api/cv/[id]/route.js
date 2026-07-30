import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { isAdmin } from "@/lib/auth";
import { sameOrigin } from "@/lib/security";
import { validateCvData, extractCvMeta, parseCvData } from "@/lib/validations/cv";
import { resolveTemplateId } from "@/lib/cvTemplates";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Loads a CV and checks the caller may access it (owner, or any admin).
async function loadAuthorized(id, user, { adminAllowed = true } = {}) {
  const cv = await prisma.cV.findUnique({ where: { id } });
  if (!cv) return { error: "CV not found.", status: 404 };
  const owns = cv.userId === user.id;
  const elevated = adminAllowed && isAdmin(user.role);
  if (!owns && !elevated) return { error: "Forbidden.", status: 403 };
  return { cv, owns };
}

// GET /api/cv/[id] — fetch a single CV (owner or admin).
export async function GET(request, { params }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const res = await loadAuthorized(params.id, user);
  if (res.error) return NextResponse.json({ error: res.error }, { status: res.status });

  // Normalise on read too: records written before the schema existed may hold
  // fields the builder and preview would otherwise choke on.
  let data;
  try {
    data = parseCvData(JSON.parse(res.cv.data));
  } catch {
    data = parseCvData(null);
  }

  return NextResponse.json({
    id: res.cv.id,
    title: res.cv.title,
    templateId: res.cv.templateId,
    data,
    updatedAt: res.cv.updatedAt,
  });
}

// PUT /api/cv/[id] — update a CV (owner only).
export async function PUT(request, { params }) {
  if (!sameOrigin(request)) {
    return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
  }

  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const res = await loadAuthorized(params.id, user, { adminAllowed: false });
  if (res.error) return NextResponse.json({ error: res.error }, { status: res.status });

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

  const tpl = resolveTemplateId(templateId) || resolveTemplateId(res.cv.templateId) || res.cv.templateId;
  const meta = extractCvMeta(validated.data);
  const cvTitle =
    (typeof title === "string" && title.trim()) || meta.fullName || res.cv.title;

  await prisma.cV.update({
    where: { id: params.id },
    data: {
      title: cvTitle.slice(0, 120),
      templateId: tpl,
      data: JSON.stringify(validated.data),
      fullName: meta.fullName,
      jobTitle: meta.jobTitle,
    },
  });

  return NextResponse.json({ ok: true });
}

// DELETE /api/cv/[id] — delete a CV (owner, or admin).
export async function DELETE(request, { params }) {
  if (!sameOrigin(request)) {
    return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
  }

  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const res = await loadAuthorized(params.id, user);
  if (res.error) return NextResponse.json({ error: res.error }, { status: res.status });

  await prisma.cV.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
