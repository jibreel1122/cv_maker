// NextAuth configuration — the single source of truth for authentication.
//
// Providers:
//   - Credentials : email + password only. This is the ONLY sign-in method.
//                   No external OAuth (Google/Apple) or third-party services.
//
// We use the JWT session strategy (required so the Credentials provider works)
// together with the Prisma adapter.

import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { hit, peek, reset, clientIp } from "@/lib/rateLimit";
import { logAudit } from "@/lib/audit";
import { isEmailVerificationEnabled } from "@/lib/mailer";

// Roles, ordered from least to most privileged.
export const ROLES = ["USER", "ADMIN", "OWNER"];

// Failed-login rate limit: 5 attempts per IP per 15 minutes.
const LOGIN_MAX = 5;
const LOGIN_WINDOW_MS = 15 * 60 * 1000;

// Thrown error codes surfaced to the sign-in UI via `res.error`.
export const AUTH_ERRORS = {
  RATE_LIMITED: "Too many attempts. Try again in 15 minutes.",
  // Only ever shown while verification is enabled, i.e. when an email was sent.
  EMAIL_NOT_VERIFIED:
    "Please verify your email first — check your inbox for the verification link we sent you.",
};

function buildProviders() {
  return [
    CredentialsProvider({
      name: "Email",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, req) {
        const email = credentials?.email?.trim().toLowerCase();
        const password = credentials?.password;
        if (!email || !password) return null;

        const ip = clientIp(req?.headers || {});
        const rlKey = `login:${ip}`;

        // Block before doing any work if this IP is already over the limit.
        if (peek(rlKey, LOGIN_MAX).limited) {
          throw new Error(AUTH_ERRORS.RATE_LIMITED);
        }

        const user = await prisma.user.findUnique({ where: { email } });
        const valid =
          user && user.passwordHash && (await bcrypt.compare(password, user.passwordHash));

        if (!valid) {
          const res = hit(rlKey, LOGIN_MAX, LOGIN_WINDOW_MS);
          await logAudit("LOGIN_FAILED", {
            userId: user?.id || null,
            metadata: { email, ip, reason: "bad_credentials" },
          });
          if (res.limited) throw new Error(AUTH_ERRORS.RATE_LIMITED);
          return null;
        }

        // Email/password accounts must verify their email before signing in —
        // but only while verification is actually running. If it is switched
        // off, accounts created back when it was on would otherwise stay locked
        // out with no way to confirm their address.
        if (isEmailVerificationEnabled() && !user.emailVerified) {
          await logAudit("LOGIN_FAILED", {
            userId: user.id,
            metadata: { email, ip, reason: "email_not_verified" },
          });
          throw new Error(AUTH_ERRORS.EMAIL_NOT_VERIFIED);
        }

        reset(rlKey);
        await logAudit("LOGIN_SUCCESS", { userId: user.id, metadata: { email, ip } });

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
          role: user.role,
        };
      },
    }),
  ];
}

export const authOptions = {
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: buildProviders(),
  callbacks: {
    async jwt({ token, user }) {
      // On initial sign-in `user` is present; persist the id on the token.
      if (user) {
        token.uid = user.id;
      }
      // Always refresh the role from the database so role changes made by an
      // admin take effect on the user's next request without re-login. If the
      // user no longer exists (deleted account), invalidate the token so the
      // stale JWT stops resolving to a session server-side.
      if (token.uid) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.uid },
          select: { role: true, name: true, image: true },
        });
        if (dbUser) {
          token.role = dbUser.role;
          token.name = dbUser.name;
          token.picture = dbUser.image;
        } else {
          token.uid = null;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (!token.uid) {
        // Deleted/invalid user — return a session with no user.
        return { ...session, user: undefined };
      }
      if (session.user) {
        session.user.id = token.uid;
        session.user.role = token.role || "USER";
      }
      return session;
    },
  },
};

export function isAdmin(role) {
  return role === "ADMIN" || role === "OWNER";
}

export function isOwner(role) {
  return role === "OWNER";
}

// Which roles a given actor is allowed to assign.
//   OWNER  → can set any role.
//   ADMIN  → can only toggle between USER and ADMIN.
export function assignableRoles(actorRole) {
  if (actorRole === "OWNER") return ["USER", "ADMIN", "OWNER"];
  if (actorRole === "ADMIN") return ["USER", "ADMIN"];
  return [];
}
