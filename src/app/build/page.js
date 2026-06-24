import { Suspense } from "react";
import SiteHeader from "@/components/SiteHeader";
import BuildWizard from "@/components/build/BuildWizard";

export const metadata = {
  title: "Build your CV | CV Maker",
};

export default function BuildPage() {
  return (
    <main className="min-h-screen bg-canvas pb-24">
      <SiteHeader />
      <div className="mx-auto max-w-7xl px-6 py-8">
        <h1 className="mb-6 font-display text-2xl font-extrabold text-ink">
          CV builder
        </h1>
        <Suspense fallback={null}>
          <BuildWizard />
        </Suspense>
      </div>
    </main>
  );
}
