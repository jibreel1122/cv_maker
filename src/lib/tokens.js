// Signed email-verification tokens.
//
// A token is `payloadB64url.signature`, where the payload is JSON `{ email,
// exp }` and the signature is an HMAC-SHA256 over the payload keyed by
// NEXTAUTH_SECRET. This keeps us dependency-free and lets us read the email out
// of an *expired* token (signature still valid) so we can offer "resend"
// without asking for the password again.

import crypto from "crypto";

const TTL_SECONDS = 60 * 60 * 24; // 24 hours

function secret() {
  const s = process.env.NEXTAUTH_SECRET;
  if (s) return s;
  // Zero-config local development: fall back to a fixed dev key so token
  // signing works out of the box without an .env file. NextAuth itself also
  // tolerates a missing secret in development. In production a real
  // NEXTAUTH_SECRET must be set.
  if (process.env.NODE_ENV === "production") {
    throw new Error("NEXTAUTH_SECRET is not set.");
  }
  return "cv-maker-insecure-dev-secret";
}

function b64url(buf) {
  return Buffer.from(buf)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function fromB64url(str) {
  return Buffer.from(str.replace(/-/g, "+").replace(/_/g, "/"), "base64");
}

function sign(payloadB64) {
  return b64url(
    crypto.createHmac("sha256", secret()).update(payloadB64).digest()
  );
}

export function createEmailToken(email) {
  const payload = {
    email: String(email).toLowerCase(),
    exp: Math.floor(Date.now() / 1000) + TTL_SECONDS,
  };
  const payloadB64 = b64url(JSON.stringify(payload));
  return `${payloadB64}.${sign(payloadB64)}`;
}

// Returns { valid, expired, email }.
//   - valid=false: signature/format invalid (do not trust the contents).
//   - valid=true, expired=true: signature ok but past expiry (email is usable
//     for a resend, but must NOT verify the account).
export function verifyEmailToken(token) {
  if (!token || typeof token !== "string" || !token.includes(".")) {
    return { valid: false, expired: false, email: null };
  }
  const [payloadB64, signature] = token.split(".");
  if (!payloadB64 || !signature) {
    return { valid: false, expired: false, email: null };
  }

  const expected = sign(payloadB64);
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    return { valid: false, expired: false, email: null };
  }

  let payload;
  try {
    payload = JSON.parse(fromB64url(payloadB64).toString("utf8"));
  } catch {
    return { valid: false, expired: false, email: null };
  }

  const expired = !payload.exp || payload.exp < Math.floor(Date.now() / 1000);
  return { valid: true, expired, email: payload.email || null };
}
