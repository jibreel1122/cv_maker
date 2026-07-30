"use client";

import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  FileText,
  ShieldCheck,
  Sparkles,
  Globe2,
  Zap,
  Gift,
} from "lucide-react";
import SiteHeader from "@/components/SiteHeader";
import Footer from "@/components/Footer";
import HeroPreview from "@/components/landing/HeroPreview";
import Reveal from "@/components/Reveal";
import { TEMPLATES } from "@/lib/cvTemplateMeta";
import { useT } from "@/components/i18n/LocaleProvider";
import { BRAND_NAME } from "@/lib/brand";

// Copy lives in the dictionaries; only the icon per feature is structural.
const FEATURE_ICONS = [
  { key: "free", icon: Gift },
  { key: "ats", icon: ShieldCheck },
  { key: "bilingual", icon: Globe2 },
  { key: "preview", icon: Zap },
];

export default function HomePage({ searchParams }) {
  const t = useT();
  const deleted = searchParams?.deleted === "1";
  const steps = t("landing.steps");
  const bullets = t("landing.bullets");
  return (
    <main className="min-h-screen bg-canvas">
      <SiteHeader />

      {deleted && (
        <div className="border-b border-brand-200 bg-brand-50">
          <div className="mx-auto max-w-7xl px-6 py-3 text-center text-sm font-medium text-brand-800">
            {t("landing.accountDeleted")}
          </div>
        </div>
      )}

      {/* soft animated background accents */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-0 bg-grid opacity-60" />
        <div className="absolute -top-40 right-0 h-96 w-96 animate-float-slow rounded-full bg-brand-200/40 blur-3xl" />
        <div className="absolute bottom-0 left-0 h-96 w-96 animate-float rounded-full bg-brand-100/50 blur-3xl" />
      </div>

      {/* Hero */}
      <section className="mx-auto grid max-w-7xl items-center gap-12 px-6 py-12 lg:grid-cols-2 lg:py-20">
        <div className="animate-fade-up">
          <span className="mb-5 inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-4 py-1.5 text-sm font-semibold text-brand-700">
            <Sparkles className="h-4 w-4 animate-pulse" /> {t("landing.badge")}
          </span>
          <h1 className="font-display text-4xl font-extrabold leading-tight text-ink sm:text-5xl lg:text-6xl">
            {t("landing.titleLine1")}
            <br />
            <span className="text-gradient">{t("landing.titleAccent")}</span>
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-slate-600">
            {t("landing.subtitle")}
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <Link href="/build" className="btn-primary text-lg">
              {t("landing.ctaBuild")}
              <ArrowRight className="h-5 w-5" />
            </Link>
            <Link href="/login" className="btn-outline text-lg">
              {t("common.signIn")}
            </Link>
          </div>
          <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-600">
            {bullets.map((label) => (
              <li key={label} className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-brand-600" /> {label}
              </li>
            ))}
          </ul>
        </div>

        <div className="animate-fade-up [animation-delay:120ms]">
          <HeroPreview />
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-7xl px-6 py-16">
        <Reveal>
          <h2 className="text-center font-display text-3xl font-extrabold text-ink">
            {t("landing.whyTitle", { brand: BRAND_NAME })}
          </h2>
        </Reveal>
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURE_ICONS.map((f, i) => (
            <Reveal key={f.key} delay={i * 90}>
              <div className="card card-hover group h-full">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:scale-110">
                  <f.icon className="h-6 w-6" />
                </span>
                <h3 className="mt-4 font-display text-lg font-bold text-ink">
                  {t(`landing.features.${f.key}.title`)}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">
                  {t(`landing.features.${f.key}.desc`)}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Steps */}
      <section className="mx-auto max-w-7xl px-6 py-16">
        <Reveal>
          <h2 className="text-center font-display text-3xl font-extrabold text-ink">
            {t("landing.stepsTitle")}
          </h2>
        </Reveal>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {steps.map((s, i) => (
            <Reveal key={s.title} delay={i * 120}>
              <div className="card card-hover group h-full text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-brand-600 font-display text-2xl font-extrabold text-white shadow-soft transition-transform duration-300 group-hover:scale-110">
                  {i + 1}
                </div>
                <h3 className="mt-4 font-display text-xl font-bold text-ink">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{s.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Templates */}
      <section className="mx-auto max-w-7xl px-6 py-16">
        <Reveal>
          <h2 className="text-center font-display text-3xl font-extrabold text-ink">
            {t("landing.templatesTitle")}
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-center text-slate-600">
            {t("landing.templatesSubtitle", { count: TEMPLATES.length })}
          </p>
        </Reveal>
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {TEMPLATES.map((t, i) => (
            <Reveal key={t.id} delay={(i % 3) * 90}>
              <div className="card card-hover group h-full">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-brand-500 transition-transform duration-300 group-hover:scale-150" />
                  <h3 className="font-display text-lg font-bold text-brand-700">{t.name}</h3>
                </div>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{t.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-5xl px-6 py-20">
        <Reveal>
          <div className="card relative overflow-hidden border-brand-200 bg-gradient-to-br from-brand-600 to-brand-700 bg-[length:200%_200%] text-center text-white animate-gradient-pan">
            <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
            <h2 className="font-display text-3xl font-extrabold sm:text-4xl">
              {t("landing.ctaTitle")}
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-white/85">
              {t("landing.ctaSubtitle")}
            </p>
            <Link
              href="/register"
              className="mt-8 inline-flex items-center justify-center gap-2 rounded-xl bg-white px-6 py-3 text-lg font-semibold text-brand-700 shadow-soft transition-all duration-200 hover:-translate-y-0.5 hover:bg-brand-50 hover:shadow-lg"
            >
              {t("landing.ctaButton")}
              <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        </Reveal>
      </section>

      <Footer />
    </main>
  );
}
