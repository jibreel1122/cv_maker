import Link from "next/link";
import { Heart } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t border-slate-100 bg-white">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-6 py-6 text-sm text-slate-500 sm:flex-row">
        <span>© {new Date().getFullYear()} CV Maker — Free professional CV builder.</span>
        <nav className="flex items-center gap-5">
          <Link href="/privacy" className="transition-colors hover:text-brand-700">
            Privacy Policy
          </Link>
          <Link href="/terms" className="transition-colors hover:text-brand-700">
            Terms of Service
          </Link>
        </nav>
      </div>
      <div className="border-t border-slate-50 bg-slate-50/60 py-3 text-center text-xs text-slate-500">
        Made with{" "}
        <Heart className="inline h-3.5 w-3.5 -translate-y-px animate-pulse fill-brand-500 text-brand-500" />{" "}
        by <span className="font-semibold text-brand-700">Jibreel Bornat</span>
      </div>
    </footer>
  );
}
