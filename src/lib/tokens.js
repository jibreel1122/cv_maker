// Signed, purpose-scoped tokens for email links.
//
// A token is `payloadB64url.signature`, where the payload is JSON
// `{ email, purpose, exp }` and the signature is an HMAC-SHA256 over the payload
// keyed by NEXTAUTH_SECRET. Dependency-free, and readable even once expired so
// "resend" can work without asking for the password again.
//
// `purpose` matters. Without it, a token minted to verify an email address would
// also be accepted by the password-reset endpoint — anyone who could trigger a
// verification email for an account could then use that same link to take it
// over. Every verify call names the purpose it expects, and a mismatch is
// treated exactly like a bad signature.

import crypto from "crypto";

export const TOKEN_PURPOSES = {
  verifyEmail: "verify-email",
  resetPassword: "reset-password",
};

const TTL_SECONDS = {
  [TOKEN_PURPOSES.verifyEmail]: 60 * 60 * 24, // 24 hours
  // Deliberately short: a reset link is a bearer credential for the account, so
  // its useful lifetime should be measured in minutes, not days.
  [TOKEN_PURPOSES.resetPassword]: 60 * 60, // 1 hour
};

function secret() {
  const s = process.env.NEXTAUTH_SECRET;
  if (s) return s;
  // Zero-config local development: fall back to a fixed dev key so token signing
  // works out of the box without an .env file. NextAuth itself also tolerates a
  // missing secret in development. In production a real secret must be set.
  if (process.env.NODE_ENV === "production") {
    throw new Error("NEXTAUTH_SECRET is not set.");
  }
  return "bornat-cv-insecure-dev-secret";
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
  return b64url(crypto.createHmac("sha256", secret()).update(payloadB64).digest());
}

export function createToken(email, purpose = TOKEN_PURPOSES.verifyEmail) {
  const ttl = TTL_SECONDS[purpose] ?? TTL_SECONDS[TOKEN_PURPOSES.verifyEmail];
  const payload = {
    email: String(email).toLowerCase(),
    purpose,
    exp: Math.floor(Date.now() / 1000) + ttl,
  };
  const payloadB64 = b64url(JSON.stringify(payload));
  return `${payloadB64}.${sign(payloadB64)}`;
}

/**
 * Returns { valid, expired, email }.
 *   valid=false  signature, format, or purpose is wrong — do not trust anything
 *   valid=true, expired=true  signature ok but past expiry. The email is usable
 *                             for offering a resend, but must NOT authorise
 *                             anything.
 */
export function verifyToken(token, expectedPurpose = TOKEN_PURPOSES.verifyEmail) {
  const invalid = { valid: false, expired: false, email: null };

  if (!token || typeof token !== "string" || !token.includes(".")) return invalid;

  const [payloadB64, signature] = token.split(".");
  if (!payloadB64 || !signature) return invalid;

  const expected = sign(payloadB64);
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return invalid;

  let payload;
  try {
    payload = JSON.parse(fromB64url(payloadB64).toString("utf8"));
  } catch {
    return invalid;
  }

  // Tokens minted before purposes existed carry none; they can only ever have
  // been verification links, so that is what they are treated as.
  const purpose = payload.purpose || TOKEN_PURPOSES.verifyEmail;
  if (purpose !== expectedPurpose) return invalid;

  const expired = !payload.exp || payload.exp < Math.floor(Date.now() / 1000);
  return { valid: true, expired, email: payload.email || null };
}

// --- Back-compat aliases -----------------------------------------------------
// The email-verification call sites read better without the extra argument.

export function createEmailToken(email) {
  return createToken(email, TOKEN_PURPOSES.verifyEmail);
}

export function verifyEmailToken(token) {
  return verifyToken(token, TOKEN_PURPOSES.verifyEmail);
}
