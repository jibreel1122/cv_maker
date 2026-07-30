import { pageTitle } from "@/lib/brand";
import SiteHeader from "@/components/SiteHeader";
import Footer from "@/components/Footer";
import CvList from "@/components/dashboard/CvList";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import { getCurrentUser } from "@/lib/session";

export const metadata = { title: pageTitle("Dashboard") };

export default async function DashboardPage() {
  const user = await getCurrentUser();
  const firstName = (user?.name || "").split(" ")[0] || "there";

  return (
    <div className="flex min-h-screen flex-col bg-canvas">
      <SiteHeader />
      <main className="mx-auto w-full max-w-7xl flex-1 px-6 py-10">
        <DashboardHeader firstName={firstName} />
        <CvList />
      </main>
      <Footer />
    </div>
  );
}
