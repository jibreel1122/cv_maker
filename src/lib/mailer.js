// Email sending via SMTP (nodemailer).
//
// If SMTP_* environment variables are configured, real emails are sent.
// Otherwise we fall back to logging the message (and any link) to the server
// console so local development and testing work without an SMTP server.

import nodemailer from "nodemailer";

function smtpConfigured() {
  return !!(process.env.SMTP_HOST && process.env.SMTP_PORT);
}

let transporter = null;
function getTransporter() {
  if (transporter) return transporter;
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: Number(process.env.SMTP_PORT) === 465,
    auth:
      process.env.SMTP_USER && process.env.SMTP_PASSWORD
        ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD }
        : undefined,
  });
  return transporter;
}

export function appUrl() {
  return (process.env.NEXTAUTH_URL || "http://localhost:3000").replace(/\/$/, "");
}

export async function sendMail({ to, subject, html, text }) {
  if (!smtpConfigured()) {
    // Dev fallback: surface the email in the logs instead of sending it.
    console.log(
      `\n[mailer] SMTP not configured — email NOT sent.\n  to: ${to}\n  subject: ${subject}\n  text: ${text}\n`
    );
    return { delivered: false };
  }

  const from = process.env.SMTP_FROM || process.env.SMTP_USER || "no-reply@cvmaker.app";
  await getTransporter().sendMail({ from, to, subject, html, text });
  return { delivered: true };
}

// Sends the verification email for the given address + token.
export async function sendVerificationEmail(email, token) {
  const link = `${appUrl()}/verify-email?token=${encodeURIComponent(token)}`;
  const subject = "Verify your email — CV Maker";
  const text = `Welcome to CV Maker!\n\nPlease verify your email by opening this link (valid for 24 hours):\n${link}\n\nIf you did not create an account, you can ignore this email.`;
  const html = `
    <div style="font-family:Inter,Arial,sans-serif;max-width:480px;margin:auto;color:#0f172a">
      <h2 style="color:#059669">Verify your email</h2>
      <p>Welcome to <strong>CV Maker</strong>! Please confirm your email address to activate your account.</p>
      <p style="margin:24px 0">
        <a href="${link}" style="background:#059669;color:#fff;padding:12px 22px;border-radius:10px;text-decoration:none;font-weight:600">Verify email</a>
      </p>
      <p style="color:#64748b;font-size:13px">This link is valid for 24 hours. If you did not create an account, you can ignore this email.</p>
      <p style="color:#94a3b8;font-size:12px;word-break:break-all">${link}</p>
    </div>`;
  return sendMail({ to: email, subject, html, text });
}
