// Simple in-memory rate limiter — no external services.
//
// State lives in the Node process memory, so it is per-instance. This is the
// only rate-limiting mechanism: there is no Redis or third-party dependency,
// which keeps the app fully self-contained for local development.

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

// Extracts a best-effort client IP from request headers.
export function clientIp(headers) {
  const xff = headers.get?.("x-forwarded-for") || headers["x-forwarded-for"];
  if (xff) return String(xff).split(",")[0].trim();
  const real = headers.get?.("x-real-ip") || headers["x-real-ip"];
  return real ? String(real).trim() : "unknown";
}
