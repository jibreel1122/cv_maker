import SiteHeader from "@/components/SiteHeader";
import Footer from "@/components/Footer";
import DeleteAccount from "@/components/settings/DeleteAccount";
import ChangePassword from "@/components/settings/ChangePassword";
import AccountCard from "@/components/settings/AccountCard";
import SettingsHeading from "@/components/settings/SettingsHeading";
import { getCurrentUser } from "@/lib/session";
import { pageTitle } from "@/lib/brand";

export const metadata = { title: pageTitle("Settings") };

export default async function SettingsPage() {
  const user = await getCurrentUser();

  return (
    <div className="flex min-h-screen flex-col bg-canvas">
      <SiteHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-10">
        <SettingsHeading />

        <div className="mt-8">
          <AccountCard name={user?.name} email={user?.email} role={user?.role} />
        </div>

        <div className="mt-6">
          <ChangePassword />
        </div>

        <div className="mt-6">
          <DeleteAccount />
        </div>
      </main>
      <Footer />
    </div>
  );
}
