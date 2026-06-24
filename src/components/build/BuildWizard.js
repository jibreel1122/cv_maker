"use client";

import { useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Plus,
  Trash2,
  Loader2,
  CreditCard,
  Eye,
  X,
} from "lucide-react";
import CVPreview from "@/components/CVPreview";
import { TEMPLATES } from "@/lib/cvTemplates";
import { emptyCvData } from "@/lib/cvDefaults";
import { Field, TextArea, Checkbox } from "./fields";

const STEPS = [
  "البيانات الشخصية",
  "الملخص المهني",
  "التعليم",
  "الخبرات العملية",
  "المهارات",
  "اللغات",
  "الدورات والشهادات",
  "القالب والدفع",
];

// نسخة عميقة من البيانات الفارغة لتفادي مشاركة المراجع.
function freshData() {
  return JSON.parse(JSON.stringify(emptyCvData));
}

export default function BuildWizard({ price = "5" }) {
  const [step, setStep] = useState(0);
  const [data, setData] = useState(freshData);
  const [templateId, setTemplateId] = useState("classic");
  const [language, setLanguage] = useState("ar");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [mobilePreview, setMobilePreview] = useState(false);

  // محدّثات عامة
  function setPersonal(key, val) {
    setData((d) => ({ ...d, personal: { ...d.personal, [key]: val } }));
  }
  function setField(key, val) {
    setData((d) => ({ ...d, [key]: val }));
  }
  function updateItem(listKey, index, key, val) {
    setData((d) => {
      const list = [...d[listKey]];
      list[index] = { ...list[index], [key]: val };
      return { ...d, [listKey]: list };
    });
  }
  function addItem(listKey, template) {
    setData((d) => ({ ...d, [listKey]: [...d[listKey], template] }));
  }
  function removeItem(listKey, index) {
    setData((d) => ({ ...d, [listKey]: d[listKey].filter((_, i) => i !== index) }));
  }

  async function handlePay() {
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cvData: data, templateId, language }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "تعذّر بدء عملية الدفع.");
      if (json.url) {
        window.location.href = json.url;
      } else {
        throw new Error("لم يصل رابط الدفع من الخادم.");
      }
    } catch (e) {
      setError(e.message);
      setLoading(false);
    }
  }

  const isLast = step === STEPS.length - 1;

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      {/* عمود الفورم */}
      <div>
        {/* مؤشّر الخطوات */}
        <div className="mb-6 flex flex-wrap gap-2">
          {STEPS.map((s, i) => (
            <button
              key={s}
              onClick={() => setStep(i)}
              className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                i === step
                  ? "bg-gold text-midnight-deep"
                  : i < step
                  ? "bg-gold/15 text-gold"
                  : "bg-white/5 text-slateblue hover:bg-white/10"
              }`}
            >
              {i + 1}. {s}
            </button>
          ))}
        </div>

        <div className="card min-h-[420px]">
          <h2 className="mb-5 font-display text-xl font-bold text-cream">
            {STEPS[step]}
          </h2>

          {/* خطوة: البيانات الشخصية */}
          {step === 0 && (
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="الاسم الكامل" value={data.personal.fullName} onChange={(v) => setPersonal("fullName", v)} placeholder="مثال: أحمد خالد العمري" />
              <Field label="المسمى الوظيفي" value={data.personal.jobTitle} onChange={(v) => setPersonal("jobTitle", v)} placeholder="مطوّر واجهات أمامية" />
              <Field label="البريد الإلكتروني" type="email" dir="ltr" value={data.personal.email} onChange={(v) => setPersonal("email", v)} placeholder="name@email.com" />
              <Field label="رقم الهاتف" dir="ltr" value={data.personal.phone} onChange={(v) => setPersonal("phone", v)} placeholder="+962 7..." />
              <Field label="الموقع (المدينة، الدولة)" value={data.personal.location} onChange={(v) => setPersonal("location", v)} placeholder="عمّان، الأردن" />
              <Field label="LinkedIn (اختياري)" dir="ltr" value={data.personal.linkedin} onChange={(v) => setPersonal("linkedin", v)} placeholder="linkedin.com/in/..." />
              <Field label="موقع/معرض أعمال (اختياري)" dir="ltr" value={data.personal.website} onChange={(v) => setPersonal("website", v)} placeholder="example.com" />
            </div>
          )}

          {/* خطوة: الملخص */}
          {step === 1 && (
            <TextArea
              label="ملخص مهني قصير (٢-٣ أسطر)"
              rows={5}
              value={data.summary}
              onChange={(v) => setField("summary", v)}
              placeholder="نبذة موجزة عن خبرتك وأبرز نقاط قوتك المهنية..."
            />
          )}

          {/* خطوة: التعليم */}
          {step === 2 && (
            <div className="space-y-5">
              {data.education.map((ed, i) => (
                <div key={i} className="rounded-xl border border-white/10 p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-sm font-bold text-gold">مؤهل #{i + 1}</span>
                    {data.education.length > 1 && (
                      <button onClick={() => removeItem("education", i)} className="text-slateblue hover:text-red-400">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Field label="الدرجة/التخصص" value={ed.degree} onChange={(v) => updateItem("education", i, "degree", v)} placeholder="بكالوريوس هندسة برمجيات" />
                    <Field label="المؤسسة التعليمية" value={ed.institution} onChange={(v) => updateItem("education", i, "institution", v)} placeholder="الجامعة الأردنية" />
                    <Field label="الموقع" value={ed.location} onChange={(v) => updateItem("education", i, "location", v)} placeholder="عمّان" />
                    <div className="grid grid-cols-2 gap-3">
                      <Field label="من" value={ed.startDate} onChange={(v) => updateItem("education", i, "startDate", v)} placeholder="2015" />
                      <Field label="إلى" value={ed.endDate} onChange={(v) => updateItem("education", i, "endDate", v)} placeholder="2019" />
                    </div>
                    <div className="sm:col-span-2">
                      <Field label="تفاصيل (اختياري)" value={ed.details} onChange={(v) => updateItem("education", i, "details", v)} placeholder="معدّل، تكريم، مشروع تخرّج..." />
                    </div>
                  </div>
                </div>
              ))}
              <button
                onClick={() => addItem("education", { degree: "", institution: "", location: "", startDate: "", endDate: "", details: "" })}
                className="btn-outline w-full !py-2.5 text-sm"
              >
                <Plus className="h-4 w-4" /> إضافة مؤهل
              </button>
            </div>
          )}

          {/* خطوة: الخبرات */}
          {step === 3 && (
            <div className="space-y-5">
              {data.experiences.map((ex, i) => (
                <div key={i} className="rounded-xl border border-white/10 p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-sm font-bold text-gold">خبرة #{i + 1}</span>
                    {data.experiences.length > 1 && (
                      <button onClick={() => removeItem("experiences", i)} className="text-slateblue hover:text-red-400">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Field label="المسمى الوظيفي" value={ex.jobTitle} onChange={(v) => updateItem("experiences", i, "jobTitle", v)} placeholder="مطوّر واجهات أول" />
                    <Field label="الشركة" value={ex.company} onChange={(v) => updateItem("experiences", i, "company", v)} placeholder="شركة تِك سوليوشنز" />
                    <Field label="الموقع" value={ex.location} onChange={(v) => updateItem("experiences", i, "location", v)} placeholder="عمّان" />
                    <div className="grid grid-cols-2 gap-3">
                      <Field label="من" value={ex.startDate} onChange={(v) => updateItem("experiences", i, "startDate", v)} placeholder="2022" />
                      <Field label="إلى" value={ex.endDate} onChange={(v) => updateItem("experiences", i, "endDate", v)} placeholder="2024" />
                    </div>
                  </div>
                  <div className="mt-2">
                    <Checkbox label="ما زلت أعمل هنا حاليًا" checked={ex.current} onChange={(v) => updateItem("experiences", i, "current", v)} />
                  </div>
                  <div className="mt-3">
                    <span className="field-label">نقاط الإنجاز</span>
                    {(ex.bullets || []).map((b, bi) => (
                      <div key={bi} className="mb-2 flex gap-2">
                        <input
                          className="field-input"
                          value={b}
                          placeholder="إنجاز قابل للقياس يبدأ بفعل..."
                          onChange={(e) => {
                            const bullets = [...ex.bullets];
                            bullets[bi] = e.target.value;
                            updateItem("experiences", i, "bullets", bullets);
                          }}
                        />
                        {ex.bullets.length > 1 && (
                          <button
                            onClick={() => updateItem("experiences", i, "bullets", ex.bullets.filter((_, x) => x !== bi))}
                            className="text-slateblue hover:text-red-400"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      onClick={() => updateItem("experiences", i, "bullets", [...(ex.bullets || []), ""])}
                      className="text-sm text-gold hover:underline"
                    >
                      + إضافة نقطة
                    </button>
                  </div>
                </div>
              ))}
              <button
                onClick={() => addItem("experiences", { jobTitle: "", company: "", location: "", startDate: "", endDate: "", current: false, bullets: [""] })}
                className="btn-outline w-full !py-2.5 text-sm"
              >
                <Plus className="h-4 w-4" /> إضافة خبرة
              </button>
            </div>
          )}

          {/* خطوة: المهارات */}
          {step === 4 && (
            <div className="space-y-3">
              <p className="text-sm text-cream/70">أضف مهاراتك التقنية والشخصية.</p>
              {data.skills.map((sk, i) => (
                <div key={i} className="flex gap-2">
                  <input
                    className="field-input"
                    value={sk}
                    placeholder="مثال: React"
                    onChange={(e) => {
                      const skills = [...data.skills];
                      skills[i] = e.target.value;
                      setField("skills", skills);
                    }}
                  />
                  {data.skills.length > 1 && (
                    <button onClick={() => removeItem("skills", i)} className="text-slateblue hover:text-red-400">
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
              <button onClick={() => addItem("skills", "")} className="text-sm text-gold hover:underline">
                + إضافة مهارة
              </button>
            </div>
          )}

          {/* خطوة: اللغات */}
          {step === 5 && (
            <div className="space-y-3">
              {data.languages.map((lg, i) => (
                <div key={i} className="flex items-end gap-2">
                  <div className="flex-1">
                    <Field label="اللغة" value={lg.name} onChange={(v) => updateItem("languages", i, "name", v)} placeholder="الإنجليزية" />
                  </div>
                  <div className="flex-1">
                    <Field label="المستوى" value={lg.level} onChange={(v) => updateItem("languages", i, "level", v)} placeholder="متقدّم" />
                  </div>
                  {data.languages.length > 1 && (
                    <button onClick={() => removeItem("languages", i)} className="mb-2.5 text-slateblue hover:text-red-400">
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
              <button onClick={() => addItem("languages", { name: "", level: "" })} className="text-sm text-gold hover:underline">
                + إضافة لغة
              </button>
            </div>
          )}

          {/* خطوة: الدورات والشهادات */}
          {step === 6 && (
            <div className="space-y-3">
              <p className="text-sm text-cream/70">قسم اختياري — أضف الشهادات إن وُجدت.</p>
              {data.certifications.map((c, i) => (
                <div key={i} className="rounded-xl border border-white/10 p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-sm font-bold text-gold">شهادة #{i + 1}</span>
                    <button onClick={() => removeItem("certifications", i)} className="text-slateblue hover:text-red-400">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-3">
                    <Field label="الاسم" value={c.name} onChange={(v) => updateItem("certifications", i, "name", v)} placeholder="Meta Front-End" />
                    <Field label="الجهة" value={c.issuer} onChange={(v) => updateItem("certifications", i, "issuer", v)} placeholder="Coursera" />
                    <Field label="السنة" value={c.date} onChange={(v) => updateItem("certifications", i, "date", v)} placeholder="2023" />
                  </div>
                </div>
              ))}
              <button
                onClick={() => addItem("certifications", { name: "", issuer: "", date: "" })}
                className="btn-outline w-full !py-2.5 text-sm"
              >
                <Plus className="h-4 w-4" /> إضافة شهادة
              </button>
            </div>
          )}

          {/* خطوة: القالب والدفع */}
          {step === 7 && (
            <div className="space-y-6">
              <div>
                <span className="field-label">لغة السيرة الذاتية</span>
                <div className="flex gap-3">
                  {[
                    { id: "ar", label: "العربية (RTL)" },
                    { id: "en", label: "English (LTR)" },
                  ].map((l) => (
                    <button
                      key={l.id}
                      onClick={() => setLanguage(l.id)}
                      className={`flex-1 rounded-lg border px-4 py-2.5 text-sm font-semibold transition ${
                        language === l.id
                          ? "border-gold bg-gold/10 text-gold"
                          : "border-white/15 text-cream/80 hover:border-white/30"
                      }`}
                    >
                      {l.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <span className="field-label">القالب</span>
                <div className="grid gap-3 sm:grid-cols-3">
                  {TEMPLATES.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setTemplateId(t.id)}
                      className={`rounded-xl border p-3 text-right transition ${
                        templateId === t.id
                          ? "border-gold bg-gold/10"
                          : "border-white/15 hover:border-white/30"
                      }`}
                    >
                      <div className="font-display font-bold text-cream">{t.nameAr}</div>
                      <div className="mt-1 text-xs text-cream/60">{t.descAr}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-xl border border-gold/30 bg-gold/5 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-cream">المجموع (دفعة واحدة)</span>
                  <span className="font-display text-2xl font-black text-gold">${price}</span>
                </div>
                <p className="mt-2 text-xs text-cream/60">
                  ستُحوَّل إلى صفحة دفع Stripe الآمنة. لن تستطيع تحميل الـ PDF إلا بعد
                  تأكيد الدفع.
                </p>
              </div>

              {error && (
                <div className="rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-300">
                  {error}
                </div>
              )}

              <button onClick={handlePay} disabled={loading} className="btn-gold w-full text-lg">
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <CreditCard className="h-5 w-5" />}
                {loading ? "جاري التحويل للدفع..." : `الدفع والتحميل — $${price}`}
              </button>
            </div>
          )}
        </div>

        {/* أزرار التنقّل */}
        <div className="mt-5 flex items-center justify-between">
          <button
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={step === 0}
            className="btn-outline !py-2.5 disabled:opacity-40"
          >
            <ArrowRight className="h-4 w-4" /> السابق
          </button>
          {!isLast && (
            <button onClick={() => setStep((s) => Math.min(STEPS.length - 1, s + 1))} className="btn-gold !py-2.5">
              التالي <ArrowLeft className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* عمود المعاينة (مثبّت على الشاشات الكبيرة) */}
      <div className="hidden lg:block">
        <div className="sticky top-6">
          <div className="mb-2 flex items-center gap-2 text-sm text-slateblue">
            <Eye className="h-4 w-4" /> معاينة مباشرة
          </div>
          <CVPreview cvData={data} templateId={templateId} language={language} />
        </div>
      </div>

      {/* زر المعاينة على الموبايل */}
      <button
        onClick={() => setMobilePreview(true)}
        className="btn-gold fixed bottom-5 left-1/2 z-30 -translate-x-1/2 shadow-2xl lg:hidden"
      >
        <Eye className="h-5 w-5" /> معاينة
      </button>

      {mobilePreview && (
        <div className="fixed inset-0 z-50 bg-midnight-deep/95 p-4 lg:hidden">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-cream">المعاينة المباشرة</span>
            <button onClick={() => setMobilePreview(false)} className="text-cream">
              <X className="h-6 w-6" />
            </button>
          </div>
          <div className="h-[85vh] overflow-auto">
            <CVPreview cvData={data} templateId={templateId} language={language} />
          </div>
        </div>
      )}
    </div>
  );
}
