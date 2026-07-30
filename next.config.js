/** @type {import('next').NextConfig} */

const isProd = process.env.NODE_ENV === "production";

// ---------------------------------------------------------------------------
// Content Security Policy
//
// Each directive below is as tight as this app can actually run with. Where a
// value is loose, the reason is stated — a policy nobody understands is a policy
// that gets widened at the first broken page.
//
// `script-src 'unsafe-inline'`: the App Router streams the RSC payload through
// inline <script> tags, so a nonce-free policy has to permit them. Tightening
// this means generating a per-request nonce in middleware and threading it into
// the root layout; that is the upgrade path, and it is worth taking if this app
// ever renders third-party HTML. It does not today — every user-supplied value
// reaching the DOM goes through `esc()` in `cvTemplates.js`, which is covered by
// tests.
//
// Not listed on purpose:
//   api.resend.com   the mail transport is called from route handlers, never
//                    from the browser, so it needs no connect-src entry
//   fonts.gstatic.com Cairo is vendored in /public/fonts, so no font CDN is
//                    contacted at runtime and no visitor data leaves the origin
// ---------------------------------------------------------------------------
const csp = [
  "default-src 'self'",

  // See the note above on inline scripts. 'unsafe-eval' is dev-only: React
  // Refresh needs it, production never does.
  `script-src 'self' 'unsafe-inline'${isProd ? "" : " 'unsafe-eval'"}`,

  // Tailwind ships a stylesheet, but the CV preview injects a generated <style>
  // block and recharts sets inline styles on its SVG nodes.
  "style-src 'self' 'unsafe-inline'",

  // data:/blob: cover inline SVG and any locally generated preview asset.
  "img-src 'self' data: blob:",

  // 'self' serves /fonts/*.woff2 to the live preview; data: covers the same
  // fonts inlined as base64, which is how the PDF renderer receives them.
  "font-src 'self' data:",

  // Everything the browser talks to is this origin. ws: is the dev HMR socket.
  `connect-src 'self'${isProd ? "" : " ws: wss:"}`,

  // The CV preview is a sandboxed srcdoc iframe.
  "frame-src 'self' blob: data:",

  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  // Paired with X-Frame-Options below: modern browsers honour this, older ones
  // fall back to the header.
  "frame-ancestors 'self'",

  // `upgrade-insecure-requests` is deliberately NOT set. It rewrites every
  // same-origin request to https://, which breaks a production build served
  // over plain HTTP — verified: client-side navigation fails with
  // ERR_SSL_PROTOCOL_ERROR and the app degrades to full page loads. It also
  // buys little here, because the only thing it protects against is mixed
  // content from subresources and this app loads none: no CDN, no font host,
  // no third-party script. HSTS below is what actually pins real deployments
  // to HTTPS, and it does so without penalising a proxy that terminates TLS
  // upstream.
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  {
    key: "X-Frame-Options",
    value: "SAMEORIGIN",
  },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // This app asks for none of these, so deny them outright rather than leaving
  // the decision to a future prompt.
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  // Sent only over HTTPS: on a plain-http origin browsers ignore it anyway, and
  // shipping it in local development risks pinning localhost to HTTPS in a
  // developer's browser for two years.
  ...(isProd
    ? [
        {
          key: "Strict-Transport-Security",
          value: "max-age=63072000; includeSubDomains; preload",
        },
      ]
    : []),
];

const nextConfig = {
  reactStrictMode: true,
  // Do not leak the framework version to every visitor.
  poweredByHeader: false,
  experimental: {
    // Keep Puppeteer (headless Chrome) external — it must not be bundled by Next.
    serverComponentsExternalPackages: ["puppeteer"],
  },
  async headers() {
    return [
      {
        // Everything, including API routes and static assets.
        source: "/:path*",
        headers: securityHeaders,
      },
      {
        // The vendored fonts are fetched by the preview iframe, which is
        // sandboxed without `allow-same-origin` in some browsers and therefore
        // has an opaque origin — so the font request is cross-origin and needs
        // CORS. They are also immutable, hence the long cache.
        source: "/fonts/:path*",
        headers: [
          { key: "Access-Control-Allow-Origin", value: "*" },
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
