"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Plus,
  Trash2,
  Loader2,
  Save,
  Eye,
  X,
} from "lucide-react";
import CVPreview from "@/components/CVPreview";
import { TEMPLATES } from "@/lib/cvTemplates";
import { emptyCvData } from "@/lib/cvDefaults";
import { Field, TextArea, Checkbox } from "./fields";

const STEPS = [
  "Personal details",
  "Summary",
  "Education",
  "Experience",
  "Skills",
  "Languages",
  "Certifications",
  "Template & save",
];

function freshData() {
  return JSON.parse(JSON.stringify(emptyCvData));
}

export default function BuildWizard() {
  const router = useRouter();
  const params = useSearchParams();
  const editId = params.get("id");

  const [step, setStep] = useState(0);
  const [data, setData] = useState(freshData);
  const [templateId, setTemplateId] = useState("modern");
  const [loadingCv, setLoadingCv] = useState(!!editId);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [mobilePreview, setMobilePreview] = useState(false);

  // Load an existing CV when editing.
  useEffect(() => {
    if (!editId) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/cv/${editId}`);
        if (!res.ok) throw new Error();
        const json = await res.json();
        if (cancelled) return;
        if (json.data) setData(json.data);
        if (json.templateId) setTemplateId(json.templateId);
      } catch {
        if (!cancelled) setError("Could not load this CV.");
      } finally {
        if (!cancelled) setLoadingCv(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [editId]);

  function setPersonal(key, val) {
    setData((d) => ({ ...d, personal: { ...d.personal, [key]: val } }));
  }
  function setFieldVal(key, val) {
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

  async function handleSave() {
    setError("");
    setSaving(true);
    try {
      const payload = { cvData: data, templateId };
      const res = await fetch(editId ? `/api/cv/${editId}` : "/api/cv", {
        method: editId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Could not save the CV.");
      router.push("/dashboard");
      router.refresh();
    } catch (e) {
      setError(e.message);
      setSaving(false);
    }
  }

  const isLast = step === STEPS.length - 1;

  if (loadingCv) {
    return (
      <div className="flex items-center justify-center py-24 text-slate-400">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      {/* Form column */}
      <div>
        {/* Step indicator */}
        <div className="mb-6 flex flex-wrap gap-2">
          {STEPS.map((s, i) => (
            <button
              key={s}
              onClick={() => setStep(i)}
              className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                i === step
                  ? "bg-brand-600 text-white"
                  : i < step
                  ? "bg-brand-100 text-brand-700"
                  : "bg-white text-slate-500 hover:bg-brand-50"
              }`}
            >
              {i + 1}. {s}
            </button>
          ))}
        </div>

        <div className="card min-h-[420px]">
          <h2 className="mb-5 font-display text-xl font-bold text-ink">{STEPS[step]}</h2>

          {/* Personal details */}
          {step === 0 && (
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Full name" value={data.personal.fullName} onChange={(v) => setPersonal("fullName", v)} placeholder="e.g. Layla A. Khalil" />
              <Field label="Job title" value={data.personal.jobTitle} onChange={(v) => setPersonal("jobTitle", v)} placeholder="Frontend Developer" />
              <Field label="Email" type="email" value={data.personal.email} onChange={(v) => setPersonal("email", v)} placeholder="name@email.com" />
              <Field label="Phone" value={data.personal.phone} onChange={(v) => setPersonal("phone", v)} placeholder="+970 59..." />
              <Field label="Location (city, country)" value={data.personal.location} onChange={(v) => setPersonal("location", v)} placeholder="Ramallah, Palestine" />
              <Field label="LinkedIn (optional)" value={data.personal.linkedin} onChange={(v) => setPersonal("linkedin", v)} placeholder="linkedin.com/in/..." />
              <Field label="Website / portfolio (optional)" value={data.personal.website} onChange={(v) => setPersonal("website", v)} placeholder="example.com" />
            </div>
          )}

          {/* Summary */}
          {step === 1 && (
            <TextArea
              label="Professional summary (2–3 lines)"
              rows={5}
              value={data.summary}
              onChange={(v) => setFieldVal("summary", v)}
              placeholder="A brief overview of your experience and strongest skills..."
            />
          )}

          {/* Education */}
          {step === 2 && (
            <div className="space-y-5">
              {data.education.map((ed, i) => (
                <div key={i} className="rounded-xl border border-slate-100 p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-sm font-bold text-brand-700">Qualification #{i + 1}</span>
                    {data.education.length > 1 && (
                      <button onClick={() => removeItem("education", i)} className="text-slate-400 hover:text-red-500">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Field label="Degree / field" value={ed.degree} onChange={(v) => updateItem("education", i, "degree", v)} placeholder="BSc in Software Engineering" />
                    <Field label="Institution" value={ed.institution} onChange={(v) => updateItem("education", i, "institution", v)} placeholder="Birzeit University" />
                    <Field label="Location" value={ed.location} onChange={(v) => updateItem("education", i, "location", v)} placeholder="Birzeit" />
                    <div className="grid grid-cols-2 gap-3">
                      <Field label="From" value={ed.startDate} onChange={(v) => updateItem("education", i, "startDate", v)} placeholder="2015" />
                      <Field label="To" value={ed.endDate} onChange={(v) => updateItem("education", i, "endDate", v)} placeholder="2019" />
                    </div>
                    <div className="sm:col-span-2">
                      <Field label="Details (optional)" value={ed.details} onChange={(v) => updateItem("education", i, "details", v)} placeholder="GPA, honours, graduation project..." />
                    </div>
                  </div>
                </div>
              ))}
              <button
                onClick={() => addItem("education", { degree: "", institution: "", location: "", startDate: "", endDate: "", details: "" })}
                className="btn-outline w-full !py-2.5 text-sm"
              >
                <Plus className="h-4 w-4" /> Add qualification
              </button>
            </div>
          )}

          {/* Experience */}
          {step === 3 && (
            <div className="space-y-5">
              {data.experiences.map((ex, i) => (
                <div key={i} className="rounded-xl border border-slate-100 p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-sm font-bold text-brand-700">Experience #{i + 1}</span>
                    {data.experiences.length > 1 && (
                      <button onClick={() => removeItem("experiences", i)} className="text-slate-400 hover:text-red-500">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Field label="Job title" value={ex.jobTitle} onChange={(v) => updateItem("experiences", i, "jobTitle", v)} placeholder="Senior Frontend Developer" />
                    <Field label="Company" value={ex.company} onChange={(v) => updateItem("experiences", i, "company", v)} placeholder="Tech Solutions" />
                    <Field label="Location" value={ex.location} onChange={(v) => updateItem("experiences", i, "location", v)} placeholder="Ramallah" />
                    <div className="grid grid-cols-2 gap-3">
                      <Field label="From" value={ex.startDate} onChange={(v) => updateItem("experiences", i, "startDate", v)} placeholder="2022" />
                      <Field label="To" value={ex.endDate} onChange={(v) => updateItem("experiences", i, "endDate", v)} placeholder="2024" />
                    </div>
                  </div>
                  <div className="mt-2">
                    <Checkbox label="I currently work here" checked={ex.current} onChange={(v) => updateItem("experiences", i, "current", v)} />
                  </div>
                  <div className="mt-3">
                    <span className="field-label">Achievements</span>
                    {(ex.bullets || []).map((b, bi) => (
                      <div key={bi} className="mb-2 flex gap-2">
                        <input
                          className="field-input"
                          value={b}
                          placeholder="A measurable achievement starting with a verb..."
                          onChange={(e) => {
                            const bullets = [...ex.bullets];
                            bullets[bi] = e.target.value;
                            updateItem("experiences", i, "bullets", bullets);
                          }}
                        />
                        {ex.bullets.length > 1 && (
                          <button
                            onClick={() => updateItem("experiences", i, "bullets", ex.bullets.filter((_, x) => x !== bi))}
                            className="text-slate-400 hover:text-red-500"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      onClick={() => updateItem("experiences", i, "bullets", [...(ex.bullets || []), ""])}
                      className="text-sm font-semibold text-brand-700 hover:underline"
                    >
                      + Add bullet
                    </button>
                  </div>
                </div>
              ))}
              <button
                onClick={() => addItem("experiences", { jobTitle: "", company: "", location: "", startDate: "", endDate: "", current: false, bullets: [""] })}
                className="btn-outline w-full !py-2.5 text-sm"
              >
                <Plus className="h-4 w-4" /> Add experience
              </button>
            </div>
          )}

          {/* Skills */}
          {step === 4 && (
            <div className="space-y-3">
              <p className="text-sm text-slate-600">Add your technical and soft skills.</p>
              {data.skills.map((sk, i) => (
                <div key={i} className="flex gap-2">
                  <input
                    className="field-input"
                    value={sk}
                    placeholder="e.g. React"
                    onChange={(e) => {
                      const skills = [...data.skills];
                      skills[i] = e.target.value;
                      setFieldVal("skills", skills);
                    }}
                  />
                  {data.skills.length > 1 && (
                    <button onClick={() => removeItem("skills", i)} className="text-slate-400 hover:text-red-500">
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
              <button onClick={() => addItem("skills", "")} className="text-sm font-semibold text-brand-700 hover:underline">
                + Add skill
              </button>
            </div>
          )}

          {/* Languages */}
          {step === 5 && (
            <div className="space-y-3">
              {data.languages.map((lg, i) => (
                <div key={i} className="flex items-end gap-2">
                  <div className="flex-1">
                    <Field label="Language" value={lg.name} onChange={(v) => updateItem("languages", i, "name", v)} placeholder="English" />
                  </div>
                  <div className="flex-1">
                    <Field label="Level" value={lg.level} onChange={(v) => updateItem("languages", i, "level", v)} placeholder="Fluent" />
                  </div>
                  {data.languages.length > 1 && (
                    <button onClick={() => removeItem("languages", i)} className="mb-2.5 text-slate-400 hover:text-red-500">
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
              <button onClick={() => addItem("languages", { name: "", level: "" })} className="text-sm font-semibold text-brand-700 hover:underline">
                + Add language
              </button>
            </div>
          )}

          {/* Certifications */}
          {step === 6 && (
            <div className="space-y-3">
              <p className="text-sm text-slate-600">Optional — add certifications if you have any.</p>
              {data.certifications.map((c, i) => (
                <div key={i} className="rounded-xl border border-slate-100 p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-sm font-bold text-brand-700">Certificate #{i + 1}</span>
                    <button onClick={() => removeItem("certifications", i)} className="text-slate-400 hover:text-red-500">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-3">
                    <Field label="Name" value={c.name} onChange={(v) => updateItem("certifications", i, "name", v)} placeholder="Meta Front-End" />
                    <Field label="Issuer" value={c.issuer} onChange={(v) => updateItem("certifications", i, "issuer", v)} placeholder="Coursera" />
                    <Field label="Year" value={c.date} onChange={(v) => updateItem("certifications", i, "date", v)} placeholder="2023" />
                  </div>
                </div>
              ))}
              <button
                onClick={() => addItem("certifications", { name: "", issuer: "", date: "" })}
                className="btn-outline w-full !py-2.5 text-sm"
              >
                <Plus className="h-4 w-4" /> Add certificate
              </button>
            </div>
          )}

          {/* Template & save */}
          {step === 7 && (
            <div className="space-y-6">
              <div>
                <span className="field-label">Choose a template</span>
                <div className="grid gap-3 sm:grid-cols-2">
                  {TEMPLATES.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setTemplateId(t.id)}
                      className={`rounded-xl border p-3 text-left transition ${
                        templateId === t.id
                          ? "border-brand-500 bg-brand-50 ring-2 ring-brand-500/20"
                          : "border-slate-200 hover:border-brand-300"
                      }`}
                    >
                      <div className="font-display font-bold text-ink">{t.name}</div>
                      <div className="mt-1 text-xs text-slate-500">{t.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-xl border border-brand-200 bg-brand-50 p-4 text-sm text-brand-800">
                Your CV is in English and ready to download as a polished PDF —
                free, with no watermark.
              </div>

              {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-600">
                  {error}
                </div>
              )}

              <button onClick={handleSave} disabled={saving} className="btn-primary w-full text-lg">
                {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
                {saving ? "Saving..." : editId ? "Save changes" : "Save CV"}
              </button>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="mt-5 flex items-center justify-between">
          <button
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={step === 0}
            className="btn-outline !py-2.5 disabled:opacity-40"
          >
            <ArrowLeft className="h-4 w-4" /> Back
          </button>
          {!isLast && (
            <button onClick={() => setStep((s) => Math.min(STEPS.length - 1, s + 1))} className="btn-primary !py-2.5">
              Next <ArrowRight className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Preview column (sticky on large screens) */}
      <div className="hidden lg:block">
        <div className="sticky top-20">
          <div className="mb-2 flex items-center gap-2 text-sm text-slate-500">
            <Eye className="h-4 w-4" /> Live preview
          </div>
          <CVPreview cvData={data} templateId={templateId} />
        </div>
      </div>

      {/* Mobile preview button */}
      <button
        onClick={() => setMobilePreview(true)}
        className="btn-primary fixed bottom-5 left-1/2 z-30 -translate-x-1/2 shadow-2xl lg:hidden"
      >
        <Eye className="h-5 w-5" /> Preview
      </button>

      {mobilePreview && (
        <div className="fixed inset-0 z-50 bg-white/95 p-4 lg:hidden">
          <div className="mb-3 flex items-center justify-between">
            <span className="font-semibold text-ink">Live preview</span>
            <button onClick={() => setMobilePreview(false)} className="text-ink">
              <X className="h-6 w-6" />
            </button>
          </div>
          <div className="h-[85vh] overflow-auto">
            <CVPreview cvData={data} templateId={templateId} />
          </div>
        </div>
      )}
    </div>
  );
}
