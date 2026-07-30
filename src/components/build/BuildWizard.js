"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
  History,
  Check,
} from "lucide-react";
import CVPreview from "@/components/CVPreview";
import { TEMPLATES, DEFAULT_TEMPLATE_ID, resolveTemplateId } from "@/lib/cvTemplates";
import {
  emptyCvData,
  blankExperience,
  blankEducation,
  blankCertification,
} from "@/lib/cvDefaults";
import { Field, TextArea, Checkbox } from "./fields";
import SectionTitleField from "./SectionTitleField";
import CustomSections from "./CustomSections";
import CvSettingsPanel from "./CvSettingsPanel";
import { useCvDraft } from "./useCvDraft";
import { useLocale } from "@/components/i18n/LocaleProvider";
import { cvLanguage, DEFAULT_CV_LANGUAGE, DEFAULT_DENSITY } from "@/lib/cvSections";

// Rebuilding the preview replaces the iframe's srcDoc, which forces a full
// document reload — far too heavy to do on every keystroke.
const PREVIEW_DEBOUNCE_MS = 250;

// `key` names the built-in section whose heading this step can rename; steps
// without one have no heading on the CV.
const STEPS = [
  { id: "personal", key: null },
  { id: "summary", key: "summary" },
  { id: "education", key: "education" },
  { id: "experience", key: "experience" },
  { id: "skills", key: "skills" },
  { id: "languages", key: "languages" },
  { id: "certifications", key: "certifications" },
  { id: "custom", key: null },
  { id: "template", key: null },
];

const LAST_STEP = STEPS.length - 1;

function freshData() {
  return JSON.parse(JSON.stringify(emptyCvData));
}

// Stable signature of the editable state, used for dirty-tracking.
function signature(data, templateId) {
  return JSON.stringify({ data, templateId });
}

export default function BuildWizard() {
  const { t, locale } = useLocale();
  const router = useRouter();
  const params = useSearchParams();
  const editId = params.get("id");

  const [step, setStep] = useState(0);
  const [data, setData] = useState(freshData);
  const [templateId, setTemplateId] = useState(DEFAULT_TEMPLATE_ID);
  const [loadingCv, setLoadingCv] = useState(!!editId);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [errorKey, setErrorKey] = useState("");
  const [mobilePreview, setMobilePreview] = useState(false);
  const [pageCount, setPageCount] = useState(1);

  // Baseline the current state is compared against to decide "dirty".
  const [baseline, setBaseline] = useState(() => signature(freshData(), DEFAULT_TEMPLATE_ID));
  // Set once the user has answered (or dismissed) the restore prompt, which is
  // what unlocks autosave — otherwise mounting would immediately overwrite the
  // very draft we are about to offer back.
  const [draftResolved, setDraftResolved] = useState(false);
  const savedRef = useRef(false);

  const { pendingDraft, dismissDraft, discardDraft, clearDraft } = useCvDraft({
    editId,
    data,
    templateId,
    enabled: draftResolved && !loadingCv,
  });

  const dirty = !savedRef.current && signature(data, templateId) !== baseline;

  // --- Load an existing CV when editing -------------------------------------
  useEffect(() => {
    if (!editId) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/cv/${editId}`);
        if (!res.ok) throw new Error();
        const json = await res.json();
        if (cancelled) return;
        const loaded = json.data || freshData();
        const tpl = resolveTemplateId(json.templateId) || DEFAULT_TEMPLATE_ID;
        setData(loaded);
        setTemplateId(tpl);
        setBaseline(signature(loaded, tpl));
      } catch {
        // Store the key, not the translated string: including `t` in the
        // dependency list would refetch the CV whenever the user switches
        // language, throwing away whatever they had typed.
        if (!cancelled) setErrorKey("builder.couldNotLoad");
      } finally {
        if (!cancelled) setLoadingCv(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [editId]);

  // Nothing to restore -> unlock autosave as soon as loading settles.
  useEffect(() => {
    if (loadingCv) return;
    if (pendingDraft === null) setDraftResolved(true);
  }, [loadingCv, pendingDraft]);

  // --- Unsaved-changes guard -------------------------------------------------
  useEffect(() => {
    if (!dirty) return;
    const onBeforeUnload = (e) => {
      e.preventDefault();
      // Modern browsers show their own copy; returnValue is still required for
      // the prompt to appear at all in some of them.
      e.returnValue = "";
      return "";
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [dirty]);

  // --- Draft restore ---------------------------------------------------------
  function restoreDraft() {
    if (pendingDraft?.data) {
      setData(pendingDraft.data);
      if (pendingDraft.templateId) {
        setTemplateId(resolveTemplateId(pendingDraft.templateId) || DEFAULT_TEMPLATE_ID);
      }
    }
    dismissDraft();
    setDraftResolved(true);
  }

  function dropDraft() {
    discardDraft();
    setDraftResolved(true);
  }

  // --- Field helpers ---------------------------------------------------------
  const setPersonal = useCallback((key, val) => {
    setData((d) => ({ ...d, personal: { ...d.personal, [key]: val } }));
  }, []);

  const setFieldVal = useCallback((key, val) => {
    setData((d) => ({ ...d, [key]: val }));
  }, []);

  const setSettings = useCallback((next) => {
    setData((d) => ({ ...d, settings: { ...(d.settings || {}), ...next } }));
  }, []);

  const setSectionTitle = useCallback((key, val) => {
    setData((d) => ({ ...d, sectionTitles: { ...(d.sectionTitles || {}), [key]: val } }));
  }, []);

  const updateItem = useCallback((listKey, index, key, val) => {
    setData((d) => {
      const list = [...(d[listKey] || [])];
      list[index] = { ...list[index], [key]: val };
      return { ...d, [listKey]: list };
    });
  }, []);

  const addItem = useCallback((listKey, template) => {
    setData((d) => ({ ...d, [listKey]: [...(d[listKey] || []), template] }));
  }, []);

  const removeItem = useCallback((listKey, index) => {
    setData((d) => ({
      ...d,
      [listKey]: (d[listKey] || []).filter((_, i) => i !== index),
    }));
  }, []);

  // --- Save ------------------------------------------------------------------
  async function handleSave() {
    setError("");
    setSaving(true);
    try {
      const res = await fetch(editId ? `/api/cv/${editId}` : "/api/cv", {
        method: editId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cvData: data, templateId }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || t("builder.couldNotSave"));

      // Release the unload guard before navigating, and drop the local draft —
      // the server copy is now authoritative.
      savedRef.current = true;
      setBaseline(signature(data, templateId));
      clearDraft();

      router.push("/dashboard");
      router.refresh();
    } catch (e) {
      setError(e.message);
      setSaving(false);
    }
  }

  const currentStep = STEPS[step];
  const isLast = step === LAST_STEP;
  const sectionTitles = data.sectionTitles || {};
  const settings = data.settings || {
    language: DEFAULT_CV_LANGUAGE,
    density: DEFAULT_DENSITY,
  };
  const cvLang = cvLanguage(settings.language);

  const previewPane = useMemo(
    () => (
      <CVPreview
        cvData={data}
        templateId={templateId}
        debounceMs={PREVIEW_DEBOUNCE_MS}
        showPageBreaks
        onPageCount={setPageCount}
      />
    ),
    [data, templateId]
  );

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
        {/* Draft restore prompt */}
        {pendingDraft && (
          <div className="mb-5 rounded-2xl border border-amber-200 bg-amber-50 p-4">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
                <History className="h-5 w-5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-display font-bold text-amber-800">
                  {t("builder.draftFound")}
                </p>
                <p className="mt-0.5 text-sm text-amber-700">
                  {t("builder.draftBody", {
                    when: new Date(pendingDraft.savedAt).toLocaleString(locale, {
                      dateStyle: "medium",
                      timeStyle: "short",
                    }),
                  })}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    onClick={restoreDraft}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-amber-600"
                  >
                    <Check className="h-3.5 w-3.5" /> {t("builder.restoreDraft")}
                  </button>
                  <button
                    onClick={dropDraft}
                    className="rounded-lg border border-amber-300 px-3 py-1.5 text-xs font-semibold text-amber-700 transition hover:bg-amber-100"
                  >
                    {t("builder.discardDraft")}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step indicator */}
        <div className="mb-6 flex flex-wrap gap-2">
          {STEPS.map((s, i) => (
            <button
              key={s.label}
              onClick={() => setStep(i)}
              className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                i === step
                  ? "bg-brand-600 text-white"
                  : i < step
                  ? "bg-brand-100 text-brand-700"
                  : "bg-white text-slate-500 hover:bg-brand-50"
              }`}
            >
              {i + 1}. {t(`builder.steps.${s.id}`)}
            </button>
          ))}
        </div>

        <div className="card min-h-[420px]">
          <div className="mb-5 flex items-center justify-between gap-3">
            <h2 className="font-display text-xl font-bold text-ink">
              {t(`builder.steps.${currentStep.id}`)}
            </h2>
            {dirty && (
              <span className="chip bg-amber-50 text-amber-700">{t("builder.unsaved")}</span>
            )}
          </div>

          {/* Every section with a heading on the CV can be renamed. */}
          {currentStep.key && (
            <SectionTitleField
              sectionKey={currentStep.key}
              cvLanguage={cvLang}
              value={sectionTitles[currentStep.key]}
              onChange={(v) => setSectionTitle(currentStep.key, v)}
            />
          )}

          {/* Personal details */}
          {step === 0 && (
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={t("common.fullName")} value={data.personal.fullName} onChange={(v) => setPersonal("fullName", v)} placeholder="e.g. Layla A. Khalil" />
              <Field label={t("builder.fields.jobTitle")} value={data.personal.jobTitle} onChange={(v) => setPersonal("jobTitle", v)} placeholder="Frontend Developer" />
              <Field label={t("builder.fields.emailAddr")} type="email" value={data.personal.email} onChange={(v) => setPersonal("email", v)} placeholder="name@email.com" />
              <Field label={t("builder.fields.phone")} value={data.personal.phone} onChange={(v) => setPersonal("phone", v)} placeholder="+970 59..." />
              <Field label={t("builder.fields.location")} value={data.personal.location} onChange={(v) => setPersonal("location", v)} placeholder="Ramallah, Palestine" />
              <Field label={t("builder.fields.linkedin", { optional: t("common.optional") })} value={data.personal.linkedin} onChange={(v) => setPersonal("linkedin", v)} placeholder="linkedin.com/in/..." />
              <Field label={t("builder.fields.website", { optional: t("common.optional") })} value={data.personal.website} onChange={(v) => setPersonal("website", v)} placeholder="example.com" />
            </div>
          )}

          {/* Summary */}
          {step === 1 && (
            <TextArea
              label={t("builder.fields.summaryLabel")}
              rows={5}
              value={data.summary}
              onChange={(v) => setFieldVal("summary", v)}
              placeholder={t("builder.fields.summaryPlaceholder")}
            />
          )}

          {/* Education */}
          {step === 2 && (
            <div className="space-y-5">
              {data.education.map((ed, i) => (
                <div key={i} className="rounded-xl border border-slate-100 p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-sm font-bold text-brand-700">{t("builder.fields.qualification", { n: i + 1 })}</span>
                    {data.education.length > 1 && (
                      <button
                        onClick={() => removeItem("education", i)}
                        className="text-slate-400 hover:text-red-500"
                        aria-label={`${t("common.delete")} ${i + 1}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Field label={t("builder.fields.degree")} value={ed.degree} onChange={(v) => updateItem("education", i, "degree", v)} placeholder="BSc in Software Engineering" />
                    <Field label={t("builder.fields.institution")} value={ed.institution} onChange={(v) => updateItem("education", i, "institution", v)} placeholder="Birzeit University" />
                    <Field label={t("builder.fields.location")} value={ed.location} onChange={(v) => updateItem("education", i, "location", v)} placeholder="Birzeit" />
                    <div className="grid grid-cols-2 gap-3">
                      <Field label={t("builder.fields.from")} value={ed.startDate} onChange={(v) => updateItem("education", i, "startDate", v)} placeholder="2015" />
                      <Field label={t("builder.fields.to")} value={ed.endDate} onChange={(v) => updateItem("education", i, "endDate", v)} placeholder="2019" />
                    </div>
                    <div className="sm:col-span-2">
                      <Field label={t("builder.fields.details", { optional: t("common.optional") })} value={ed.details} onChange={(v) => updateItem("education", i, "details", v)} placeholder="GPA, honours, graduation project..." />
                    </div>
                  </div>
                </div>
              ))}
              <button
                onClick={() => addItem("education", { ...blankEducation })}
                className="btn-outline w-full !py-2.5 text-sm"
              >
                <Plus className="h-4 w-4" /> {t("builder.fields.addQualification")}
              </button>
            </div>
          )}

          {/* Experience */}
          {step === 3 && (
            <div className="space-y-5">
              {data.experiences.map((ex, i) => (
                <div key={i} className="rounded-xl border border-slate-100 p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-sm font-bold text-brand-700">{t("builder.fields.experienceN", { n: i + 1 })}</span>
                    {data.experiences.length > 1 && (
                      <button
                        onClick={() => removeItem("experiences", i)}
                        className="text-slate-400 hover:text-red-500"
                        aria-label={`${t("common.delete")} ${i + 1}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Field label={t("builder.fields.jobTitle")} value={ex.jobTitle} onChange={(v) => updateItem("experiences", i, "jobTitle", v)} placeholder="Senior Frontend Developer" />
                    <Field label={t("builder.fields.company")} value={ex.company} onChange={(v) => updateItem("experiences", i, "company", v)} placeholder="Tech Solutions" />
                    <Field label={t("builder.fields.location")} value={ex.location} onChange={(v) => updateItem("experiences", i, "location", v)} placeholder="Ramallah" />
                    <div className="grid grid-cols-2 gap-3">
                      <Field label={t("builder.fields.from")} value={ex.startDate} onChange={(v) => updateItem("experiences", i, "startDate", v)} placeholder="2022" />
                      <Field label={t("builder.fields.to")} value={ex.endDate} onChange={(v) => updateItem("experiences", i, "endDate", v)} placeholder="2024" />
                    </div>
                  </div>
                  <div className="mt-2">
                    <Checkbox label={t("builder.fields.currentlyWork")} checked={ex.current} onChange={(v) => updateItem("experiences", i, "current", v)} />
                  </div>
                  <div className="mt-3">
                    <span className="field-label">{t("builder.fields.achievements")}</span>
                    {(ex.bullets || []).map((b, bi) => (
                      <div key={bi} className="mb-2 flex gap-2">
                        <input
                          className="field-input"
                          value={b || ""}
                          placeholder={t("builder.fields.achievementPlaceholder")}
                          onChange={(e) => {
                            const bullets = [...(ex.bullets || [])];
                            bullets[bi] = e.target.value;
                            updateItem("experiences", i, "bullets", bullets);
                          }}
                        />
                        {(ex.bullets || []).length > 1 && (
                          <button
                            onClick={() =>
                              updateItem(
                                "experiences",
                                i,
                                "bullets",
                                (ex.bullets || []).filter((_, x) => x !== bi)
                              )
                            }
                            className="text-slate-400 hover:text-red-500"
                            aria-label={`${t("common.delete")} ${bi + 1}`}
                          >
                            <X className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      onClick={() =>
                        updateItem("experiences", i, "bullets", [...(ex.bullets || []), ""])
                      }
                      className="text-sm font-semibold text-brand-700 hover:underline"
                    >
                      {t("builder.fields.addBullet")}
                    </button>
                  </div>
                </div>
              ))}
              <button
                onClick={() => addItem("experiences", { ...blankExperience, bullets: [""] })}
                className="btn-outline w-full !py-2.5 text-sm"
              >
                <Plus className="h-4 w-4" /> {t("builder.fields.addExperience")}
              </button>
            </div>
          )}

          {/* Skills */}
          {step === 4 && (
            <div className="space-y-3">
              <p className="text-sm text-slate-600">{t("builder.fields.skillsHint")}</p>
              {data.skills.map((sk, i) => (
                <div key={i} className="flex gap-2">
                  <input
                    className="field-input"
                    value={sk || ""}
                    placeholder="e.g. React"
                    onChange={(e) => {
                      const skills = [...data.skills];
                      skills[i] = e.target.value;
                      setFieldVal("skills", skills);
                    }}
                  />
                  {data.skills.length > 1 && (
                    <button
                      onClick={() => removeItem("skills", i)}
                      className="text-slate-400 hover:text-red-500"
                      aria-label={`${t("common.delete")} ${i + 1}`}
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
              <button onClick={() => addItem("skills", "")} className="text-sm font-semibold text-brand-700 hover:underline">
                {t("builder.fields.addSkill")}
              </button>
            </div>
          )}

          {/* Languages */}
          {step === 5 && (
            <div className="space-y-3">
              {data.languages.map((lg, i) => (
                <div key={i} className="flex items-end gap-2">
                  <div className="flex-1">
                    <Field label={t("builder.fields.languageName")} value={lg.name} onChange={(v) => updateItem("languages", i, "name", v)} placeholder="English" />
                  </div>
                  <div className="flex-1">
                    <Field label={t("builder.fields.level")} value={lg.level} onChange={(v) => updateItem("languages", i, "level", v)} placeholder="Fluent" />
                  </div>
                  {data.languages.length > 1 && (
                    <button
                      onClick={() => removeItem("languages", i)}
                      className="mb-2.5 text-slate-400 hover:text-red-500"
                      aria-label={`${t("common.delete")} ${i + 1}`}
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
              <button onClick={() => addItem("languages", { name: "", level: "" })} className="text-sm font-semibold text-brand-700 hover:underline">
                {t("builder.fields.addLanguage")}
              </button>
            </div>
          )}

          {/* Certifications */}
          {step === 6 && (
            <div className="space-y-3">
              <p className="text-sm text-slate-600">{t("builder.fields.certsHint")}</p>
              {data.certifications.map((c, i) => (
                <div key={i} className="rounded-xl border border-slate-100 p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-sm font-bold text-brand-700">{t("builder.fields.certificateN", { n: i + 1 })}</span>
                    <button
                      onClick={() => removeItem("certifications", i)}
                      className="text-slate-400 hover:text-red-500"
                      aria-label={`${t("common.delete")} ${i + 1}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-3">
                    <Field label={t("builder.fields.certName")} value={c.name} onChange={(v) => updateItem("certifications", i, "name", v)} placeholder="Meta Front-End" />
                    <Field label={t("builder.fields.issuer")} value={c.issuer} onChange={(v) => updateItem("certifications", i, "issuer", v)} placeholder="Coursera" />
                    <Field label={t("builder.fields.year")} value={c.date} onChange={(v) => updateItem("certifications", i, "date", v)} placeholder="2023" />
                  </div>
                </div>
              ))}
              <button
                onClick={() => addItem("certifications", { ...blankCertification })}
                className="btn-outline w-full !py-2.5 text-sm"
              >
                <Plus className="h-4 w-4" /> {t("builder.fields.addCertificate")}
              </button>
            </div>
          )}

          {/* Custom sections */}
          {step === 7 && (
            <CustomSections
              sections={data.customSections}
              cvLanguage={cvLang}
              onChange={(v) => setFieldVal("customSections", v)}
            />
          )}

          {/* Template & save */}
          {step === 8 && (
            <div className="space-y-6">
              <CvSettingsPanel
                settings={settings}
                onChange={setSettings}
                pageCount={pageCount}
              />

              <div>
                <span className="field-label">{t("builder.templateStep.choose")}</span>
                <div className="grid gap-3 sm:grid-cols-2">
                  {TEMPLATES.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setTemplateId(t.id)}
                      className={`rounded-xl border p-3 text-start transition ${
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
                {t("builder.templateStep.readyNote")}
              </div>

              {(error || errorKey) && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-600">
                  {error || t(errorKey)}
                </div>
              )}

              <button onClick={handleSave} disabled={saving} className="btn-primary w-full text-lg">
                {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
                {saving ? t("common.saving") : editId ? t("builder.saveChanges") : t("builder.saveCv")}
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
            <ArrowLeft className="h-4 w-4" /> {t("common.back")}
          </button>
          {!isLast && (
            <button onClick={() => setStep((s) => Math.min(LAST_STEP, s + 1))} className="btn-primary !py-2.5">
              {t("common.next")} <ArrowRight className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Preview column (sticky on large screens) */}
      <div className="hidden lg:block">
        <div className="sticky top-20">
          <div className="mb-2 flex items-center gap-2 text-sm text-slate-500">
            <Eye className="h-4 w-4" /> {t("builder.livePreview")}
          </div>
          {previewPane}
        </div>
      </div>

      {/* Mobile preview button */}
      <button
        onClick={() => setMobilePreview(true)}
        className="btn-primary fixed bottom-5 left-1/2 z-30 -translate-x-1/2 shadow-2xl lg:hidden"
      >
        <Eye className="h-5 w-5" /> {t("builder.preview")}
      </button>

      {mobilePreview && (
        <div className="fixed inset-0 z-50 bg-white/95 p-4 lg:hidden">
          <div className="mb-3 flex items-center justify-between">
            <span className="font-semibold text-ink">{t("builder.livePreview")}</span>
            <button onClick={() => setMobilePreview(false)} className="text-ink" aria-label={t("common.close")}>
              <X className="h-6 w-6" />
            </button>
          </div>
          <div className="h-[85vh] overflow-auto">{previewPane}</div>
        </div>
      )}
    </div>
  );
}
