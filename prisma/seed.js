// Seeds the first OWNER account from environment variables.
//
//   OWNER_EMAIL / OWNER_PASSWORD / OWNER_NAME
//
// Running it again is safe: it upserts the account, refreshes the password,
// and makes sure the role is OWNER. Run with:  npm run db:seed

const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

// Load .env.local then .env (mirrors how Next.js resolves variables locally).
try {
  require("fs")
    .readFileSync(require("path").join(__dirname, "..", ".env.local"), "utf8")
    .split("\n")
    .forEach((line) => {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (m && !process.env[m[1]]) {
        process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
      }
    });
} catch {
  // .env.local is optional.
}

const prisma = new PrismaClient();

async function main() {
  const email = (process.env.OWNER_EMAIL || "jibreelebornat@gmail.com").trim().toLowerCase();
  const password = process.env.OWNER_PASSWORD || "Miskbo123";
  const name = process.env.OWNER_NAME || "Owner";

  // Salt rounds = 12 (>= 12).
  const passwordHash = await bcrypt.hash(password, 12);
  const now = new Date();

  const user = await prisma.user.upsert({
    where: { email },
    // The owner is pre-verified so they can sign in immediately.
    update: { role: "OWNER", passwordHash, name, emailVerified: now },
    create: { email, name, passwordHash, role: "OWNER", emailVerified: now },
  });

  console.log(`✔ Owner account ready: ${user.email} (role: ${user.role})`);
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
