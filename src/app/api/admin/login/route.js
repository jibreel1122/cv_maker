import { NextResponse } from "next/server";
import { createSessionToken, SESSION_COOKIE, sessionCookieOptions } from "@/lib/auth";

export const runtime = "nodejs";

// تسجيل دخول الأدمن بكلمة سر واحدة من متغير البيئة ADMIN_PASSWORD.
export async function POST(request) {
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword) {
    return NextResponse.json(
      { error: "لم يتم ضبط ADMIN_PASSWORD في متغيرات البيئة." },
      { status: 500 }
    );
  }

  let password;
  try {
    const body = await request.json();
    password = body?.password;
  } catch {
    return NextResponse.json({ error: "طلب غير صالح." }, { status: 400 });
  }

  if (!password || password !== adminPassword) {
    return NextResponse.json({ error: "كلمة السر غير صحيحة." }, { status: 401 });
  }

  const token = await createSessionToken();
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, token, sessionCookieOptions());
  return res;
}
