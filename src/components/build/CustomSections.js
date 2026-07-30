"use client";

import { useId } from "react";
import { Plus, Trash2, X, LayoutList } from "lucide-react";
import { CUSTOM_SECTION_PRESETS } from "@/lib/cvSections";
import { blankCustomItem } from "@/lib/cvDefaults";
import { Field } from "./fields";

// Editor for user-defined CV sections.
//
// One generic shape — title / subtitle / dates / location / bullets — covers
// projects, volunteering, publications, awards, courses and anything else a
// user invents, and renders identically to the built-in sections so a custom
// section is visually indistinguishable from a native one.

function BulletEditor({ bullets, onChange, placeholder }) {
  const list = Array.isArray(bullets) ? bullets : [];

  return (
    <div className="mt-3">
      <span className="field-label">Description</span>
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
              aria-label={`Remove description line ${i + 1}`}
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
        + Add line
      </button>
    </div>
  );
}

function CustomSection({ section, index, onUpdate, onRemove }) {
  const listId = useId();
  const items = Array.isArray(section.items) ? section.items : [];

  function updateItem(itemIndex, key, value) {
    const next = items.map((it, i) => (i === itemIndex ? { ...it, [key]: value } : it));
    onUpdate({ ...section, items: next });
  }

  return (
    <div className="rounded-2xl border border-brand-200 bg-brand-50/40 p-4">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="flex-1">
          <label className="block">
            <span className="field-label !mb-1">Section title</span>
            <input
              className="field-input !bg-white"
              value={section.title || ""}
              list={listId}
              placeholder="e.g. Projects & Portfolios"
              onChange={(e) => onUpdate({ ...section, title: e.target.value })}
            />
          </label>
          <datalist id={listId}>
            {CUSTOM_SECTION_PRESETS.map((p) => (
              <option key={p} value={p} />
            ))}
          </datalist>
        </div>
        <button
          type="button"
          onClick={onRemove}
          className="mt-7 shrink-0 text-slate-400 transition hover:text-red-500"
          aria-label={`Remove section ${section.title || index + 1}`}
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      {!section.title && (
        <p className="mb-3 text-xs text-amber-600">
          Give this section a title — untitled sections are left off the CV.
        </p>
      )}

      <div className="space-y-3">
        {items.map((item, i) => (
          <div key={i} className="rounded-xl border border-slate-200 bg-white p-3">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wide text-brand-700">
                Entry #{i + 1}
              </span>
              <button
                type="button"
                onClick={() =>
                  onUpdate({ ...section, items: items.filter((_, x) => x !== i) })
                }
                className="text-slate-400 transition hover:text-red-500"
                aria-label={`Remove entry ${i + 1}`}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field
                label="Title"
                value={item.title}
                onChange={(v) => updateItem(i, "title", v)}
                placeholder="e.g. Inventory management system"
              />
              <Field
                label="Subtitle (organisation, role, publisher…)"
                value={item.subtitle}
                onChange={(v) => updateItem(i, "subtitle", v)}
                placeholder="e.g. Birzeit University"
              />
              <Field
                label="Dates"
                value={item.dateRange}
                onChange={(v) => updateItem(i, "dateRange", v)}
                placeholder="e.g. 2023 — 2024"
              />
              <Field
                label="Location"
                value={item.location}
                onChange={(v) => updateItem(i, "location", v)}
                placeholder="e.g. Ramallah"
              />
            </div>
            <BulletEditor
              bullets={item.descriptionBullets}
              placeholder="What you did and what it achieved…"
              onChange={(v) => updateItem(i, "descriptionBullets", v)}
            />
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={() =>
          onUpdate({ ...section, items: [...items, { ...blankCustomItem }] })
        }
        className="btn-outline mt-3 w-full !py-2 text-sm"
      >
        <Plus className="h-4 w-4" /> Add entry
      </button>
    </div>
  );
}

export default function CustomSections({ sections, onChange }) {
  const list = Array.isArray(sections) ? sections : [];

  function addSection(title = "") {
    onChange([...list, { title, items: [{ ...blankCustomItem }] }]);
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-600">
        Add any section your CV needs beyond the standard ones. These appear on
        the CV in the same style as the built-in sections.
      </p>

      {list.length === 0 && (
        <div className="flex flex-col items-center rounded-2xl border border-dashed border-slate-200 py-10 text-center">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
            <LayoutList className="h-5 w-5" />
          </span>
          <p className="mt-3 text-sm font-semibold text-ink">No custom sections yet</p>
          <p className="mt-1 max-w-xs text-xs text-slate-500">
            Common additions: projects, volunteering, publications, awards.
          </p>
        </div>
      )}

      {list.map((section, i) => (
        <CustomSection
          key={i}
          section={section}
          index={i}
          onUpdate={(next) => onChange(list.map((s, x) => (x === i ? next : s)))}
          onRemove={() => onChange(list.filter((_, x) => x !== i))}
        />
      ))}

      <button type="button" onClick={() => addSection()} className="btn-primary w-full !py-2.5 text-sm">
        <Plus className="h-4 w-4" /> Add Custom Section
      </button>

      <div>
        <p className="field-label">Or start from a common section</p>
        <div className="flex flex-wrap gap-2">
          {CUSTOM_SECTION_PRESETS.map((preset) => (
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
