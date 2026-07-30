// Transactional email via Resend.
//
// Verification is only meaningful when there is somewhere for the email to go.
// Rather than let a missing API key silently strand every new signup — an
// account is created, no email arrives, and login refuses them forever — the
// feature switches itself off when it is not configured, and registration marks
// those accounts verified straight away.
//
// Required to enable verification:
//   RESEND_API_KEY  — from resend.com → API Keys
//   EMAIL_FROM      — a verified sender, or `onboarding@resend.dev` for testing
//                     (that test sender can only deliver to your own Resend
//                     account address; a verified domain is needed for real users)
//   NEXTAUTH_URL    — the public origin, used to build the link
//
// Set ENABLE_EMAIL_VERIFICATION="false" to force it off even when a key exists.

import { Resend } from "resend";

const DEFAULT_FROM = "onboarding@resend.dev";

export function appUrl() {
  return (process.env.NEXTAUTH_URL || "http://localhost:3000").replace(/\/$/, "");
}

// Verification runs only when a transport is configured and the flag has not
// explicitly disabled it. Everything else in the app keys off this, so the two
// halves — "send an email" and "require a verified address" — can never drift
// apart and lock users out.
export function isEmailVerificationEnabled() {
  if (process.env.ENABLE_EMAIL_VERIFICATION === "false") return false;
  return Boolean(process.env.RESEND_API_KEY);
}

// The link a user clicks from their inbox. Points at the API route, which
// verifies the token and then redirects to the friendly page.
export function verificationLink(token) {
  return `${appUrl()}/api/auth/verify-email?token=${encodeURIComponent(token)}`;
}

function buildEmail(link) {
  const text = [
    "Confirm your email address",
    "",
    "Thanks for signing up to CV Maker. Open the link below to activate your account:",
    "",
    link,
    "",
    "This link expires in 24 hours.",
    "If you did not create this account you can ignore this email.",
  ].join("\n");

  // Inline styles only — email clients strip <style> blocks and ignore most
  // modern CSS. Kept to a single centred column so it holds up on mobile.
  const html = `<!DOCTYPE html>
<html lang="en">
<body style="margin:0;padding:24px;background:#f4f7f6;font-family:Arial,Helvetica,sans-serif;color:#1a1a1a;">
  <div style="max-width:520px;margin:0 auto;background:#ffffff;border-radius:12px;padding:32px;">
    <h1 style="margin:0 0 8px;font-size:20px;color:#0f766e;">Confirm your email address</h1>
    <p style="margin:0 0 20px;font-size:15px;line-height:1.6;color:#444;">
      Thanks for signing up to CV Maker. Click the button below to activate your
      account and start building your CV.
    </p>
    <a href="${link}"
       style="display:inline-block;background:#0f766e;color:#ffffff;text-decoration:none;
              font-size:15px;font-weight:bold;padding:12px 24px;border-radius:8px;">
      Verify my email
    </a>
    <p style="margin:24px 0 6px;font-size:13px;color:#666;">
      Or paste this link into your browser:
    </p>
    <p style="margin:0;font-size:12px;word-break:break-all;color:#0f766e;">${link}</p>
    <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;" />
    <p style="margin:0;font-size:12px;color:#888;line-height:1.6;">
      This link expires in 24 hours. If you did not create this account, you can
      safely ignore this email.
    </p>
  </div>
</body>
</html>`;

  return { text, html };
}

// Sends the verification email.
//
// Never throws — a delivery failure must not roll back a registration that has
// already succeeded. Returns { delivered, link, skipped, error } so the caller
// can decide what to tell the user.
export async function sendVerificationEmail({ email, token }) {
  const link = verificationLink(token);

  if (!isEmailVerificationEnabled()) {
    return { delivered: false, skipped: true, link };
  }

  const from = process.env.EMAIL_FROM || DEFAULT_FROM;

  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const { text, html } = buildEmail(link);
    const { error } = await resend.emails.send({
      from,
      to: [email],
      subject: "Verify your email — CV Maker",
      html,
      text,
    });

    if (error) {
      // Resend reports failures in the payload rather than throwing.
      console.error("[mailer] Resend rejected the message:", error.message || error);
      return { delivered: false, link, error: error.message || "Send failed." };
    }

    return { delivered: true, link };
  } catch (e) {
    console.error("[mailer] Could not reach Resend:", e?.message || e);
    return { delivered: false, link, error: e?.message || "Send failed." };
  }
}
