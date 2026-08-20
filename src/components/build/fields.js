"use client";

// Small reusable input fields used across the CV builder form.

import { useCallback, useEffect, useId, useRef } from "react";

// A textarea that starts one line tall and grows as the user types or presses
// Enter, so a field that usually holds one line does not look like a comment
// box — but never traps what someone wants to write onto a second line.
//
// This is why most fields on the builder are textareas rather than inputs: a
// job title, a degree and its specialisation, or an achievement often want a
// deliberate line break, and an <input> silently swallows the Enter key.
export function AutoTextArea({
  value,
  onChange,
  placeholder,
  className = "",
  minRows = 1,
  ...rest
}) {
  const ref = useRef(null);

  const resize = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    // Reset first: without it the box can only ever grow, never shrink back
    // when the user deletes a line.
    el.style.height = "auto";
    // `scrollHeight` covers content and padding but not the border, while the
    // fields are `border-box` — so the border has to be added back, or the last
    // line sits a couple of pixels under the bottom edge.
    const style = window.getComputedStyle(el);
    const border =
      Number.parseFloat(style.borderTopWidth) + Number.parseFloat(style.borderBottomWidth);
    el.style.height = `${el.scrollHeight + (Number.isFinite(border) ? border : 0)}px`;
  }, []);

  // Re-measure when the value changes from outside (loading a saved CV,
  // restoring a draft, picking a suggestion) as well as on input.
  useEffect(resize, [value, resize]);

  return (
    <textarea
      ref={ref}
      rows={minRows}
      // `resize-y` still lets the user drag it taller if they want to see more
      // of a long entry at once.
      className={`field-input resize-y overflow-hidden ${className}`}
      value={value || ""}
      placeholder={placeholder}
      onChange={(e) => {
        onChange(e.target.value);
        resize();
      }}
      {...rest}
    />
  );
}

// A labelled field. Multi-line by default — see AutoTextArea. Pass
// `singleLine` for the few values that genuinely are one line (dates, email,
// phone), where a stray newline would only ever be a mistake; `suggestions`
// attaches a datalist and therefore implies `singleLine`, since a <datalist>
// only binds to an <input>.
export function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  singleLine = false,
  suggestions,
  hint,
  children,
}) {
  const listId = useId();
  const hasSuggestions = Array.isArray(suggestions) && suggestions.length > 0;

  return (
    <label className="block">
      <span className="field-label">{label}</span>
      {singleLine || hasSuggestions ? (
        <>
          <input
            type={type}
            className="field-input"
            value={value || ""}
            placeholder={placeholder}
            list={hasSuggestions ? listId : undefined}
            onChange={(e) => onChange(e.target.value)}
          />
          {hasSuggestions && (
            <datalist id={listId}>
              {suggestions.map((s) => (
                <option key={s} value={s} />
              ))}
            </datalist>
          )}
        </>
      ) : (
        <AutoTextArea value={value} onChange={onChange} placeholder={placeholder} />
      )}
      {children}
      {hint && <span className="mt-1 block text-xs text-slate-400">{hint}</span>}
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
