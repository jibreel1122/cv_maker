// Transactional email via Resend.
//
// Two rules govern this file, both aimed at the same failure: a user who signs
// up, never receives a link, and can therefore never log in.
//
//   1. Verification is opt-in. It runs only when ENABLE_EMAIL_VERIFICATION is
//      explicitly "true" AND an API key is present. Until a custom domain's DNS
//      is verified in Resend, leave the flag off and every account is created
//      ready to use.
//
//   2. When Resend refuses a message for a *configuration* reason — sending to
//      an unverified recipient through the shared `onboarding@resend.dev`
//      sender, an unverified From domain, a bad key — the account is verified
//      automatically. Under that configuration the email could never have
//      arrived, so waiting for it would strand the user permanently.
//
// Transient failures (rate limits, quota, network) deliberately do NOT
// auto-verify: the message can still arrive on a retry, and silently downgrading
// verification whenever traffic spikes would defeat the point of having it.
//
// Environment:
//   ENABLE_EMAIL_VERIFICATION="true"  — required to turn verification on
//   RESEND_API_KEY                    — from resend.com → API Keys
//   EMAIL_FROM                        — an address on a domain verified in Resend
//   NEXTAUTH_URL                      — public origin, used to build the link

import { Resend } from "resend";
import { prisma } from "@/lib/prisma";
import { BRAND_NAME } from "@/lib/brand";

// Placeholder rather than the shared Resend test sender: `onboarding@resend.dev`
// silently delivers only to the Resend account owner, which looks like success
// while every real user gets nothing. An obviously-unset default fails loudly
// into the auto-verify path instead.
const DEFAULT_FROM = "noreply@yourdomain.com";

// Resend error codes that mean "this configuration can never deliver to this
// recipient". Anything here triggers the auto-verify fallback.
const CONFIG_ERROR_CODES = new Set([
  "validation_error", // shared test sender may only email the account owner
  "invalid_from_address", // From domain not verified in Resend
  "restricted_api_key",
  "invalid_access",
  "missing_api_key",
  "invalid_api_key",
  "not_found", // domain removed or never created
]);

export function appUrl() {
  return (process.env.NEXTAUTH_URL || "http://localhost:3000").replace(/\/$/, "");
}

// Verification is off unless explicitly switched on with a transport present.
// Everything else in the app keys off this single function, so "send an email"
// and "require a verified address" can never drift apart and lock users out.
export function isEmailVerificationEnabled() {
  if (process.env.ENABLE_EMAIL_VERIFICATION !== "true") return false;
  return Boolean(process.env.RESEND_API_KEY);
}

// True when Resend rejected the message for a reason more configuration will
// fix, rather than something a retry might.
function isConfigurationRestriction(error) {
  if (!error) return false;
  if (error.statusCode === 403) return true;
  return CONFIG_ERROR_CODES.has(error.name);
}

// The link a user clicks from their inbox. Points at the API route, which
// verifies the token and then redirects to the friendly page.
export function verificationLink(token) {
  return `${appUrl()}/api/auth/verify-email?token=${encodeURIComponent(token)}`;
}

// Password reset lands on a page, not an API route: the user has to type a new
// password, so there is nothing to apply until they submit the form.
export function passwordResetLink(token) {
  return `${appUrl()}/reset-password?token=${encodeURIComponent(token)}`;
}

// Fallback for the case above: mark the address verified so the account stays
// usable. Only ever called when the configuration made delivery impossible.
async function autoVerify(email) {
  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return false;
    if (user.emailVerified) return true;
    await prisma.user.update({
      where: { id: user.id },
      data: { emailVerified: new Date() },
    });
    return true;
  } catch (e) {
    console.error("[mailer] auto-verification failed:", e?.message || e);
    return false;
  }
}

function buildEmail(link) {
  const text = [
    "Confirm your email address",
    "",
    `Thanks for signing up to ${BRAND_NAME}. Open the link below to activate your account:`,
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
      Thanks for signing up to ${BRAND_NAME}. Click the button below to activate
      your account and start building your CV.
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

function buildResetEmail(link) {
  const text = [
    "Reset your password",
    "",
    `Someone asked to reset the password for your ${BRAND_NAME} account.`,
    "Open the link below to choose a new one:",
    "",
    link,
    "",
    "This link expires in 1 hour and can only be used once.",
    "If you did not request this, you can ignore this email — your password will not change.",
  ].join("\n");

  const html = `<!DOCTYPE html>
<html lang="en">
<body style="margin:0;padding:24px;background:#f4f7f6;font-family:Arial,Helvetica,sans-serif;color:#1a1a1a;">
  <div style="max-width:520px;margin:0 auto;background:#ffffff;border-radius:12px;padding:32px;">
    <h1 style="margin:0 0 8px;font-size:20px;color:#0f766e;">Reset your password</h1>
    <p style="margin:0 0 20px;font-size:15px;line-height:1.6;color:#444;">
      Someone asked to reset the password for your ${BRAND_NAME} account. Click
      below to choose a new one.
    </p>
    <a href="${link}"
       style="display:inline-block;background:#0f766e;color:#ffffff;text-decoration:none;
              font-size:15px;font-weight:bold;padding:12px 24px;border-radius:8px;">
      Choose a new password
    </a>
    <p style="margin:24px 0 6px;font-size:13px;color:#666;">
      Or paste this link into your browser:
    </p>
    <p style="margin:0;font-size:12px;word-break:break-all;color:#0f766e;">${link}</p>
    <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;" />
    <p style="margin:0;font-size:12px;color:#888;line-height:1.6;">
      This link expires in 1 hour. If you did not request a reset you can ignore
      this email — your password will not change.
    </p>
  </div>
</body>
</html>`;

  return { text, html };
}

// Sends a password-reset email.
//
// Unlike verification there is no auto-fallback here: silently "resetting" a
// password because the mail transport is misconfigured would be an account
// takeover, not a convenience. If this cannot be delivered the caller reports a
// generic success anyway (so the endpoint does not leak which addresses exist)
// and the failure is logged for the operator.
export async function sendPasswordResetEmail({ email, token }) {
  const link = passwordResetLink(token);

  if (!process.env.RESEND_API_KEY) {
    return { delivered: false, skipped: true, link };
  }

  const from = process.env.EMAIL_FROM || DEFAULT_FROM;
  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const { text, html } = buildResetEmail(link);
    const { error } = await resend.emails.send({
      from,
      to: [email],
      subject: `Reset your password — ${BRAND_NAME}`,
      html,
      text,
    });
    if (error) {
      console.error("[mailer] password reset send failed:", error.message || error);
      return { delivered: false, link, error: error.message };
    }
    return { delivered: true, link };
  } catch (e) {
    console.error("[mailer] could not reach Resend for password reset:", e?.message || e);
    return { delivered: false, link, error: e?.message || "Send failed." };
  }
}

// Sends the verification email.
//
// Never throws — a delivery failure must not roll back a registration that has
// already succeeded. Returns:
//   { delivered, link, skipped, restricted, autoVerified, error }
//
//   delivered    the message was accepted by Resend
//   skipped      verification is switched off; nothing was attempted
//   restricted   Resend refused for a configuration reason
//   autoVerified the account was marked verified as a fallback
export async function sendVerificationEmail({ email, token }) {
  const link = verificationLink(token);

  if (!isEmailVerificationEnabled()) {
    return { delivered: false, skipped: true, link };
  }

  const from = process.env.EMAIL_FROM || DEFAULT_FROM;

  let error;
  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const { text, html } = buildEmail(link);
    // Resend reports failures in the payload rather than throwing.
    ({ error } = await resend.emails.send({
      from,
      to: [email],
      subject: `Verify your email — ${BRAND_NAME}`,
      html,
      text,
    }));

    if (!error) return { delivered: true, link };
  } catch (e) {
    // Network-level failure — transient, so no auto-verification.
    console.error("[mailer] Could not reach Resend:", e?.message || e);
    return { delivered: false, link, error: e?.message || "Send failed." };
  }

  if (isConfigurationRestriction(error)) {
    console.warn(
      "Resend restriction: Unverified domain/recipient. Auto-verifying user to prevent lockout."
    );
    console.warn(
      `[mailer] Resend ${error.statusCode ?? "?"} ${error.name}: ${error.message} ` +
        `(from="${from}", to="${email}"). ` +
        `Verify a sending domain in Resend and set EMAIL_FROM to an address on it.`
    );
    const autoVerified = await autoVerify(email);
    return { delivered: false, link, restricted: true, autoVerified, error: error.message };
  }

  // Transient (rate limit, quota, server error) — the user can retry.
  console.error(
    `[mailer] Resend rejected the message (${error.name}): ${error.message}`
  );
  return { delivered: false, link, error: error.message };
}
