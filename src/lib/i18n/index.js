// Translation lookup.
//
// Both dictionaries are small plain objects and both locales are switchable at
// runtime without a page load, so they are bundled together rather than loaded
// per-locale. If a third language is added, revisit this.

import en from "./en";
import ar from "./ar";
import { DEFAULT_LOCALE, normalizeLocale } from "./config";

const DICTIONARIES = { en, ar };

export function getDictionary(locale) {
  return DICTIONARIES[normalizeLocale(locale)] || DICTIONARIES[DEFAULT_LOCALE];
}

// Walks a dotted path: resolve(dict, "builder.steps.summary")
function resolve(dict, path) {
  let node = dict;
  for (const key of path.split(".")) {
    if (node == null || typeof node !== "object") return undefined;
    node = node[key];
  }
  return node;
}

function interpolate(template, vars) {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (match, name) =>
    Object.prototype.hasOwnProperty.call(vars, name) ? String(vars[name]) : match
  );
}

/**
 * Builds a translator for a locale.
 *
 * Missing keys fall back to English rather than rendering a raw path — a gap in
 * a translation should degrade to a readable word, not leak "builder.steps.foo"
 * into the interface. In development the miss is logged so gaps are visible.
 */
export function createTranslator(locale) {
  const dict = getDictionary(locale);
  const fallback = DICTIONARIES[DEFAULT_LOCALE];

  return function t(path, vars) {
    let value = resolve(dict, path);

    if (value === undefined) {
      value = resolve(fallback, path);
      if (process.env.NODE_ENV === "development" && value !== undefined) {
        console.warn(`[i18n] missing "${path}" for locale "${locale}"`);
      }
    }

    if (value === undefined) return path;
    // Arrays and objects (e.g. landing.steps) are returned as-is for the caller
    // to map over; only strings are interpolated.
    if (typeof value !== "string") return value;
    return interpolate(value, vars);
  };
}

export { DEFAULT_LOCALE };
