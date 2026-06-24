"use client";

// حقول إدخال صغيرة قابلة لإعادة الاستخدام في فورم البناء.

export function Field({ label, value, onChange, placeholder, type = "text", dir }) {
  return (
    <label className="block">
      <span className="field-label">{label}</span>
      <input
        type={type}
        dir={dir}
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
    <label className="flex cursor-pointer items-center gap-2 text-sm text-cream/90">
      <input
        type="checkbox"
        className="h-4 w-4 accent-gold"
        checked={!!checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      {label}
    </label>
  );
}
