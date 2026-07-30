import { describe, it, expect, beforeAll } from "vitest";

// Signing needs a secret. Set it before the module is imported so the token
// helpers do not fall back to their development key mid-suite.
beforeAll(() => {
  process.env.NEXTAUTH_SECRET = "test-secret-for-token-suite";
});

const {
  createToken,
  verifyToken,
  createEmailToken,
  verifyEmailToken,
  TOKEN_PURPOSES,
} = await import("@/lib/tokens");

const EMAIL = "person@example.com";

describe("token signing", () => {
  it("round-trips an email through a valid token", () => {
    const token = createToken(EMAIL, TOKEN_PURPOSES.verifyEmail);
    const result = verifyToken(token, TOKEN_PURPOSES.verifyEmail);
    expect(result.valid).toBe(true);
    expect(result.expired).toBe(false);
    expect(result.email).toBe(EMAIL);
  });

  it("lowercases the email so lookups are consistent", () => {
    const token = createToken("Person@Example.COM", TOKEN_PURPOSES.verifyEmail);
    expect(verifyToken(token, TOKEN_PURPOSES.verifyEmail).email).toBe(EMAIL);
  });

  it("rejects a tampered payload", () => {
    const token = createToken(EMAIL, TOKEN_PURPOSES.verifyEmail);
    const [, signature] = token.split(".");
    // Re-sign nothing: swap in a payload for a different address, keeping the
    // original signature. This is the attack the HMAC exists to stop.
    const forgedPayload = Buffer.from(
      JSON.stringify({ email: "attacker@evil.test", exp: 4102444800 })
    )
      .toString("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");

    const result = verifyToken(`${forgedPayload}.${signature}`, TOKEN_PURPOSES.verifyEmail);
    expect(result.valid).toBe(false);
    expect(result.email).toBeNull();
  });

  it("rejects malformed input without throwing", () => {
    for (const bad of [null, undefined, "", "nodot", "a.b", 42, {}, "..", "a.b.c"]) {
      const result = verifyToken(bad, TOKEN_PURPOSES.verifyEmail);
      expect(result.valid).toBe(false);
    }
  });

  it("rejects a token signed with a different secret", () => {
    const token = createToken(EMAIL, TOKEN_PURPOSES.verifyEmail);
    const original = process.env.NEXTAUTH_SECRET;
    process.env.NEXTAUTH_SECRET = "a-completely-different-secret";
    const result = verifyToken(token, TOKEN_PURPOSES.verifyEmail);
    process.env.NEXTAUTH_SECRET = original;
    expect(result.valid).toBe(false);
  });
});

describe("purpose segregation", () => {
  // This is the whole reason purposes exist: without them, a verification link
  // — which anyone can trigger for any address — would also be redeemable at
  // the password-reset endpoint, and that is account takeover.
  it("refuses a verification token at the password-reset endpoint", () => {
    const token = createToken(EMAIL, TOKEN_PURPOSES.verifyEmail);
    expect(verifyToken(token, TOKEN_PURPOSES.resetPassword).valid).toBe(false);
  });

  it("refuses a reset token at the verification endpoint", () => {
    const token = createToken(EMAIL, TOKEN_PURPOSES.resetPassword);
    expect(verifyToken(token, TOKEN_PURPOSES.verifyEmail).valid).toBe(false);
  });

  it("accepts each token at its own endpoint", () => {
    expect(
      verifyToken(createToken(EMAIL, TOKEN_PURPOSES.verifyEmail), TOKEN_PURPOSES.verifyEmail).valid
    ).toBe(true);
    expect(
      verifyToken(createToken(EMAIL, TOKEN_PURPOSES.resetPassword), TOKEN_PURPOSES.resetPassword)
        .valid
    ).toBe(true);
  });

  it("keeps the convenience aliases pointed at verification", () => {
    const token = createEmailToken(EMAIL);
    expect(verifyEmailToken(token).valid).toBe(true);
    expect(verifyToken(token, TOKEN_PURPOSES.resetPassword).valid).toBe(false);
  });
});

describe("expiry", () => {
  it("reports an expired token as signature-valid but expired", async () => {
    // Tokens carry an absolute `exp`, so moving the clock forward past it is
    // enough — no need to wait out a real TTL.
    const token = createToken(EMAIL, TOKEN_PURPOSES.resetPassword);
    const realNow = Date.now;
    Date.now = () => realNow() + 2 * 60 * 60 * 1000; // reset TTL is 1 hour
    try {
      const result = verifyToken(token, TOKEN_PURPOSES.resetPassword);
      // Still valid enough to read the address (so "resend" can work), but the
      // caller must refuse to act on it.
      expect(result.valid).toBe(true);
      expect(result.expired).toBe(true);
      expect(result.email).toBe(EMAIL);
    } finally {
      Date.now = realNow;
    }
  });

  it("gives password resets a shorter life than email verification", () => {
    const realNow = Date.now;
    const verify = createToken(EMAIL, TOKEN_PURPOSES.verifyEmail);
    const reset = createToken(EMAIL, TOKEN_PURPOSES.resetPassword);
    Date.now = () => realNow() + 2 * 60 * 60 * 1000; // +2h
    try {
      expect(verifyToken(verify, TOKEN_PURPOSES.verifyEmail).expired).toBe(false);
      expect(verifyToken(reset, TOKEN_PURPOSES.resetPassword).expired).toBe(true);
    } finally {
      Date.now = realNow;
    }
  });
});
