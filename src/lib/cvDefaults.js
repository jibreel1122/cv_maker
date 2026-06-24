// بيانات افتراضية فارغة + بيانات عيّنة لعرضها في المعاينة المباشرة على اللاندنج.

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

export const sampleCvDataAr = {
  personal: {
    fullName: "أحمد خالد العمري",
    jobTitle: "مطوّر واجهات أمامية",
    email: "ahmad.omari@email.com",
    phone: "+962 79 000 0000",
    location: "عمّان، الأردن",
    linkedin: "linkedin.com/in/ahmad-omari",
    website: "",
  },
  summary:
    "مطوّر واجهات أمامية بخبرة 4 سنوات في بناء تطبيقات ويب سريعة وقابلة للوصول باستخدام React وNext.js. شغوف بتحسين الأداء وتجربة المستخدم.",
  experiences: [
    {
      jobTitle: "مطوّر واجهات أول",
      company: "شركة تِك سوليوشنز",
      location: "عمّان",
      startDate: "2022",
      endDate: "",
      current: true,
      bullets: [
        "قُدت إعادة بناء واجهة المنتج الرئيسي ما رفع سرعة التحميل بنسبة 40%.",
        "أشرفت على فريق من 3 مطوّرين ووضعت معايير مراجعة الكود.",
      ],
    },
    {
      jobTitle: "مطوّر واجهات",
      company: "وكالة ويب",
      location: "عمّان",
      startDate: "2020",
      endDate: "2022",
      current: false,
      bullets: ["طوّرت أكثر من 15 موقعًا متجاوبًا لعملاء في قطاعات مختلفة."],
    },
  ],
  education: [
    {
      degree: "بكالوريوس هندسة برمجيات",
      institution: "الجامعة الأردنية",
      location: "عمّان",
      startDate: "2015",
      endDate: "2019",
      details: "",
    },
  ],
  skills: ["JavaScript", "React", "Next.js", "TypeScript", "Tailwind CSS", "Git"],
  languages: [
    { name: "العربية", level: "اللغة الأم" },
    { name: "الإنجليزية", level: "متقدّم" },
  ],
  certifications: [
    { name: "Meta Front-End Developer", issuer: "Coursera", date: "2023" },
  ],
};

export const sampleCvDataEn = {
  personal: {
    fullName: "Ahmad K. Al-Omari",
    jobTitle: "Frontend Developer",
    email: "ahmad.omari@email.com",
    phone: "+962 79 000 0000",
    location: "Amman, Jordan",
    linkedin: "linkedin.com/in/ahmad-omari",
    website: "",
  },
  summary:
    "Frontend developer with 4 years of experience building fast, accessible web apps using React and Next.js. Passionate about performance and user experience.",
  experiences: [
    {
      jobTitle: "Senior Frontend Developer",
      company: "Tech Solutions",
      location: "Amman",
      startDate: "2022",
      endDate: "",
      current: true,
      bullets: [
        "Led a rebuild of the main product UI, improving load speed by 40%.",
        "Mentored a team of 3 developers and set code review standards.",
      ],
    },
    {
      jobTitle: "Frontend Developer",
      company: "Web Agency",
      location: "Amman",
      startDate: "2020",
      endDate: "2022",
      current: false,
      bullets: ["Delivered 15+ responsive websites for clients across sectors."],
    },
  ],
  education: [
    {
      degree: "BSc in Software Engineering",
      institution: "University of Jordan",
      location: "Amman",
      startDate: "2015",
      endDate: "2019",
      details: "",
    },
  ],
  skills: ["JavaScript", "React", "Next.js", "TypeScript", "Tailwind CSS", "Git"],
  languages: [
    { name: "Arabic", level: "Native" },
    { name: "English", level: "Advanced" },
  ],
  certifications: [
    { name: "Meta Front-End Developer", issuer: "Coursera", date: "2023" },
  ],
};

// يستخرج اسم وإيميل العميل من بيانات السيرة لتخزينهما في الطلب.
export function extractCustomer(cvData) {
  const p = (cvData && cvData.personal) || {};
  return {
    customerName: p.fullName || null,
    customerEmail: p.email || null,
  };
}
