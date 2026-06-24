import { NextResponse } from "next/server";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/auth";

// يحمي مسارات /admin/* (عدا /admin/login). يتحقق من كوكي الجلسة الموقّعة،
// ويعيد التوجيه لصفحة الدخول إن لم تكن صالحة.
export async function middleware(request) {
  const { pathname } = request.nextUrl;

  // نسمح بصفحة الدخول دون تحقق.
  if (pathname.startsWith("/admin/login")) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/admin")) {
    const token = request.cookies.get(SESSION_COOKIE)?.value;
    const valid = await verifySessionToken(token);
    if (!valid) {
      const url = request.nextUrl.clone();
      url.pathname = "/admin/login";
      url.searchParams.set("from", pathname);
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
