// Server-side session helpers for API routes and server components.

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export function auth() {
  return getServerSession(authOptions);
}

// Returns the session if the user is signed in, otherwise null.
export async function getCurrentUser() {
  const session = await auth();
  return session?.user || null;
}

// Returns the current user only if they hold one of the allowed roles.
// Otherwise returns null — callers respond with 401/403 accordingly.
export async function requireRole(roles) {
  const user = await getCurrentUser();
  if (!user) return null;
  if (roles && !roles.includes(user.role)) return null;
  return user;
}
