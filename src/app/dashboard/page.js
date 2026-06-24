import SiteHeader from "@/components/SiteHeader";
import CvList from "@/components/dashboard/CvList";
import { getCurrentUser } from "@/lib/session";

export const metadata = { title: "Dashboard | CV Maker" };

export default async function DashboardPage() {
  const user = await getCurrentUser();
  const firstName = (user?.name || "").split(" ")[0] || "there";

  return (
    <main className="min-h-screen bg-canvas">
      <SiteHeader />
      <div className="mx-auto max-w-7xl px-6 py-10">
        <div className="mb-8">
          <h1 className="font-display text-3xl font-extrabold text-ink">
            Hi {firstName} 👋
          </h1>
          <p className="mt-1 text-slate-600">
            Create, edit, and download your professional CVs — all free.
          </p>
        </div>
        <CvList />
      </div>
    </main>
  );
}
