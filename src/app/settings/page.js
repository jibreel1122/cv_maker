import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import SiteHeader from "@/components/SiteHeader";
import Footer from "@/components/Footer";
import DeleteAccount from "@/components/settings/DeleteAccount";
import { getCurrentUser } from "@/lib/session";

export const metadata = { title: "Settings | CV Maker" };

export default async function SettingsPage() {
  const user = await getCurrentUser();

  return (
    <div className="flex min-h-screen flex-col bg-canvas">
      <SiteHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-10">
        <Link href="/dashboard" className="btn-ghost mb-4 text-sm">
          <ArrowLeft className="h-4 w-4" /> Back to dashboard
        </Link>

        <h1 className="font-display text-3xl font-extrabold text-ink">Settings</h1>

        <div className="mt-8 card">
          <h2 className="font-display text-lg font-bold text-ink">Account</h2>
          <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-slate-500">Name</dt>
              <dd className="font-medium text-ink">{user?.name || "—"}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Email</dt>
              <dd className="font-medium text-ink">{user?.email}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Role</dt>
              <dd className="font-medium text-ink">{user?.role}</dd>
            </div>
          </dl>
        </div>

        <div className="mt-6">
          <DeleteAccount />
        </div>
      </main>
      <Footer />
    </div>
  );
}
