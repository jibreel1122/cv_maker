// Local "mailer" — NO real email is sent and there is no SMTP / external
// service. For local development we simply build the verification link and log
// it to the server console. The same link is also returned to the caller so the
// UI can display it on screen for the user to click directly.

export function appUrl() {
  return (process.env.NEXTAUTH_URL || "http://localhost:3000").replace(/\/$/, "");
}

// Builds the on-screen / console verification link for an email + token.
export function verificationLink(token) {
  return `${appUrl()}/verify-email?token=${encodeURIComponent(token)}`;
}

// "Sends" the verification email. In this local-only build it just logs the
// link to the console and returns it. Returns { delivered:false, link }.
export async function sendVerificationEmail(email, token) {
  const link = verificationLink(token);
  console.log(
    `\n[mailer] (local mock — no email sent)\n` +
      `  Verify ${email} by opening:\n  ${link}\n`
  );
  return { delivered: false, link };
}
