import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-slate-100 bg-white">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-6 py-6 text-sm text-slate-500 sm:flex-row">
        <span>© {new Date().getFullYear()} CV Maker — Free professional CV builder.</span>
        <nav className="flex items-center gap-5">
          <Link href="/privacy" className="hover:text-brand-700">
            Privacy Policy
          </Link>
          <Link href="/terms" className="hover:text-brand-700">
            Terms of Service
          </Link>
        </nav>
      </div>
    </footer>
  );
}
