// Shared server-side plumbing for every CV download format.
//
// PDF, Word and LaTeX all need the same four things before they can render:
// an authenticated caller, a rate-limit check, the CV row, and a permission
// verdict on it. They differ only in what they produce and what they call the
// file — so that part lives in each route.

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { canAccessCv } from "@/lib/permissions";
import { hit } from "@/lib/rateLimit";

export function json(body, status, headers = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...headers },
  });
}

// Loads a CV for download, or returns the Response to send instead.
//
//   bucket  rate-limit namespace, so an expensive format cannot exhaust the
//           allowance of a cheap one
//   max / windowMs  the allowance for this format
export async function loadCvForDownload(id, { bucket, max, windowMs }) {
  const user = await getCurrentUser();
  if (!user) return { error: json({ error: "Unauthorized." }, 401) };

  // Keyed by account, not IP: the caller is authenticated here, so the user id
  // is both more accurate and impossible to rotate by changing networks.
  const rl = hit(`${bucket}:${user.id}`, max, windowMs);
  if (rl.limited) {
    return {
      error: json({ error: "Too many downloads. Please wait a moment." }, 429, {
        "Retry-After": String(rl.retryAfterSeconds),
      }),
    };
  }

  const cv = await prisma.cV.findUnique({ where: { id } });
  const verdict = canAccessCv({ cv, user });
  if (!verdict.allowed) {
    return {
      error:
        verdict.reason === "not-found"
          ? json({ error: "CV not found." }, 404)
          : json({ error: "Forbidden." }, 403),
    };
  }

  let cvData;
  try {
    cvData = JSON.parse(cv.data);
  } catch {
    return { error: json({ error: "CV data is corrupted." }, 500) };
  }

  return { cv, cvData };
}

// Content-Disposition for a download, carrying both an ASCII-safe fallback and
// the real (possibly Arabic) name — a bare Arabic filename is mangled or
// rejected by some browsers.
export function downloadHeaders(cv, extension, contentType) {
  const rawName = (cv.fullName || cv.title || "cv").slice(0, 40);
  const asciiName =
    rawName.replace(/[^A-Za-z0-9_-]+/g, "_").replace(/^_+|_+$/g, "") || "cv";
  const utf8Name = encodeURIComponent(`${rawName}.${extension}`);

  return {
    "Content-Type": contentType,
    "Content-Disposition": `attachment; filename="${asciiName}.${extension}"; filename*=UTF-8''${utf8Name}`,
    "Cache-Control": "no-store",
  };
}
