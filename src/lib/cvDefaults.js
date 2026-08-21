// Empty defaults plus a sample CV used for the live preview on the landing page.

import {
  SECTION_KEYS,
  DEFAULT_CV_LANGUAGE,
  DEFAULT_DENSITY,
} from "@/lib/cvSections";

// A blank section-title map means "use the standard label for every section".
// The builder writes a user's override into the matching key.
function blankSectionTitles() {
  return Object.fromEntries(SECTION_KEYS.map((k) => [k, ""]));
}

export const emptyCvData = {
  // How the CV itself is typeset — its own language and spacing, independent of
  // the language the site interface happens to be in.
  settings: { language: DEFAULT_CV_LANGUAGE, density: DEFAULT_DENSITY },
  personal: {
    fullName: "",
    jobTitle: "",
    email: "",
    phone: "",
    location: "",
    linkedin: "",
    website: "",
  },
  sectionTitles: blankSectionTitles(),
  summary: "",
  experiences: [
    {
      jobTitle: "",
      company: "",
      location: "",
      startDate: "",
      endDate: "",
      current: false,
      bullets: [""],
    },
  ],
  education: [
    { degree: "", institution: "", location: "", startDate: "", endDate: "", details: "" },
  ],
  skills: [""],
  languages: [{ name: "", level: "" }],
  certifications: [],
  customSections: [],
};

// Blank entries used when the builder adds a new row.
export const blankExperience = {
  jobTitle: "",
  company: "",
  location: "",
  startDate: "",
  endDate: "",
  current: false,
  bullets: [""],
};

export const blankEducation = {
  degree: "",
  institution: "",
  location: "",
  startDate: "",
  endDate: "",
  details: "",
};

export const blankCertification = { name: "", issuer: "", date: "" };

export const blankCustomSection = {
  title: "",
  layout: "entries",
  items: [],
  text: "",
};

export const blankCustomItem = {
  title: "",
  subtitle: "",
  dateRange: "",
  location: "",
  descriptionBullets: [""],
};

// The CV shown in the landing page's animated demo. It is illustrative content
// for visitors who have not signed in yet — it is never anyone's saved CV, and
// nothing a user edits in the builder changes it. Edit this object to change
// what the demo shows.
export const sampleCvData = {
  settings: { language: DEFAULT_CV_LANGUAGE, density: DEFAULT_DENSITY },
  personal: {
    fullName: "Eng. Jibreel Bornat",
    jobTitle: "Software Engineer",
    // A placeholder address on purpose: the landing page is public, and putting
    // a real inbox on it only collects spam.
    email: "hello@example.com",
    phone: "+970 59 000 0000",
    location: "Ramallah, Palestine",
    linkedin: "linkedin.com/in/jibreel-bornat",
    website: "jibreelbornat.dev",
  },
  sectionTitles: blankSectionTitles(),
  summary:
    "Software engineer who builds fast, accessible web applications end to end — from database schema to deployment. Focused on clean architecture, performance, and shipping work people actually use.",
  experiences: [
    {
      jobTitle: "Full-Stack Developer",
      company: "Independent",
      location: "Ramallah",
      startDate: "2022",
      endDate: "",
      current: true,
      bullets: [
        "Designed and shipped web applications end to end, from data model to production deployment.",
        "Built Bornat CV Maker: bilingual Arabic/English, ATS-friendly templates, and PDF, Word and LaTeX export.",
      ],
    },
  ],
  education: [
    {
      degree: "BSc in Computer Engineering",
      institution: "Birzeit University",
      location: "Birzeit",
      startDate: "2018",
      endDate: "2022",
      details: "",
    },
  ],
  skills: ["JavaScript", "React", "Next.js", "Node.js", "PostgreSQL", "Tailwind CSS", "Git"],
  languages: [
    { name: "Arabic", level: "Native" },
    { name: "English", level: "Fluent" },
  ],
  certifications: [
    { name: "Full-Stack Web Development", issuer: "Coursera", date: "2023" },
  ],
  customSections: [
    {
      title: "Projects & Portfolios",
      layout: "entries",
      text: "",
      items: [
        {
          title: "Bornat CV Maker",
          subtitle: "Personal project",
          dateRange: "2026",
          location: "",
          descriptionBullets: [
            "A free bilingual CV builder with a live preview and one-click PDF, Word and LaTeX export.",
          ],
        },
      ],
    },
  ],
};
