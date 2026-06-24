import SiteHeader from "@/components/SiteHeader";
import Footer from "@/components/Footer";

// Shared layout + typography for the Privacy and Terms pages.
export default function LegalLayout({ title, updated, children }) {
  return (
    <div className="flex min-h-screen flex-col bg-canvas">
      <SiteHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-12">
        <h1 className="font-display text-3xl font-extrabold text-ink">{title}</h1>
        {updated && <p className="mt-2 text-sm text-slate-500">Last updated: {updated}</p>}
        <div className="legal mt-8 space-y-6 text-slate-700">{children}</div>
      </main>
      <Footer />
    </div>
  );
}

export function Section({ heading, children }) {
  return (
    <section>
      <h2 className="font-display text-lg font-bold text-ink">{heading}</h2>
      <div className="mt-2 space-y-2 leading-relaxed">{children}</div>
    </section>
  );
}
