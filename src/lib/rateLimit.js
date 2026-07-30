// Simple in-memory rate limiter — no external services.
//
// State lives in the Node process memory, so it is per-instance. Behind more
// than one replica each instance enforces its own budget; move the buckets to
// Redis or the database before scaling out horizontally.

const buckets = new Map(); // key -> { count, resetAt }

// Periodically drop expired buckets so the map does not grow unbounded.
function sweep() {
  const now = Date.now();
  for (const [key, b] of buckets) {
    if (b.resetAt <= now) buckets.delete(key);
  }
}

// Records one hit against `key`. Returns:
//   { limited, remaining, retryAfterSeconds }
export function hit(key, limit, windowMs) {
  const now = Date.now();
  if (buckets.size > 5000) sweep();

  let b = buckets.get(key);
  if (!b || b.resetAt <= now) {
    b = { count: 0, resetAt: now + windowMs };
    buckets.set(key, b);
  }
  b.count += 1;

  const limited = b.count > limit;
  return {
    limited,
    remaining: Math.max(0, limit - b.count),
    retryAfterSeconds: Math.ceil((b.resetAt - now) / 1000),
  };
}

// Checks whether `key` is already at/over the limit WITHOUT recording a hit.
export function peek(key, limit) {
  const b = buckets.get(key);
  const now = Date.now();
  if (!b || b.resetAt <= now) {
    return { limited: false, retryAfterSeconds: 0 };
  }
  return {
    limited: b.count >= limit,
    retryAfterSeconds: Math.ceil((b.resetAt - now) / 1000),
  };
}

// Clears the bucket for a key (e.g. after a successful login).
export function reset(key) {
  buckets.delete(key);
}

// ---------------------------------------------------------------------------
// Client IP extraction
//
// `x-forwarded-for` is a list the *client* can seed: a request arriving with
// `X-Forwarded-For: 1.2.3.4` makes the left-most entry attacker-controlled.
// Reading the left-most value therefore hands anyone a fresh rate-limit bucket
// per request, which is the same as having no limiter at all.
//
// The only entries that can be trusted are the ones your own proxies appended,
// counting from the RIGHT. TRUSTED_PROXY_HOPS says how many proxies sit in
// front of this app:
//
//   0  no proxy — ignore x-forwarded-for entirely (direct-to-Node)
//   1  one reverse proxy / load balancer (default: Render, Railway, Fly, nginx)
//   2  two hops, e.g. Cloudflare in front of a platform load balancer
//
// With N hops the client IP is the Nth entry from the end.
// ---------------------------------------------------------------------------

const DEFAULT_PROXY_HOPS = 1;

// Headers written by the platform itself rather than copied from the request.
// These cannot be spoofed by the client, so they win when present.
const TRUSTED_SINGLE_IP_HEADERS = [
  "cf-connecting-ip", // Cloudflare
  "true-client-ip", // Cloudflare Enterprise / Akamai
  "x-vercel-forwarded-for", // Vercel
  "fly-client-ip", // Fly.io
];

function readHeader(headers, name) {
  if (!headers) return null;
  const value =
    typeof headers.get === "function" ? headers.get(name) : headers[name];
  if (!value) return null;
  return String(value).trim() || null;
}

function trustedHops() {
  const raw = process.env.TRUSTED_PROXY_HOPS;
  if (raw === undefined || raw === "") return DEFAULT_PROXY_HOPS;
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) && n >= 0 ? n : DEFAULT_PROXY_HOPS;
}

// Extracts a client IP that a caller cannot trivially forge.
// Returns "unknown" when no trustworthy source is available — callers then
// share one bucket, which fails closed (stricter) rather than open.
export function clientIp(headers) {
  for (const name of TRUSTED_SINGLE_IP_HEADERS) {
    const value = readHeader(headers, name);
    if (value) return value.split(",")[0].trim();
  }

  const hops = trustedHops();
  if (hops === 0) {
    // Nothing in front of us, so any forwarding header is client-supplied.
    return readHeader(headers, "x-real-ip") || "unknown";
  }

  const xff = readHeader(headers, "x-forwarded-for");
  if (xff) {
    const parts = xff
      .split(",")
      .map((p) => p.trim())
      .filter(Boolean);
    if (parts.length) {
      // The trusted proxy appended the last entry; with N proxies the real
      // client sits N places from the end.
      const index = parts.length - hops;
      // A chain shorter than the configured hop count means the request did not
      // come through the expected proxies, so every entry in it is
      // client-supplied. Fall through to "unknown" rather than trust one.
      if (index >= 0) return parts[index];
    }
  }

  // `x-real-ip` is set by nginx-style proxies and overwritten, not appended.
  return readHeader(headers, "x-real-ip") || "unknown";
}
