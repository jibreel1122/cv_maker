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
import { TEMPLATES } from "@/lib/cvTemplates";

const features = [
  {
    icon: Gift,
    title: "100% free",
    desc: "No payments, no subscriptions, no hidden limits. Build and download as many CVs as you like.",
  },
  {
    icon: ShieldCheck,
    title: "ATS-friendly",
    desc: "Clean single-column templates built to pass applicant tracking systems with ease.",
  },
  {
    icon: Globe2,
    title: "Accepted everywhere",
    desc: "Professional, internationally recognised layouts — suitable in Palestine and worldwide.",
  },
  {
    icon: Zap,
    title: "Live preview",
    desc: "Watch your CV take shape as you type. What you see is exactly what you download.",
  },
];

const steps = [
  { n: "1", title: "Sign in", desc: "Create an account with your email in seconds — all free." },
  { n: "2", title: "Fill in your details", desc: "A guided, multi-step form takes you from contact info to certifications." },
  { n: "3", title: "Pick a template & download", desc: "Choose from several modern templates and export a polished PDF instantly." },
];

export default function HomePage({ searchParams }) {
  const deleted = searchParams?.deleted === "1";
  return (
    <main className="min-h-screen bg-canvas">
      <SiteHeader />

      {deleted && (
        <div className="border-b border-brand-200 bg-brand-50">
          <div className="mx-auto max-w-7xl px-6 py-3 text-center text-sm font-medium text-brand-800">
            Your account and all data have been deleted.
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
            <Sparkles className="h-4 w-4 animate-pulse" /> Free forever • No payment required
          </span>
          <h1 className="font-display text-4xl font-extrabold leading-tight text-ink sm:text-5xl lg:text-6xl">
            Build a professional CV
            <br />
            <span className="text-gradient">that gets accepted</span>
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-slate-600">
            Enter your details, watch the live preview, choose a modern template,
            and download a clean, ATS-friendly PDF — accepted in Palestine and all
            over the world. Completely free.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <Link href="/build" className="btn-primary text-lg">
              Build my CV
              <ArrowRight className="h-5 w-5" />
            </Link>
            <Link href="/login" className="btn-outline text-lg">
              Sign in
            </Link>
          </div>
          <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-600">
            {["No profile photo", "Clean single column", "Machine-readable fonts"].map((t) => (
              <li key={t} className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-brand-600" /> {t}
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
            Why CV Maker?
          </h2>
        </Reveal>
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((f, i) => (
            <Reveal key={f.title} delay={i * 90}>
              <div className="card card-hover group h-full">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:scale-110">
                  <f.icon className="h-6 w-6" />
                </span>
                <h3 className="mt-4 font-display text-lg font-bold text-ink">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{f.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Steps */}
      <section className="mx-auto max-w-7xl px-6 py-16">
        <Reveal>
          <h2 className="text-center font-display text-3xl font-extrabold text-ink">
            Three simple steps
          </h2>
        </Reveal>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {steps.map((s, i) => (
            <Reveal key={s.n} delay={i * 120}>
              <div className="card card-hover group h-full text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-brand-600 font-display text-2xl font-extrabold text-white shadow-soft transition-transform duration-300 group-hover:scale-110">
                  {s.n}
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
            Templates for every field
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-center text-slate-600">
            {TEMPLATES.length} distinct, internationally-accepted designs — all clean
            single-column layouts that stay readable for recruiters and ATS software
            alike.
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
              Ready for a CV that opens doors?
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-white/85">
              Create your free account and download your professional CV in minutes.
            </p>
            <Link
              href="/register"
              className="mt-8 inline-flex items-center justify-center gap-2 rounded-xl bg-white px-6 py-3 text-lg font-semibold text-brand-700 shadow-soft transition-all duration-200 hover:-translate-y-0.5 hover:bg-brand-50 hover:shadow-lg"
            >
              Get started — it's free
              <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        </Reveal>
      </section>

      <Footer />
    </main>
  );
}
