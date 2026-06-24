import LegalLayout, { Section } from "@/components/legal/LegalLayout";

export const metadata = { title: "Privacy Policy | CV Maker" };

export default function PrivacyPage() {
  return (
    <LegalLayout title="Privacy Policy" updated="June 2026">
      <p>
        This Privacy Policy explains what information CV Maker collects, how it is
        stored, and the choices you have. We keep things minimal: we only collect
        what is needed to build and store your CVs.
      </p>

      <Section heading="What we collect">
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <strong>Account data:</strong> your name, email address, and a securely
            hashed password.
          </li>
          <li>
            <strong>CV data:</strong> the content you enter into your CVs —
            experience, education, skills, and similar fields.
          </li>
          <li>
            <strong>Security data:</strong> limited technical metadata (such as IP
            address and timestamps) used for rate limiting and audit logs to
            protect the service from abuse.
          </li>
        </ul>
        <p>We do not collect payment information — the service is free.</p>
      </Section>

      <Section heading="Where your data is stored">
        <p>
          Data is stored in our application database — SQLite during local
          development and a managed PostgreSQL database in production. Passwords are
          never stored in plain text; they are hashed with bcrypt.
        </p>
      </Section>

      <Section heading="Who can see your CVs">
        <p>
          Your CVs are private to your account. Administrators and the owner of the
          platform can access user accounts and CVs <strong>for maintenance and
          support purposes only</strong> — for example, to investigate a bug or
          respond to abuse. We do <strong>not</strong> sell your data and we do
          <strong> not</strong> use your CV content for marketing.
        </p>
      </Section>

      <Section heading="Deleting your data">
        <p>
          You can delete your account and all associated data at any time from{" "}
          <strong>Settings → Danger Zone</strong>. Deleting your account
          permanently removes your profile and every CV you created.
        </p>
      </Section>

      <Section heading="Data retention">
        <p>
          When you delete your account, your personal data and CVs are removed from
          the active database immediately and purged from backups within 30 days.
          Security audit logs (which may reference an email address) are retained
          for up to 90 days for fraud and abuse prevention, then deleted.
        </p>
      </Section>

      <Section heading="Contact">
        <p>
          For any privacy question or data request, contact the platform owner at{" "}
          <a href="mailto:jibreelebornat@gmail.com" className="font-semibold text-brand-700 hover:underline">
            jibreelebornat@gmail.com
          </a>
          .
        </p>
      </Section>
    </LegalLayout>
  );
}
