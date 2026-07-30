// Seeds the database for local development. Safe to run repeatedly — every
// account is upserted and sample CVs are only created if the demo user has none.
//
//   - The OWNER account, from OWNER_EMAIL / OWNER_PASSWORD / OWNER_NAME.
//   - A couple of pre-verified demo users (local development only).
//   - A couple of sample CVs for one of the demo users.
//
// OWNER_EMAIL and OWNER_PASSWORD are REQUIRED and have no defaults. A seed that
// falls back to a hardcoded password creates a known-credential admin account on
// every deployment that runs it, so this fails loudly instead.
//
// Run automatically before `npm run dev`, or manually with:  npm run db:seed

const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

// Load .env.local then .env (mirrors how Next.js resolves variables locally).
for (const file of [".env.local", ".env"]) {
  try {
    require("fs")
      .readFileSync(require("path").join(__dirname, "..", file), "utf8")
      .split("\n")
      .forEach((line) => {
        const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
        if (m && !process.env[m[1]]) {
          process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
        }
      });
  } catch {
    // optional
  }
}

const prisma = new PrismaClient();

function meta(data) {
  const p = (data && data.personal) || {};
  return { fullName: p.fullName || null, jobTitle: p.jobTitle || null };
}

// Demo CV content (kept inline so the CommonJS seed stays dependency-free).
const sampleCvs = [
  {
    title: "Frontend Developer CV",
    templateId: "modern-professional",
    data: {
      personal: {
        fullName: "Layla A. Khalil",
        jobTitle: "Frontend Developer",
        email: "layla.khalil@email.com",
        phone: "+970 59 000 0000",
        location: "Ramallah, Palestine",
        linkedin: "linkedin.com/in/layla-khalil",
        website: "laylakhalil.dev",
      },
      summary:
        "Frontend developer with 4 years of experience building fast, accessible web apps with React and Next.js.",
      experiences: [
        {
          jobTitle: "Senior Frontend Developer",
          company: "Tech Solutions",
          location: "Ramallah",
          startDate: "2022",
          endDate: "",
          current: true,
          bullets: [
            "Led a rebuild of the main product UI, improving load speed by 40%.",
            "Mentored a team of 3 developers and set code-review standards.",
          ],
        },
      ],
      education: [
        {
          degree: "BSc in Software Engineering",
          institution: "Birzeit University",
          location: "Birzeit",
          startDate: "2015",
          endDate: "2019",
          details: "",
        },
      ],
      skills: ["JavaScript", "React", "Next.js", "TypeScript", "Tailwind CSS", "Git"],
      languages: [
        { name: "Arabic", level: "Native" },
        { name: "English", level: "Fluent" },
      ],
      certifications: [{ name: "Meta Front-End Developer", issuer: "Coursera", date: "2023" }],
    },
  },
  {
    title: "Project Manager CV",
    templateId: "classic-corporate",
    data: {
      personal: {
        fullName: "Layla A. Khalil",
        jobTitle: "Project Manager",
        email: "layla.khalil@email.com",
        phone: "+970 59 000 0000",
        location: "Ramallah, Palestine",
        linkedin: "linkedin.com/in/layla-khalil",
        website: "",
      },
      summary:
        "Detail-oriented project manager coordinating cross-functional software teams to deliver on time and on budget.",
      experiences: [
        {
          jobTitle: "Project Manager",
          company: "Digital Agency",
          location: "Nablus",
          startDate: "2021",
          endDate: "",
          current: true,
          bullets: ["Managed 10+ client projects end-to-end using Agile methods."],
        },
      ],
      education: [
        {
          degree: "BSc in Software Engineering",
          institution: "Birzeit University",
          location: "Birzeit",
          startDate: "2015",
          endDate: "2019",
          details: "",
        },
      ],
      skills: ["Agile", "Scrum", "Jira", "Stakeholder Management", "Roadmapping"],
      languages: [
        { name: "Arabic", level: "Native" },
        { name: "English", level: "Fluent" },
      ],
      certifications: [],
    },
  },
];

async function upsertUser({ email, name, password, role }) {
  const passwordHash = await bcrypt.hash(password, 12); // salt rounds >= 12
  const now = new Date();
  return prisma.user.upsert({
    where: { email },
    // Pre-verified so they can sign in immediately for local testing.
    update: { role, name, emailVerified: now },
    create: { email, name, passwordHash, role, emailVerified: now },
  });
}

async function main() {
  // 1) Owner account — credentials must come from the environment.
  const ownerEmail = (process.env.OWNER_EMAIL || "").trim().toLowerCase();
  const ownerPassword = process.env.OWNER_PASSWORD || "";

  if (!ownerEmail || !ownerPassword) {
    throw new Error(
      "OWNER_EMAIL and OWNER_PASSWORD are required.\n" +
        "  Set them before seeding, e.g.\n" +
        '    OWNER_EMAIL="you@example.com" OWNER_PASSWORD="$(openssl rand -base64 18)" npm run db:seed\n' +
        "  They are intentionally not defaulted: a fallback password would create an\n" +
        "  admin account with publicly known credentials on every deployment."
    );
  }
  if (ownerPassword.length < 12) {
    throw new Error("OWNER_PASSWORD must be at least 12 characters.");
  }

  const owner = await upsertUser({
    email: ownerEmail,
    name: process.env.OWNER_NAME || "Owner",
    password: ownerPassword,
    role: "OWNER",
  });
  console.log(`✔ Owner ready: ${owner.email} (${owner.role})`);

  // 2) Demo users — local development only. SEED_DEMO_USERS=true opts in;
  //    they are never created otherwise, so production seeds stay clean.
  const wantDemo =
    process.env.SEED_DEMO_USERS === "true" || process.env.NODE_ENV === "development";
  if (!wantDemo) {
    console.log("• Skipping demo users (set SEED_DEMO_USERS=true to create them).");
    return;
  }

  const demoPassword = process.env.DEMO_PASSWORD || "Demo1234!local";
  const demo = await upsertUser({
    email: "demo@bornatcv.local",
    name: "Demo User",
    password: demoPassword,
    role: "USER",
  });
  await upsertUser({
    email: "admin@bornatcv.local",
    name: "Admin User",
    password: demoPassword,
    role: "ADMIN",
  });
  console.log("✔ Demo users ready: demo@bornatcv.local / admin@bornatcv.local");

  // 3) Sample CVs for the demo user — only if they have none yet.
  const existingCvs = await prisma.cV.count({ where: { userId: demo.id } });
  if (existingCvs === 0) {
    for (const cv of sampleCvs) {
      const m = meta(cv.data);
      await prisma.cV.create({
        data: {
          userId: demo.id,
          title: cv.title,
          templateId: cv.templateId,
          data: JSON.stringify(cv.data),
          fullName: m.fullName,
          jobTitle: m.jobTitle,
        },
      });
    }
    console.log(`✔ Created ${sampleCvs.length} sample CVs for demo@bornatcv.local`);
  } else {
    console.log("• Demo user already has CVs — skipping sample CV creation.");
  }
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
