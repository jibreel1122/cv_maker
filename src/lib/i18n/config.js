// Locale configuration.
//
// Two locales, and the reading direction is a property of the locale rather
// than something each component decides — so adding a third RTL language later
// means one entry here, not an audit of every layout.

export const LOCALES = ["en", "ar"];
export const DEFAULT_LOCALE = "en";
export const LOCALE_COOKIE = "locale";
// A year: the choice should outlast a browsing session.
export const LOCALE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

export const LOCALE_LABELS = {
  en: "English",
  ar: "العربية",
};

const RTL_LOCALES = new Set(["ar"]);

export function isValidLocale(locale) {
  return LOCALES.includes(locale);
}

export function normalizeLocale(locale) {
  return isValidLocale(locale) ? locale : DEFAULT_LOCALE;
}

export function isRtl(locale) {
  return RTL_LOCALES.has(locale);
}

export function dirFor(locale) {
  return isRtl(locale) ? "rtl" : "ltr";
}
