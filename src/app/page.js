import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  FileText,
  ShieldCheck,
  Sparkles,
  Languages,
  Zap,
} from "lucide-react";
import HeroPreview from "@/components/landing/HeroPreview";
import { TEMPLATES } from "@/lib/cvTemplates";

const price = process.env.PRODUCT_PRICE_USD || "5";

const features = [
  {
    icon: ShieldCheck,
    title: "متوافقة مع ATS",
    desc: "قوالب مبنية وفق قواعد أنظمة تتبّع المتقدّمين لتمرّ الفحص الآلي بسهولة.",
  },
  {
    icon: Zap,
    title: "معاينة لحظية",
    desc: "شاهد سيرتك تتشكّل حرفًا بحرف بينما تكتب — لا مفاجآت في الناتج.",
  },
  {
    icon: Languages,
    title: "عربي وإنجليزي",
    desc: "دعم كامل للاتجاهين RTL وLTR مع خطوط عربية واضحة في ملف الـ PDF.",
  },
  {
    icon: FileText,
    title: "PDF جاهز للطباعة",
    desc: "ملف بجودة عالية يُولَّد عبر متصفّح حقيقي، فيظهر النص العربي سليمًا تمامًا.",
  },
];

const steps = [
  { n: "١", title: "املأ بياناتك", desc: "فورم متعدّد الخطوات يأخذك من البيانات الشخصية حتى الشهادات." },
  { n: "٢", title: "اختر قالبًا", desc: "٣ قوالب محافظة ومتوافقة مع ATS، عربي أو إنجليزي." },
  { n: "٣", title: "ادفع وحمّل", desc: `دفعة واحدة بقيمة ${price}$ وتحصل فورًا على ملف PDF نهائي.` },
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-midnight-deep">
      {/* خلفية متدرّجة خفيفة */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute -top-40 right-0 h-96 w-96 rounded-full bg-gold/10 blur-3xl" />
        <div className="absolute bottom-0 left-0 h-96 w-96 rounded-full bg-midnight-soft/40 blur-3xl" />
      </div>

      {/* الشريط العلوي */}
      <header className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
        <div className="flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-gold" />
          <span className="font-display text-2xl font-extrabold text-cream">سيرتي</span>
        </div>
        <nav className="flex items-center gap-3">
          <Link href="/admin" className="hidden text-sm text-slateblue hover:text-cream sm:block">
            لوحة الأدمن
          </Link>
          <Link href="/build" className="btn-gold !px-5 !py-2.5 text-sm">
            ابدأ الآن
          </Link>
        </nav>
      </header>

      {/* Hero */}
      <section className="mx-auto grid max-w-7xl items-center gap-12 px-6 py-12 lg:grid-cols-2 lg:py-20">
        <div className="animate-fade-up">
          <span className="mb-5 inline-flex items-center gap-2 rounded-full border border-gold/30 bg-gold/5 px-4 py-1.5 text-sm text-gold">
            <Sparkles className="h-4 w-4" /> سيرة ذاتية تمرّ أنظمة التوظيف
          </span>
          <h1 className="font-display text-4xl font-black leading-tight text-cream sm:text-5xl lg:text-6xl">
            سيرة ذاتية احترافية
            <br />
            <span className="text-gold">متوافقة مع ATS</span> في دقائق
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-cream/80">
            أدخل بياناتك، شاهد المعاينة الحية تتشكّل أمامك، اختر القالب المناسب،
            وادفع دفعة واحدة لتحصل على ملف PDF نهائي بنص عربي سليم وجودة طباعة عالية.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <Link href="/build" className="btn-gold text-lg">
              ابنِ سيرتك الآن
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <span className="text-sm text-slateblue">
              دفعة واحدة • {price}$ • بدون اشتراك
            </span>
          </div>
          <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-cream/70">
            {["لا صور شخصية", "عمود واحد نظيف", "خطوط مقروءة آليًا"].map((t) => (
              <li key={t} className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-gold" /> {t}
              </li>
            ))}
          </ul>
        </div>

        <div className="animate-fade-up [animation-delay:120ms]">
          <HeroPreview />
        </div>
      </section>

      {/* المميزات */}
      <section className="mx-auto max-w-7xl px-6 py-16">
        <h2 className="text-center font-display text-3xl font-extrabold text-cream">
          لماذا سيرتي؟
        </h2>
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((f) => (
            <div key={f.title} className="card transition hover:border-gold/40">
              <f.icon className="h-9 w-9 text-gold" />
              <h3 className="mt-4 font-display text-lg font-bold text-cream">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-cream/70">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* الخطوات */}
      <section className="mx-auto max-w-7xl px-6 py-16">
        <h2 className="text-center font-display text-3xl font-extrabold text-cream">
          ثلاث خطوات فقط
        </h2>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {steps.map((s) => (
            <div key={s.n} className="card text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-gold/40 bg-gold/10 font-display text-2xl font-black text-gold">
                {s.n}
              </div>
              <h3 className="mt-4 font-display text-xl font-bold text-cream">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-cream/70">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* القوالب */}
      <section className="mx-auto max-w-7xl px-6 py-16">
        <h2 className="text-center font-display text-3xl font-extrabold text-cream">
          قوالب محافظة ومتوافقة مع ATS
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-center text-cream/70">
          تنويعات بسيطة في التباعد والخط والعناوين — كلها بعمود واحد نظيف بلا زخرفة
          تكسر القراءة الآلية.
        </p>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {TEMPLATES.map((t) => (
            <div key={t.id} className="card">
              <h3 className="font-display text-lg font-bold text-gold">{t.nameAr}</h3>
              <p className="mt-2 text-sm leading-relaxed text-cream/70">{t.descAr}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-5xl px-6 py-20">
        <div className="card border-gold/30 bg-gradient-to-br from-midnight-soft/60 to-midnight-deep/60 text-center">
          <h2 className="font-display text-3xl font-black text-cream sm:text-4xl">
            جاهز لسيرة ذاتية تفتح لك الأبواب؟
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-cream/80">
            ابدأ الآن — لن تدفع شيئًا حتى تكون راضيًا عن المعاينة النهائية.
          </p>
          <Link href="/build" className="btn-gold mt-8 text-lg">
            ابدأ مجانًا
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </div>
      </section>

      <footer className="border-t border-white/10 py-8 text-center text-sm text-slateblue">
        © {new Date().getFullYear()} سيرتي — جميع الحقوق محفوظة.
      </footer>
    </main>
  );
}
