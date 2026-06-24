// NextAuth configuration — the single source of truth for authentication.
//
// Providers:
//   - Credentials : email + password (used by the normal register/login flow
//                   and by the seeded OWNER account).
//   - Google      : enabled automatically when GOOGLE_CLIENT_ID/SECRET are set.
//   - Apple       : enabled automatically when APPLE_ID/APPLE_CLIENT_SECRET set.
//
// We use the JWT session strategy (required so the Credentials provider works)
// together with the Prisma adapter, which still persists Google/Apple users.

import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import AppleProvider from "next-auth/providers/apple";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

// Roles, ordered from least to most privileged.
export const ROLES = ["USER", "ADMIN", "OWNER"];

function buildProviders() {
  const providers = [
    CredentialsProvider({
      name: "Email",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email?.trim().toLowerCase();
        const password = credentials?.password;
        if (!email || !password) return null;

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user || !user.passwordHash) return null;

        const ok = await bcrypt.compare(password, user.passwordHash);
        if (!ok) return null;

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

  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    providers.push(
      GoogleProvider({
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        allowDangerousEmailAccountLinking: true,
      })
    );
  }

  if (process.env.APPLE_ID && process.env.APPLE_CLIENT_SECRET) {
    providers.push(
      AppleProvider({
        clientId: process.env.APPLE_ID,
        clientSecret: process.env.APPLE_CLIENT_SECRET,
        allowDangerousEmailAccountLinking: true,
      })
    );
  }

  return providers;
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
      // admin take effect on the user's next request without re-login.
      if (token.uid) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.uid },
          select: { role: true, name: true, image: true },
        });
        if (dbUser) {
          token.role = dbUser.role;
          token.name = dbUser.name;
          token.picture = dbUser.image;
        }
      }
      return token;
    },
    async session({ session, token }) {
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
