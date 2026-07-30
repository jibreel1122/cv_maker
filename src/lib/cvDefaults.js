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

export const sampleCvData = {
  settings: { language: DEFAULT_CV_LANGUAGE, density: DEFAULT_DENSITY },
  personal: {
    fullName: "Layla A. Khalil",
    jobTitle: "Frontend Developer",
    email: "layla.khalil@email.com",
    phone: "+970 59 000 0000",
    location: "Ramallah, Palestine",
    linkedin: "linkedin.com/in/layla-khalil",
    website: "laylakhalil.dev",
  },
  sectionTitles: blankSectionTitles(),
  summary:
    "Frontend developer with 4 years of experience building fast, accessible web apps with React and Next.js. Passionate about clean UI, performance, and great user experience.",
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
        "Mentored a team of 3 developers and set the code-review standards.",
      ],
    },
    {
      jobTitle: "Frontend Developer",
      company: "Web Agency",
      location: "Nablus",
      startDate: "2020",
      endDate: "2022",
      current: false,
      bullets: ["Delivered 15+ responsive websites for clients across sectors."],
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
  certifications: [
    { name: "Meta Front-End Developer", issuer: "Coursera", date: "2023" },
  ],
  customSections: [
    {
      title: "Projects & Portfolios",
      layout: "entries",
      text: "",
      items: [
        {
          title: "Open-source component library",
          subtitle: "Personal project",
          dateRange: "2023",
          location: "",
          descriptionBullets: [
            "Published 30+ accessible React components used by 400+ developers.",
          ],
        },
      ],
    },
  ],
};
