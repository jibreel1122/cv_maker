import Link from "next/link";
import { Sparkles } from "lucide-react";
import BuildWizard from "@/components/build/BuildWizard";

export const metadata = {
  title: "بناء السيرة الذاتية | سيرتي",
};

export default function BuildPage() {
  const price = process.env.PRODUCT_PRICE_USD || "5";

  return (
    <main className="min-h-screen bg-midnight-deep pb-24">
      <header className="border-b border-white/10">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-gold" />
            <span className="font-display text-xl font-extrabold text-cream">سيرتي</span>
          </Link>
          <span className="text-sm text-slateblue">منشئ السيرة الذاتية</span>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 py-8">
        <BuildWizard price={price} />
      </div>
    </main>
  );
}
