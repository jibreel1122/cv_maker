"use client";

// Small reusable input fields used across the CV builder form.

export function Field({ label, value, onChange, placeholder, type = "text" }) {
  return (
    <label className="block">
      <span className="field-label">{label}</span>
      <input
        type={type}
        className="field-input"
        value={value || ""}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}

export function TextArea({ label, value, onChange, placeholder, rows = 3 }) {
  return (
    <label className="block">
      <span className="field-label">{label}</span>
      <textarea
        rows={rows}
        className="field-input resize-y"
        value={value || ""}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}

export function Checkbox({ label, checked, onChange }) {
  return (
    <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-700">
      <input
        type="checkbox"
        className="h-4 w-4 accent-brand-600"
        checked={!!checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      {label}
    </label>
  );
}
