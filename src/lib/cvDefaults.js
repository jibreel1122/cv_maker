// Empty defaults plus a sample CV used for the live preview on the landing page.

export const emptyCvData = {
  personal: {
    fullName: "",
    jobTitle: "",
    email: "",
    phone: "",
    location: "",
    linkedin: "",
    website: "",
  },
  summary: "",
  experiences: [
    { jobTitle: "", company: "", location: "", startDate: "", endDate: "", current: false, bullets: [""] },
  ],
  education: [
    { degree: "", institution: "", location: "", startDate: "", endDate: "", details: "" },
  ],
  skills: [""],
  languages: [{ name: "", level: "" }],
  certifications: [],
};

export const sampleCvData = {
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
};

// Pulls a name / title out of the CV data so they can be stored alongside the
// CV row for quick listing in the admin dashboard.
export function extractMeta(cvData) {
  const p = (cvData && cvData.personal) || {};
  return {
    fullName: p.fullName || null,
    jobTitle: p.jobTitle || null,
  };
}
