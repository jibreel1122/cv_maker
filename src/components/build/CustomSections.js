"use client";

import { useId } from "react";
import { Plus, Trash2, X, LayoutList, AlignLeft, List } from "lucide-react";
import { customSectionPresets, customLayout } from "@/lib/cvSections";
import { blankCustomItem } from "@/lib/cvDefaults";
import { useT } from "@/components/i18n/LocaleProvider";
import { Field, TextArea } from "./fields";

// Editor for user-defined CV sections.
//
// Two layouts, because two kinds of user ask for this section:
//   entries   the structured shape shared with the built-in sections — title,
//             dates, bullets — for people who want the CV to look consistent
//   freeText  one block of prose, for people who would rather just write than
//             fill in a form. This is the single most common request from
//             non-technical users, who find field-by-field entry slower than
//             typing what they already know how to say.

function BulletEditor({ bullets, onChange, placeholder, label, addLabel }) {
  const list = Array.isArray(bullets) ? bullets : [];

  return (
    <div className="mt-3">
      <span className="field-label">{label}</span>
      {list.map((b, i) => (
        <div key={i} className="mb-2 flex gap-2">
          <input
            className="field-input"
            value={b || ""}
            placeholder={placeholder}
            onChange={(e) => {
              const next = [...list];
              next[i] = e.target.value;
              onChange(next);
            }}
          />
          {list.length > 1 && (
            <button
              type="button"
              onClick={() => onChange(list.filter((_, x) => x !== i))}
              className="text-slate-400 transition hover:text-red-500"
              aria-label={`${label} ${i + 1}`}
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      ))}
      <button
        type="button"
        onClick={() => onChange([...list, ""])}
        className="text-sm font-semibold text-brand-700 transition hover:underline"
      >
        {addLabel}
      </button>
    </div>
  );
}

function LayoutToggle({ value, onChange }) {
  const t = useT();
  const options = [
    { id: "entries", icon: List, label: t("builder.custom.layoutEntries"), hint: t("builder.custom.layoutEntriesHint") },
    { id: "freeText", icon: AlignLeft, label: t("builder.custom.layoutFreeText"), hint: t("builder.custom.layoutFreeTextHint") },
  ];

  return (
    <div className="mt-3">
      <span className="field-label">{t("builder.custom.layout")}</span>
      <div className="grid gap-2 sm:grid-cols-2">
        {options.map((o) => {
          const active = customLayout(value) === o.id;
          return (
            <button
              key={o.id}
              type="button"
              onClick={() => onChange(o.id)}
              aria-pressed={active}
              className={`rounded-xl border p-2.5 text-start transition ${
                active
                  ? "border-brand-500 bg-brand-50 ring-2 ring-brand-500/20"
                  : "border-slate-200 bg-white hover:border-brand-300"
              }`}
            >
              <span className="flex items-center gap-2 text-sm font-semibold text-ink">
                <o.icon className="h-4 w-4 text-brand-600" /> {o.label}
              </span>
              <span className="mt-0.5 block text-xs text-slate-500">{o.hint}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function CustomSection({ section, index, onUpdate, onRemove, cvLanguage }) {
  const t = useT();
  const listId = useId();
  const items = Array.isArray(section.items) ? section.items : [];
  const layout = customLayout(section.layout);
  const presets = customSectionPresets(cvLanguage);

  function updateItem(itemIndex, key, value) {
    const next = items.map((it, i) => (i === itemIndex ? { ...it, [key]: value } : it));
    onUpdate({ ...section, items: next });
  }

  return (
    <div className="rounded-2xl border border-brand-200 bg-brand-50/40 p-4">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="flex-1">
          <label className="block">
            <span className="field-label !mb-1">{t("builder.custom.sectionTitle")}</span>
            <input
              className="field-input !bg-white"
              value={section.title || ""}
              list={listId}
              placeholder={t("builder.custom.sectionPlaceholder")}
              onChange={(e) => onUpdate({ ...section, title: e.target.value })}
            />
          </label>
          <datalist id={listId}>
            {presets.map((p) => (
              <option key={p} value={p} />
            ))}
          </datalist>
        </div>
        <button
          type="button"
          onClick={onRemove}
          className="mt-7 shrink-0 text-slate-400 transition hover:text-red-500"
          aria-label={`${t("common.delete")} ${section.title || index + 1}`}
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      {!section.title && (
        <p className="mb-3 text-xs text-amber-600">{t("builder.custom.untitledWarning")}</p>
      )}

      <LayoutToggle value={layout} onChange={(v) => onUpdate({ ...section, layout: v })} />

      {layout === "freeText" ? (
        <div className="mt-3">
          <TextArea
            label={t("builder.custom.description")}
            rows={6}
            value={section.text}
            placeholder={t("builder.custom.freeTextPlaceholder")}
            onChange={(v) => onUpdate({ ...section, text: v })}
          />
        </div>
      ) : (
        <>
          <div className="mt-3 space-y-3">
            {items.map((item, i) => (
              <div key={i} className="rounded-xl border border-slate-200 bg-white p-3">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wide text-brand-700">
                    {t("builder.custom.entryN", { n: i + 1 })}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      onUpdate({ ...section, items: items.filter((_, x) => x !== i) })
                    }
                    className="text-slate-400 transition hover:text-red-500"
                    aria-label={`${t("common.delete")} ${i + 1}`}
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field
                    label={t("builder.custom.itemTitle")}
                    value={item.title}
                    onChange={(v) => updateItem(i, "title", v)}
                  />
                  <Field
                    label={t("builder.custom.subtitle")}
                    value={item.subtitle}
                    onChange={(v) => updateItem(i, "subtitle", v)}
                  />
                  <Field
                    label={t("builder.custom.dates")}
                    value={item.dateRange}
                    onChange={(v) => updateItem(i, "dateRange", v)}
                  />
                  <Field
                    label={t("builder.fields.location")}
                    value={item.location}
                    onChange={(v) => updateItem(i, "location", v)}
                  />
                </div>
                <BulletEditor
                  bullets={item.descriptionBullets}
                  label={t("builder.custom.description")}
                  addLabel={t("builder.custom.addLine")}
                  placeholder={t("builder.custom.descriptionPlaceholder")}
                  onChange={(v) => updateItem(i, "descriptionBullets", v)}
                />
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={() => onUpdate({ ...section, items: [...items, { ...blankCustomItem }] })}
            className="btn-outline mt-3 w-full !py-2 text-sm"
          >
            <Plus className="h-4 w-4" /> {t("builder.custom.addEntry")}
          </button>
        </>
      )}
    </div>
  );
}

export default function CustomSections({ sections, onChange, cvLanguage }) {
  const t = useT();
  const list = Array.isArray(sections) ? sections : [];
  const presets = customSectionPresets(cvLanguage);

  function addSection(title = "") {
    onChange([
      ...list,
      { title, layout: "entries", items: [{ ...blankCustomItem }], text: "" },
    ]);
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-600">{t("builder.custom.intro")}</p>

      {list.length === 0 && (
        <div className="flex flex-col items-center rounded-2xl border border-dashed border-slate-200 py-10 text-center">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
            <LayoutList className="h-5 w-5" />
          </span>
          <p className="mt-3 text-sm font-semibold text-ink">
            {t("builder.custom.emptyTitle")}
          </p>
          <p className="mt-1 max-w-xs text-xs text-slate-500">
            {t("builder.custom.emptyBody")}
          </p>
        </div>
      )}

      {list.map((section, i) => (
        <CustomSection
          key={i}
          section={section}
          index={i}
          cvLanguage={cvLanguage}
          onUpdate={(next) => onChange(list.map((s, x) => (x === i ? next : s)))}
          onRemove={() => onChange(list.filter((_, x) => x !== i))}
        />
      ))}

      <button
        type="button"
        onClick={() => addSection()}
        className="btn-primary w-full !py-2.5 text-sm"
      >
        <Plus className="h-4 w-4" /> {t("builder.custom.addSection")}
      </button>

      <div>
        <p className="field-label">{t("builder.custom.orPreset")}</p>
        <div className="flex flex-wrap gap-2">
          {presets.map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => addSection(preset)}
              className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-brand-300 hover:text-brand-700"
            >
              + {preset}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
