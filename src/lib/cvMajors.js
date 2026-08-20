// ============================================================================
// Fields of study / specialisations offered as suggestions on the CV builder.
//
// These are suggestions only — every field that uses this list stays free text,
// so a user can pick one and then edit it ("BSc in Computer Engineering, minor
// in Mathematics"), or ignore the list entirely and type their own. Nothing here
// is ever enforced or validated against.
//
// Both languages are carried side by side and the list follows the CV's own
// language, not the interface language: someone writing an English CV from the
// Arabic interface should be offered English majors.
//
// Coverage is aimed at what Palestinian and regional universities actually
// award, plus the international fields graduates commonly apply under.
// ============================================================================

import { cvLanguage } from "@/lib/cvSections";

const m = (en, ar) => ({ en, ar });

export const MAJOR_GROUPS = [
  {
    id: "engineering",
    label: m("Engineering", "الهندسة"),
    majors: [
      m("Computer Engineering", "هندسة الحاسوب"),
      m("Software Engineering", "هندسة البرمجيات"),
      m("Electrical Engineering", "الهندسة الكهربائية"),
      m("Electronics Engineering", "هندسة الإلكترونيات"),
      m("Communications Engineering", "هندسة الاتصالات"),
      m("Mechanical Engineering", "الهندسة الميكانيكية"),
      m("Mechatronics Engineering", "هندسة الميكاترونكس"),
      m("Civil Engineering", "الهندسة المدنية"),
      m("Structural Engineering", "الهندسة الإنشائية"),
      m("Architectural Engineering", "الهندسة المعمارية"),
      m("Industrial Engineering", "الهندسة الصناعية"),
      m("Chemical Engineering", "الهندسة الكيميائية"),
      m("Biomedical Engineering", "الهندسة الطبية الحيوية"),
      m("Environmental Engineering", "الهندسة البيئية"),
      m("Energy Engineering", "هندسة الطاقة"),
      m("Renewable Energy Engineering", "هندسة الطاقة المتجددة"),
      m("Water and Environmental Engineering", "هندسة المياه والبيئة"),
      m("Surveying and Geomatics Engineering", "هندسة المساحة والجيوماتكس"),
      m("Materials Engineering", "هندسة المواد"),
      m("Automotive Engineering", "هندسة السيارات"),
      m("Petroleum Engineering", "هندسة البترول"),
      m("Mining Engineering", "هندسة التعدين"),
      m("Aerospace Engineering", "هندسة الطيران والفضاء"),
      m("Robotics and Automation", "الروبوتات والأتمتة"),
    ],
  },
  {
    id: "computing",
    label: m("Computing & IT", "الحوسبة وتكنولوجيا المعلومات"),
    majors: [
      m("Computer Science", "علم الحاسوب"),
      m("Information Technology", "تكنولوجيا المعلومات"),
      m("Information Systems", "نظم المعلومات"),
      m("Management Information Systems", "نظم المعلومات الإدارية"),
      m("Data Science", "علم البيانات"),
      m("Artificial Intelligence", "الذكاء الاصطناعي"),
      m("Machine Learning", "تعلّم الآلة"),
      m("Cybersecurity", "الأمن السيبراني"),
      m("Network Engineering", "هندسة الشبكات"),
      m("Web Development", "تطوير الويب"),
      m("Mobile Application Development", "تطوير تطبيقات الهاتف"),
      m("Game Development", "تطوير الألعاب"),
      m("Cloud Computing", "الحوسبة السحابية"),
      m("Database Administration", "إدارة قواعد البيانات"),
      m("Multimedia Technology", "تكنولوجيا الوسائط المتعددة"),
      m("Bioinformatics", "المعلوماتية الحيوية"),
    ],
  },
  {
    id: "health",
    label: m("Medicine & Health Sciences", "الطب والعلوم الصحية"),
    majors: [
      m("Medicine (MD)", "الطب البشري"),
      m("Dentistry", "طب الأسنان"),
      m("Pharmacy", "الصيدلة"),
      m("Doctor of Pharmacy (PharmD)", "دكتور صيدلة"),
      m("Nursing", "التمريض"),
      m("Midwifery", "القبالة"),
      m("Medical Laboratory Sciences", "العلوم المخبرية الطبية"),
      m("Radiography and Medical Imaging", "الأشعة والتصوير الطبي"),
      m("Physiotherapy", "العلاج الطبيعي"),
      m("Occupational Therapy", "العلاج الوظيفي"),
      m("Speech and Language Therapy", "علاج النطق واللغة"),
      m("Optometry", "البصريات"),
      m("Audiology", "السمعيات"),
      m("Public Health", "الصحة العامة"),
      m("Health Management", "إدارة الصحة"),
      m("Nutrition and Dietetics", "التغذية والحميات"),
      m("Veterinary Medicine", "الطب البيطري"),
      m("Anesthesia Technology", "تقنيات التخدير"),
      m("Emergency Medical Services", "خدمات الطوارئ الطبية"),
      m("Dental Technology", "تقنيات طب الأسنان"),
    ],
  },
  {
    id: "sciences",
    label: m("Natural Sciences & Mathematics", "العلوم الطبيعية والرياضيات"),
    majors: [
      m("Mathematics", "الرياضيات"),
      m("Applied Mathematics", "الرياضيات التطبيقية"),
      m("Statistics", "الإحصاء"),
      m("Actuarial Science", "العلوم الاكتوارية"),
      m("Physics", "الفيزياء"),
      m("Applied Physics", "الفيزياء التطبيقية"),
      m("Chemistry", "الكيمياء"),
      m("Applied Chemistry", "الكيمياء التطبيقية"),
      m("Biology", "الأحياء"),
      m("Biotechnology", "التكنولوجيا الحيوية"),
      m("Biochemistry", "الكيمياء الحيوية"),
      m("Microbiology", "علم الأحياء الدقيقة"),
      m("Geology", "الجيولوجيا"),
      m("Environmental Science", "العلوم البيئية"),
      m("Marine Science", "العلوم البحرية"),
      m("Astronomy", "علم الفلك"),
      m("Food Science and Technology", "علوم وتكنولوجيا الأغذية"),
    ],
  },
  {
    id: "business",
    label: m("Business & Economics", "إدارة الأعمال والاقتصاد"),
    majors: [
      m("Business Administration", "إدارة الأعمال"),
      m("Accounting", "المحاسبة"),
      m("Finance", "التمويل"),
      m("Banking and Financial Sciences", "العلوم المصرفية والمالية"),
      m("Economics", "الاقتصاد"),
      m("Marketing", "التسويق"),
      m("Digital Marketing", "التسويق الرقمي"),
      m("Human Resource Management", "إدارة الموارد البشرية"),
      m("Entrepreneurship", "ريادة الأعمال"),
      m("Project Management", "إدارة المشاريع"),
      m("Supply Chain Management", "إدارة سلاسل التوريد"),
      m("Logistics Management", "إدارة اللوجستيات"),
      m("International Business", "الأعمال الدولية"),
      m("Insurance and Risk Management", "التأمين وإدارة المخاطر"),
      m("E-Business", "الأعمال الإلكترونية"),
      m("Hospitality and Hotel Management", "إدارة الضيافة والفنادق"),
      m("Tourism Management", "إدارة السياحة"),
      m("Real Estate Management", "إدارة العقارات"),
    ],
  },
  {
    id: "law",
    label: m("Law & Political Science", "القانون والعلوم السياسية"),
    majors: [
      m("Law", "القانون"),
      m("International Law", "القانون الدولي"),
      m("Sharia and Law", "الشريعة والقانون"),
      m("Political Science", "العلوم السياسية"),
      m("International Relations", "العلاقات الدولية"),
      m("Diplomacy", "الدبلوماسية"),
      m("Public Administration", "الإدارة العامة"),
      m("Criminology", "علم الجريمة"),
      m("Human Rights", "حقوق الإنسان"),
      m("Peace and Conflict Studies", "دراسات السلام والنزاعات"),
    ],
  },
  {
    id: "humanities",
    label: m("Humanities & Languages", "الآداب واللغات"),
    majors: [
      m("Arabic Language and Literature", "اللغة العربية وآدابها"),
      m("English Language and Literature", "اللغة الإنجليزية وآدابها"),
      m("French Language", "اللغة الفرنسية"),
      m("Hebrew Language", "اللغة العبرية"),
      m("German Language", "اللغة الألمانية"),
      m("Turkish Language", "اللغة التركية"),
      m("Translation and Interpreting", "الترجمة"),
      m("Applied Linguistics", "اللسانيات التطبيقية"),
      m("History", "التاريخ"),
      m("Archaeology", "الآثار"),
      m("Philosophy", "الفلسفة"),
      m("Geography", "الجغرافيا"),
      m("Islamic Studies", "الدراسات الإسلامية"),
      m("Usul al-Din", "أصول الدين"),
      m("Christian Theology", "اللاهوت المسيحي"),
      m("Cultural Studies", "الدراسات الثقافية"),
    ],
  },
  {
    id: "social",
    label: m("Social Sciences", "العلوم الاجتماعية"),
    majors: [
      m("Sociology", "علم الاجتماع"),
      m("Psychology", "علم النفس"),
      m("Clinical Psychology", "علم النفس الإكلينيكي"),
      m("Counselling Psychology", "الإرشاد النفسي"),
      m("Social Work", "الخدمة الاجتماعية"),
      m("Anthropology", "الأنثروبولوجيا"),
      m("Development Studies", "دراسات التنمية"),
      m("Gender Studies", "دراسات النوع الاجتماعي"),
      m("Demography", "علم السكان"),
    ],
  },
  {
    id: "education",
    label: m("Education", "التربية والتعليم"),
    majors: [
      m("Education", "التربية"),
      m("Primary Education", "تعليم المرحلة الأساسية"),
      m("Early Childhood Education", "تربية الطفولة المبكرة"),
      m("Special Education", "التربية الخاصة"),
      m("Teaching English as a Foreign Language (TEFL)", "تعليم اللغة الإنجليزية كلغة أجنبية"),
      m("Mathematics Education", "تعليم الرياضيات"),
      m("Science Education", "تعليم العلوم"),
      m("Educational Administration", "الإدارة التربوية"),
      m("Curriculum and Instruction", "المناهج وطرق التدريس"),
      m("Physical Education", "التربية الرياضية"),
      m("Educational Technology", "تكنولوجيا التعليم"),
    ],
  },
  {
    id: "arts",
    label: m("Arts, Design & Media", "الفنون والتصميم والإعلام"),
    majors: [
      m("Graphic Design", "التصميم الجرافيكي"),
      m("Interior Design", "التصميم الداخلي"),
      m("Product Design", "تصميم المنتجات"),
      m("Fashion Design", "تصميم الأزياء"),
      m("Fine Arts", "الفنون الجميلة"),
      m("Visual Arts", "الفنون البصرية"),
      m("Music", "الموسيقى"),
      m("Theatre and Performing Arts", "المسرح والفنون الأدائية"),
      m("Film and Television Production", "إنتاج الأفلام والتلفزيون"),
      m("Animation", "الرسوم المتحركة"),
      m("Photography", "التصوير الفوتوغرافي"),
      m("Journalism", "الصحافة"),
      m("Media and Communication", "الإعلام والاتصال"),
      m("Public Relations and Advertising", "العلاقات العامة والإعلان"),
      m("Digital Media", "الإعلام الرقمي"),
      m("Urban Planning", "التخطيط العمراني"),
      m("Landscape Architecture", "تنسيق المواقع"),
    ],
  },
  {
    id: "agriculture",
    label: m("Agriculture & Environment", "الزراعة والبيئة"),
    majors: [
      m("Agricultural Science", "العلوم الزراعية"),
      m("Agricultural Engineering", "الهندسة الزراعية"),
      m("Plant Production and Protection", "الإنتاج النباتي ووقايته"),
      m("Animal Production", "الإنتاج الحيواني"),
      m("Horticulture", "البستنة"),
      m("Soil and Water Sciences", "علوم التربة والمياه"),
      m("Sustainable Development", "التنمية المستدامة"),
      m("Natural Resources Management", "إدارة الموارد الطبيعية"),
    ],
  },
  {
    id: "vocational",
    label: m("Technical & Vocational", "التخصصات التقنية والمهنية"),
    majors: [
      m("Electrical Technology", "التكنولوجيا الكهربائية"),
      m("Mechanical Technology", "التكنولوجيا الميكانيكية"),
      m("Air Conditioning and Refrigeration", "التكييف والتبريد"),
      m("Automotive Technology", "تكنولوجيا المركبات"),
      m("Construction Technology", "تكنولوجيا البناء"),
      m("Office Management", "إدارة المكاتب"),
      m("Secretarial and Administrative Studies", "السكرتاريا والدراسات الإدارية"),
      m("Culinary Arts", "فنون الطهي"),
      m("Beauty and Cosmetology", "التجميل"),
      m("Printing and Publishing", "الطباعة والنشر"),
    ],
  },
];

// Flat, de-duplicated list of every major in one language — what the datalist
// and the search box read.
export function majorOptions(language) {
  const key = cvLanguage(language);
  const seen = new Set();
  const out = [];
  for (const group of MAJOR_GROUPS) {
    for (const major of group.majors) {
      const value = major[key];
      if (value && !seen.has(value)) {
        seen.add(value);
        out.push(value);
      }
    }
  }
  return out;
}

// The same catalogue grouped by faculty, for the browsable picker.
export function majorGroups(language) {
  const key = cvLanguage(language);
  return MAJOR_GROUPS.map((group) => ({
    id: group.id,
    label: group.label[key],
    majors: group.majors.map((major) => major[key]).filter(Boolean),
  }));
}

export function majorCount() {
  return MAJOR_GROUPS.reduce((total, group) => total + group.majors.length, 0);
}
