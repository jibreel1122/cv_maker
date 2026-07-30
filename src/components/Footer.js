"use client";

import Link from "next/link";
import { Heart } from "lucide-react";
import { useT } from "@/components/i18n/LocaleProvider";
import { BRAND_NAME, BRAND_TAGLINE } from "@/lib/brand";

export default function Footer() {
  const t = useT();
  return (
    <footer className="border-t border-slate-100 bg-white">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-6 py-6 text-sm text-slate-500 sm:flex-row">
        <span>
          © {new Date().getFullYear()}{" "}
          {t("footer.rights", { brand: BRAND_NAME, tagline: BRAND_TAGLINE })}
        </span>
        <nav className="flex items-center gap-5">
          <Link href="/privacy" className="transition-colors hover:text-brand-700">
            {t("footer.privacy")}
          </Link>
          <Link href="/terms" className="transition-colors hover:text-brand-700">
            {t("footer.terms")}
          </Link>
        </nav>
      </div>
      <div className="border-t border-slate-50 bg-slate-50/60 py-3 text-center text-xs text-slate-500">
        <Heart className="inline h-3.5 w-3.5 -translate-y-px animate-pulse fill-brand-500 text-brand-500" />{" "}
        <span className="font-semibold text-brand-700">{t("footer.madeBy")}</span>
      </div>
    </footer>
  );
}
