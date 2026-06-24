// Defence-in-depth CSRF check for state-changing API routes.
//
// Our session cookie is SameSite=Lax, which already blocks cross-site POST/PUT/
// DELETE from carrying the cookie. As an additional layer we verify that the
// request's Origin (or Referer) matches the host the request was sent to. This
// is cheap and catches misconfigured/forged cross-origin form posts.

export function sameOrigin(request) {
  const origin = request.headers.get("origin");
  const referer = request.headers.get("referer");
  const host = request.headers.get("host");
  if (!host) return false;

  const source = origin || referer;
  // Same-origin fetches from some browsers may omit Origin on same-origin GETs,
  // but for unsafe methods browsers send Origin. If neither is present, reject.
  if (!source) return false;

  try {
    return new URL(source).host === host;
  } catch {
    return false;
  }
}
