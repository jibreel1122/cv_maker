// Route protection via NextAuth.
//   - /dashboard and /build require any signed-in user.
//   - /admin requires the ADMIN or OWNER role.
// Unauthenticated users are redirected to /login.

import { withAuth } from "next-auth/middleware";

export default withAuth({
  pages: { signIn: "/login" },
  callbacks: {
    authorized: ({ token, req }) => {
      const { pathname } = req.nextUrl;
      if (pathname.startsWith("/admin")) {
        return token?.role === "ADMIN" || token?.role === "OWNER";
      }
      return !!token;
    },
  },
});

export const config = {
  matcher: ["/dashboard/:path*", "/build/:path*", "/admin/:path*", "/settings/:path*"],
};
