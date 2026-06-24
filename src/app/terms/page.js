import LegalLayout, { Section } from "@/components/legal/LegalLayout";

export const metadata = { title: "Terms of Service | CV Maker" };

export default function TermsPage() {
  return (
    <LegalLayout title="Terms of Service" updated="June 2026">
      <p>
        By creating an account and using CV Maker, you agree to these Terms of
        Service. Please read them carefully.
      </p>

      <Section heading="Service provided “as-is”">
        <p>
          CV Maker is provided free of charge and <strong>“as-is”</strong>, without
          warranties of any kind, express or implied. We do our best to keep the
          service available and reliable, but we do not guarantee uninterrupted or
          error-free operation.
        </p>
      </Section>

      <Section heading="Ownership of your CVs">
        <p>
          You own your content. Every CV you create belongs entirely to you. The
          platform claims <strong>no rights</strong> over your CVs or personal data
          and will not republish or sell them.
        </p>
      </Section>

      <Section heading="ATS compatibility">
        <p>
          Our templates are designed to be friendly to Applicant Tracking Systems
          (ATS). However, ATS rules vary between companies and countries, so we{" "}
          <strong>cannot guarantee</strong> that every generated PDF will pass every
          employer's screening. Always tailor your CV to the role you apply for.
        </p>
      </Section>

      <Section heading="Acceptable use">
        <p>
          You agree not to use the service for spam, fraud, harassment, or any
          unlawful activity, and not to attempt to disrupt or abuse the platform or
          other users. Violations may result in suspension or permanent removal of
          your account.
        </p>
      </Section>

      <Section heading="Account termination">
        <p>
          You may delete your account at any time from Settings. We may suspend or
          terminate accounts that violate these terms. On termination, your data is
          handled as described in the{" "}
          <a href="/privacy" className="font-semibold text-brand-700 hover:underline">
            Privacy Policy
          </a>
          .
        </p>
      </Section>

      <Section heading="Changes to these terms">
        <p>
          We may update these terms from time to time. Continued use of the service
          after changes take effect constitutes acceptance of the updated terms.
        </p>
      </Section>
    </LegalLayout>
  );
}
