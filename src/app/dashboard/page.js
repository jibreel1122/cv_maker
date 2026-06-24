import Link from "next/link";
import { Settings } from "lucide-react";
import SiteHeader from "@/components/SiteHeader";
import Footer from "@/components/Footer";
import CvList from "@/components/dashboard/CvList";
import { getCurrentUser } from "@/lib/session";

export const metadata = { title: "Dashboard | CV Maker" };

export default async function DashboardPage() {
  const user = await getCurrentUser();
  const firstName = (user?.name || "").split(" ")[0] || "there";

  return (
    <div className="flex min-h-screen flex-col bg-canvas">
      <SiteHeader />
      <main className="mx-auto w-full max-w-7xl flex-1 px-6 py-10">
        <div className="mb-8 flex items-start justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-extrabold text-ink">
              Hi {firstName} 👋
            </h1>
            <p className="mt-1 text-slate-600">
              Create, edit, and download your professional CVs — all free.
            </p>
          </div>
          <Link href="/settings" className="btn-ghost text-sm">
            <Settings className="h-4 w-4" /> <span className="hidden sm:inline">Settings</span>
          </Link>
        </div>
        <CvList />
      </main>
      <Footer />
    </div>
  );
}
