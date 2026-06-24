import { Suspense } from "react";
import SiteHeader from "@/components/SiteHeader";
import Footer from "@/components/Footer";
import BuildWizard from "@/components/build/BuildWizard";

export const metadata = {
  title: "Build your CV | CV Maker",
};

export default function BuildPage() {
  return (
    <div className="flex min-h-screen flex-col bg-canvas">
      <SiteHeader />
      <main className="mx-auto w-full max-w-7xl flex-1 px-6 py-8 pb-24">
        <h1 className="mb-6 font-display text-2xl font-extrabold text-ink">
          CV builder
        </h1>
        <Suspense fallback={null}>
          <BuildWizard />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}
