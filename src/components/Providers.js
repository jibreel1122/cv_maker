"use client";

import { SessionProvider } from "next-auth/react";
import LocaleProvider from "@/components/i18n/LocaleProvider";

export default function Providers({ locale, children }) {
  return (
    <SessionProvider>
      <LocaleProvider initialLocale={locale}>{children}</LocaleProvider>
    </SessionProvider>
  );
}
