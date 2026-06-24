// ============================================================================
// مولّد HTML لقوالب السيرة الذاتية — مصدر الحقيقة الوحيد.
//
// ⚠️ تنويه التوافق مع ATS (اقرأه قبل أي تعديل تصميمي على هذا الملف):
// القوالب الناتجة هنا هي المنتج المدفوع، ويجب أن تبقى متوافقة مع أنظمة تتبع
// المتقدمين (ATS) ومع مسؤولي التوظيف المحافظين. أي تعديل مستقبلي يجب أن يحافظ
// على القواعد التالية:
//   - صفحة A4، عمود واحد بسيط (لا أعمدة متعددة معقدة تكسر قراءة ATS).
//   - ألوان محايدة فقط + لون تمييزي واحد خافت للعناوين فقط (لا تدرّجات/خلفيات ملونة).
//   - خط واحد فقط لكل قالب (وزن أثقل للعناوين مسموح).
//   - بدون أيقونات، بدون صور شخصية، بدون جداول معقدة.
//   - ترتيب الأقسام ثابت: بيانات التواصل → الملخص → الخبرات → التعليم →
//     المهارات → اللغات → الدورات/الشهادات.
//   - يجب أن يعمل بشكل مطابق بالعربية (RTL) والإنجليزية (LTR) دون كسر التخطيط.
//
// نفس المخرَج يُستخدم في المعاينة المباشرة (داخل iframe) وفي توليد الـ PDF عبر
// Puppeteer (page.setContent) — ما يضمن أن الـ PDF مطابق تمامًا للمعاينة.
// ============================================================================

export const TEMPLATES = [
  {
    id: "classic",
    nameAr: "كلاسيكي",
    nameEn: "Classic",
    descAr: "اسم موسّط، عناوين بخط سفلي، تباعد مريح.",
    font: "'Cairo', sans-serif",
    accent: "#1f2a44",
  },
  {
    id: "modern",
    nameAr: "عصري",
    nameEn: "Modern",
    descAr: "اسم محاذى للجانب، عناوين بتباعد حروف وخط رفيع.",
    font: "'IBM Plex Sans Arabic', sans-serif",
    accent: "#2a3b2f",
  },
  {
    id: "compact",
    nameAr: "مُكثّف",
    nameEn: "Compact",
    descAr: "تباعد أصغر لاستيعاب محتوى أكثر في صفحة واحدة.",
    font: "'Tajawal', sans-serif",
    accent: "#3a2230",
  },
];

const LABELS = {
  ar: {
    summary: "الملخص المهني",
    experience: "الخبرات العملية",
    education: "التعليم",
    skills: "المهارات",
    languages: "اللغات",
    certifications: "الدورات والشهادات",
    present: "حتى الآن",
  },
  en: {
    summary: "Professional Summary",
    experience: "Work Experience",
    education: "Education",
    skills: "Skills",
    languages: "Languages",
    certifications: "Certifications",
    present: "Present",
  },
};

function esc(value) {
  if (value === null || value === undefined) return "";
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function fmtRange(start, end, current, presentLabel) {
  const s = esc(start);
  const e = current ? presentLabel : esc(end);
  if (!s && !e) return "";
  if (!s) return e;
  if (!e) return s;
  return `${s} — ${e}`;
}

function getTemplate(templateId) {
  return TEMPLATES.find((t) => t.id === templateId) || TEMPLATES[0];
}

// يبني الأنماط (CSS) حسب القالب. كلها متوافقة مع ATS: عمود واحد، لون تمييزي واحد.
function buildStyles(tpl, isRTL) {
  const dirAlignStart = isRTL ? "right" : "left";

  const base = `
    *{box-sizing:border-box;margin:0;padding:0;}
    html,body{background:#ffffff;}
    body{
      font-family:${tpl.font};
      color:#1a1a1a;
      direction:${isRTL ? "rtl" : "ltr"};
      text-align:${dirAlignStart};
      line-height:1.5;
      -webkit-print-color-adjust:exact;
      print-color-adjust:exact;
    }
    .page{
      width:210mm;
      min-height:297mm;
      padding:18mm 16mm;
      margin:0 auto;
      background:#ffffff;
    }
    .name{color:${tpl.accent};}
    a{color:#1a1a1a;text-decoration:none;}
    ul{list-style:none;}
    .section{margin-top:14px;}
    .item{margin-top:10px;}
    .muted{color:#444;}
    .row-between{display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap;}
    .bullets{margin-top:4px;}
    .bullets li{position:relative;padding-${dirAlignStart}:14px;margin-top:3px;}
    .bullets li::before{
      content:"•";position:absolute;${dirAlignStart}:0;color:${tpl.accent};
    }
    .contact{margin-top:6px;color:#333;font-size:10.5pt;}
    .contact span{white-space:nowrap;}
    .contact .sep{margin:0 8px;color:#aaa;}
    .skills-list{display:flex;flex-wrap:wrap;gap:6px 10px;margin-top:6px;}
    .skills-list li{
      border:1px solid #ccc;border-radius:4px;padding:2px 8px;font-size:10pt;
    }
    @page{size:A4;margin:0;}
  `;

  const variants = {
    classic: `
      .page{font-size:11pt;}
      .header{text-align:center;border-bottom:2px solid ${tpl.accent};padding-bottom:10px;}
      .name{font-size:24pt;font-weight:800;letter-spacing:0.5px;}
      .job-title{font-size:13pt;color:#333;margin-top:2px;font-weight:600;}
      .contact{text-align:center;}
      .section-title{
        color:${tpl.accent};font-size:13pt;font-weight:800;
        border-bottom:1px solid #d8d8d8;padding-bottom:3px;margin-bottom:2px;
      }
      .item-title{font-weight:700;font-size:11.5pt;}
      .item-sub{font-weight:600;color:#333;}
      .item-date{color:#555;font-size:10pt;}
    `,
    modern: `
      .page{font-size:10.5pt;}
      .header{border-bottom:1px solid #ccc;padding-bottom:12px;}
      .name{font-size:23pt;font-weight:700;}
      .job-title{font-size:12pt;color:#444;margin-top:2px;letter-spacing:1px;}
      .section-title{
        color:${tpl.accent};font-size:11pt;font-weight:700;
        text-transform:uppercase;letter-spacing:2px;margin-bottom:4px;
      }
      .item-title{font-weight:700;font-size:11pt;}
      .item-sub{color:#444;}
      .item-date{color:#666;font-size:9.5pt;}
    `,
    compact: `
      .page{font-size:10pt;padding:14mm 14mm;}
      .section{margin-top:10px;}
      .item{margin-top:7px;}
      .header{border-bottom:1.5px solid ${tpl.accent};padding-bottom:8px;}
      .name{font-size:20pt;font-weight:800;}
      .job-title{font-size:11pt;color:#444;font-weight:600;}
      .section-title{
        color:${tpl.accent};font-size:11pt;font-weight:800;
        text-transform:uppercase;letter-spacing:0.5px;margin-bottom:2px;
      }
      .item-title{font-weight:700;font-size:10.5pt;}
      .item-sub{color:#333;}
      .item-date{color:#555;font-size:9pt;}
      .bullets li{margin-top:1px;}
    `,
  };

  return base + (variants[tpl.id] || variants.classic);
}

function renderContact(p, isRTL) {
  const parts = [];
  if (p.email) parts.push(`<span>${esc(p.email)}</span>`);
  if (p.phone) parts.push(`<span dir="ltr">${esc(p.phone)}</span>`);
  if (p.location) parts.push(`<span>${esc(p.location)}</span>`);
  if (p.linkedin) parts.push(`<span>${esc(p.linkedin)}</span>`);
  if (p.website) parts.push(`<span>${esc(p.website)}</span>`);
  if (!parts.length) return "";
  return `<div class="contact">${parts.join('<span class="sep">|</span>')}</div>`;
}

function renderSection(title, inner) {
  if (!inner) return "";
  return `<div class="section"><div class="section-title">${esc(title)}</div>${inner}</div>`;
}

// ينشئ مستند HTML كاملًا لسيرة ذاتية.
export function buildCvHtml(cvData, templateId, language) {
  const data = cvData || {};
  const tpl = getTemplate(templateId);
  const isRTL = language === "ar";
  const L = LABELS[isRTL ? "ar" : "en"];
  const p = data.personal || {};

  // الترويسة: الاسم + المسمى + بيانات التواصل
  const header = `
    <div class="header">
      <div class="name">${esc(p.fullName) || (isRTL ? "الاسم الكامل" : "Full Name")}</div>
      ${p.jobTitle ? `<div class="job-title">${esc(p.jobTitle)}</div>` : ""}
      ${renderContact(p, isRTL)}
    </div>`;

  // الملخص
  const summary = data.summary
    ? renderSection(L.summary, `<p class="muted">${esc(data.summary)}</p>`)
    : "";

  // الخبرات
  const experiences = Array.isArray(data.experiences)
    ? data.experiences.filter((e) => e && (e.jobTitle || e.company))
    : [];
  const expInner = experiences
    .map((e) => {
      const bullets = Array.isArray(e.bullets)
        ? e.bullets.filter((b) => b && b.trim())
        : [];
      const bulletsHtml = bullets.length
        ? `<ul class="bullets">${bullets.map((b) => `<li>${esc(b)}</li>`).join("")}</ul>`
        : "";
      const sub = [e.company, e.location].filter(Boolean).map(esc).join(" — ");
      return `
        <div class="item">
          <div class="row-between">
            <span class="item-title">${esc(e.jobTitle)}</span>
            <span class="item-date">${fmtRange(e.startDate, e.endDate, e.current, L.present)}</span>
          </div>
          ${sub ? `<div class="item-sub">${sub}</div>` : ""}
          ${bulletsHtml}
        </div>`;
    })
    .join("");
  const experienceSection = expInner ? renderSection(L.experience, expInner) : "";

  // التعليم
  const education = Array.isArray(data.education)
    ? data.education.filter((e) => e && (e.degree || e.institution))
    : [];
  const eduInner = education
    .map((e) => {
      const sub = [e.institution, e.location].filter(Boolean).map(esc).join(" — ");
      return `
        <div class="item">
          <div class="row-between">
            <span class="item-title">${esc(e.degree)}</span>
            <span class="item-date">${fmtRange(e.startDate, e.endDate, false, L.present)}</span>
          </div>
          ${sub ? `<div class="item-sub">${sub}</div>` : ""}
          ${e.details ? `<div class="muted">${esc(e.details)}</div>` : ""}
        </div>`;
    })
    .join("");
  const educationSection = eduInner ? renderSection(L.education, eduInner) : "";

  // المهارات
  const skills = Array.isArray(data.skills)
    ? data.skills.filter((s) => s && s.trim())
    : [];
  const skillsSection = skills.length
    ? renderSection(
        L.skills,
        `<ul class="skills-list">${skills.map((s) => `<li>${esc(s)}</li>`).join("")}</ul>`
      )
    : "";

  // اللغات
  const languages = Array.isArray(data.languages)
    ? data.languages.filter((l) => l && l.name)
    : [];
  const langSection = languages.length
    ? renderSection(
        L.languages,
        `<ul class="skills-list">${languages
          .map(
            (l) => `<li>${esc(l.name)}${l.level ? ` — ${esc(l.level)}` : ""}</li>`
          )
          .join("")}</ul>`
      )
    : "";

  // الدورات والشهادات
  const certs = Array.isArray(data.certifications)
    ? data.certifications.filter((c) => c && c.name)
    : [];
  const certInner = certs
    .map(
      (c) => `
        <div class="item">
          <div class="row-between">
            <span class="item-title">${esc(c.name)}</span>
            <span class="item-date">${esc(c.date)}</span>
          </div>
          ${c.issuer ? `<div class="item-sub">${esc(c.issuer)}</div>` : ""}
        </div>`
    )
    .join("");
  const certSection = certInner ? renderSection(L.certifications, certInner) : "";

  const styles = buildStyles(tpl, isRTL);

  return `<!DOCTYPE html>
<html lang="${isRTL ? "ar" : "en"}" dir="${isRTL ? "rtl" : "ltr"}">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>CV</title>
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&family=IBM+Plex+Sans+Arabic:wght@400;500;700&family=Tajawal:wght@400;500;700;800&display=swap" rel="stylesheet" />
<style>${styles}</style>
</head>
<body>
  <div class="page">
    ${header}
    ${summary}
    ${experienceSection}
    ${educationSection}
    ${skillsSection}
    ${langSection}
    ${certSection}
  </div>
</body>
</html>`;
}
