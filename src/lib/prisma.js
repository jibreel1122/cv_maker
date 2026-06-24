import { PrismaClient } from "@prisma/client";

// نمنع إنشاء أكثر من PrismaClient أثناء التطوير (Hot Reload).
const globalForPrisma = globalThis;

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
