import { cookies } from "next/headers";
import "./globals.css";
import Providers from "@/components/Providers";
import { BRAND_NAME, BRAND_TAGLINE } from "@/lib/brand";
import { LOCALE_COOKIE, dirFor, normalizeLocale } from "@/lib/i18n/config";

export const metadata = {
  title: `${BRAND_NAME} | ${BRAND_TAGLINE}`,
  description:
    "Build a clean, ATS-friendly CV in minutes — free, in Arabic or English. Sign in with your email and download a polished PDF accepted in Palestine and worldwide.",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }) {
  // Reading the locale here — rather than in a client effect — means `lang` and
  // `dir` are already correct in the first HTML response. Deciding direction on
  // the client would render the whole page LTR and then snap it to RTL.
  const locale = normalizeLocale(cookies().get(LOCALE_COOKIE)?.value);

  return (
    <html lang={locale} dir={dirFor(locale)}>
      <body>
        <Providers locale={locale}>{children}</Providers>
      </body>
    </html>
  );
}
