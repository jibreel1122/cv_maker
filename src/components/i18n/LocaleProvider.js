"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { createTranslator } from "@/lib/i18n";
import {
  DEFAULT_LOCALE,
  LOCALE_COOKIE,
  LOCALE_COOKIE_MAX_AGE,
  dirFor,
  isRtl,
  normalizeLocale,
} from "@/lib/i18n/config";

const LocaleContext = createContext(null);

// The chosen locale is stored in a cookie rather than localStorage so the server
// can read it while rendering the root layout. That lets <html lang> and dir be
// correct in the very first response, instead of the page flashing LTR and
// snapping to RTL once JavaScript loads.
function persist(locale) {
  try {
    document.cookie = `${LOCALE_COOKIE}=${locale};path=/;max-age=${LOCALE_COOKIE_MAX_AGE};samesite=lax`;
  } catch {
    /* cookies unavailable — the choice just won't survive a reload */
  }
}

export default function LocaleProvider({ initialLocale, children }) {
  const [locale, setLocaleState] = useState(() => normalizeLocale(initialLocale));

  const setLocale = useCallback((next) => {
    const value = normalizeLocale(next);
    setLocaleState(value);
    persist(value);
    // Keep the document in sync immediately. The server sets these on the next
    // navigation, but direction has to flip now for the current page.
    if (typeof document !== "undefined") {
      document.documentElement.lang = value;
      document.documentElement.dir = dirFor(value);
    }
  }, []);

  const value = useMemo(
    () => ({
      locale,
      setLocale,
      t: createTranslator(locale),
      dir: dirFor(locale),
      rtl: isRtl(locale),
    }),
    [locale, setLocale]
  );

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  const ctx = useContext(LocaleContext);
  if (ctx) return ctx;
  // Rendering outside the provider (a stray component, a test) should not crash
  // the tree — fall back to English.
  return {
    locale: DEFAULT_LOCALE,
    setLocale: () => {},
    t: createTranslator(DEFAULT_LOCALE),
    dir: "ltr",
    rtl: false,
  };
}

// Convenience for components that only need the translator.
export function useT() {
  return useLocale().t;
}
