# Bornat CV Maker — Technical Audit

**Scope:** full repository review — `src/` (52 files), `prisma/`, config, docs
**Commit audited:** `040c54d`
**Date:** 30 July 2026
**Stack:** Next.js 14.2.18 (App Router) · React 18 · NextAuth 4 (JWT + Credentials) · Prisma 5 · PostgreSQL (Supabase) · Puppeteer · Tailwind

---

## ⚠️ Status update — a later commit fixed some of this

Later commits resolved the findings below. **They are kept in this document for
the record, each marked with its status** — do not spend review time on the
resolved ones.

| Finding | Status | What changed |
| --- | --- | --- |
| **H1** CSRF missing on CV routes | ✅ Fixed | `sameOrigin()` now guards CV `POST`/`PUT`/`DELETE`; verified a cross-origin `POST` returns 403 |
| **H2** No CV input validation / stored DoS | ✅ Fixed | Zod schema at both write sites (`src/lib/validations/cv.js`), defensive renderer, `ErrorBoundary` around the preview |
| **H3** Chrome launched per PDF request | ✅ Fixed | Shared singleton browser + 4-way concurrency gate; measured 557 ms cold → 100 ms warm |
| **M1** Landing page 60fps render loop | ✅ Fixed | 10fps throttled tick, memoised on an integer frame; measured ~16× fewer iframe reloads |
| **M2** Builder preview not debounced | ✅ Fixed | 250 ms debounce inside `CVPreview` |
| **M3** No autosave / unsaved-changes guard | ✅ Fixed | `localStorage` autosave, restore prompt, `beforeunload` guard |
| **M5** Admin showed raw template ids | ✅ Fixed | Both tables now call `templateName()`; legacy ids map to live templates |
| **L10** Preview iframe `allow-same-origin` | ✅ Fixed | `sandbox=""` — no permissions at all |
| **C4** Production signup completely broken | ✅ Fixed | Resend transport in `src/lib/mailer.js`; verification is opt-in and auto-verifies accounts when no transport is configured, so signup works in every configuration |
| **C1** Owner credentials in repo | ⚠️ Partly | Removed from `README.md`, `.env.example` and `prisma/seed.js` — the seed now *requires* `OWNER_EMAIL`/`OWNER_PASSWORD` and fails loudly. **The password is still in git history; rotating it is still required.** |
| **C2** Next.js middleware bypass (CVE-2025-29927) | ✅ Fixed | Upgraded to 14.2.35; the advisory no longer appears in `npm audit` |
| **C3** No password reset | ✅ Fixed | `/forgot-password` + `/reset-password` with purpose-scoped HMAC tokens, plus change-password in `/settings` |
| **H4** Audit retention never implemented | ✅ Fixed | `purgeExpiredAuditLogs()` runs opportunistically from admin reads; verified a 120-day-old row is deleted |
| **M4** Case-sensitive admin search | ✅ Fixed | `mode: "insensitive"` on users, CVs and audit-log queries |
| **M6** Stats loaded every user into memory | ✅ Fixed | `groupBy` + a single grouped SQL query for the 30-day chart |
| **M7** No admin pagination | ✅ Fixed | Server-side paging on users and CVs with a shared pager |
| **M9** Spoofable `clientIp` | ✅ Fixed | `TRUSTED_PROXY_HOPS`-aware extraction from the right of the chain; verified a spoofed left-most entry no longer buys a fresh bucket |
| **L4** CvList swallowed fetch errors | ✅ Fixed | Load failures now show an error instead of the "no CVs yet" empty state |
| **M8** No security headers | ✅ Fixed | CSP, HSTS, X-Frame-Options, nosniff, Referrer-Policy, Permissions-Policy in `next.config.js`; `X-Powered-By` removed. Verified in a browser: zero CSP violations across landing, auth, builder and admin |
| **M12** `npm run lint` was non-functional | ✅ Fixed | `.eslintrc.json` added; `next lint` runs without prompting and reports no warnings or errors |
| **M13** Zero tests, zero CI | ✅ Fixed | 63 Vitest tests over the permission matrix, token purposes and the CV renderer; GitHub Actions runs lint + test + build on push and PR to `main` |
| **L11** No favicon | ✅ Fixed | `src/app/icon.svg` — the 404 noted in this audit is gone |

**Still open:** C1's git-history purge (the password remains in commits
`16092ad` and `a9ca972` — **rotate it**), M10 (no rate limit on
`/api/auth/verify-email`), M11 (user enumeration on registration), and most of
the Low list. A further `npm audit` shows 5 advisories that would need Next
16 (a breaking major) — all in features this app does not use (Image Optimizer,
rewrites) plus `nodemailer`, which is a transitive dependency of next-auth that
this app never calls.

---

## How to read this

Findings are grouped by severity and each one states **what it is**, **where**, **why it matters**, and **the fix**. Everything marked ✅ **Verified** was reproduced or confirmed by running something — not inferred from reading. Items without that marker are code-reading judgements.

| Severity | Count | Meaning |
| --- | --- | --- |
| 🔴 Critical | 4 | Fix before this is exposed to any real user |
| 🟠 High | 4 | Fix before launch |
| 🟡 Medium | 13 | Fix in the next cycle |
| 🔵 Low | 15 | Polish / hygiene |

**What is already good** (so the expert knows what not to re-litigate):

- HTML escaping in the CV template generator is **complete and correct** — ✅ verified against `<script>` and `<img onerror>` payloads in every field. No XSS in the PDF/preview path.
- bcrypt at 12 rounds, no plaintext passwords anywhere.
- Object-level authorisation on CV routes is correct: ownership is checked on every read/update/delete, and `PUT` correctly refuses admins (`adminAllowed: false`) so an admin cannot silently edit someone's CV.
- Role escalation logic is genuinely careful: self-role-change blocked, admins can't touch owners, last-owner protection, `assignableRoles()` gates what each actor may grant.
- Email-verification tokens use HMAC-SHA256 with `crypto.timingSafeEqual` — correct construction.
- API routes re-check authorisation server-side rather than trusting the middleware. This is what limits the blast radius of finding #2.
- ✅ `next build` passes clean.

---

# 🔴 Critical

## C1. Live credentials committed to the repository and to git history

**Where:** `README.md:89`, `.env.example:34-35`, `prisma/seed.js:4`, `prisma/seed.js:148-152`

The owner account's real email and password are hardcoded in three places and published in the README as a table:

```
| Owner | jibreelebornat@gmail.com | Miskbo123 | OWNER |
```

`prisma/seed.js` uses them as the default when no env var is set, so **every deployment of this repo that runs `db:setup` creates a working OWNER account with a publicly documented password.**

✅ **Verified:** `git log -S "Miskbo123"` returns commits `16092ad` and `a9ca972`. The password is in git history permanently — removing it from the working tree does not remove it from the repo.

**Why it matters:** if this repository is or ever becomes public, anyone can log in as OWNER: read every user's CV, promote themselves, delete accounts, and read the audit log (which contains other users' emails and IPs). It is also a personal email address published in a code repo.

**Fix:**
1. **Rotate the password now** — assume it is compromised. It is a real-looking personal password, so change it anywhere else it is used too.
2. Make the seed **fail loudly** instead of falling back: `if (!process.env.OWNER_PASSWORD) throw new Error("OWNER_PASSWORD is required")`.
3. Strip the credentials from `README.md` and `.env.example` (leave the variable names, drop the values).
4. Purge history with `git filter-repo` (or accept it and treat the password as burned — rotation is what actually matters).
5. Add a secret scanner (`gitleaks`, or GitHub secret scanning) to CI.

---

## C2. Next.js 14.2.18 — middleware authorisation bypass (CVE-2025-29927) + 30 further advisories

**Where:** `package.json:27`

✅ **Verified:** installed version is `14.2.18`. CVE-2025-29927 is patched in **14.2.25**. `npm audit` reports **6 vulnerabilities (2 critical, 3 high, 1 moderate)**, with 31 distinct advisories against `next` alone.

CVE-2025-29927 lets an attacker skip `middleware.js` entirely by sending a crafted `x-middleware-subrequest` header. `src/middleware.js` is the **only** guard on the `/admin`, `/dashboard`, `/build` and `/settings` *pages*.

**Accurate impact assessment — this is more limited than it first appears.** `/admin/page.js` is a client component that fetches everything from `/api/admin/*`, and those routes independently call `requireRole(["ADMIN","OWNER"])`. So a bypass yields the **empty admin UI shell**, not user data. The defence-in-depth at the API layer is what saves you here — credit where due. But the page-level guard is broken, the version is 8 patch releases behind on a line with two critical CVEs, and you should not be relying on that accident.

**Fix:** upgrade to the latest 14.2.x (`npm i next@^14.2.35`) — a patch bump, no breaking changes. Then run `npm audit fix` for `js-yaml` and `uuid`. Do **not** run `npm audit fix --force`; it wants to jump you to Next 16.

---

## C3. There is no password reset — and no way to change a password

**Where:** absent. ✅ **Verified:** no route, component, or handler matching `forgot|reset-password|change-password` exists anywhere in `src/`.

A user who forgets their password is **permanently locked out**, with no self-service recovery and no admin-side reset either. `/settings` shows name/email/role and an account-delete button — there is no password section.

For a product whose only authentication method is email + password, this is a launch blocker. It also compounds C1: the owner password cannot be rotated through the UI, only by re-running the seed.

**Fix:** add `POST /api/auth/forgot-password` (issue a signed token — you already have `lib/tokens.js`, just add a `purpose` claim to prevent token-type confusion), `POST /api/auth/reset-password`, and a change-password form in `/settings` that requires the current password. Rate-limit both. Invalidate sessions on reset.

> **Note:** this depends on the mail story (see C4). Right now `lib/mailer.js` is a console-log mock, so a reset link would have nowhere to go in production.

---

## C4. In production, no new user can ever log in — the signup funnel is broken end to end

**Where:** `src/lib/mailer.js:17-24`, `src/app/api/auth/register/route.js:74-79`, `src/lib/auth.js:66-72`

✅ **Verified** by tracing the three steps in sequence:

1. `sendVerificationEmail()` **sends nothing**. It builds the link, `console.log`s it, and returns `{ delivered: false }`. There is no SMTP, no transport, no provider.
2. `register` computes `exposeLink = process.env.NODE_ENV !== "production"` and returns `verifyUrl: undefined` in production. The register page then renders a plain "Go to login" button with **no link and no explanation**.
3. `authorize()` throws `EMAIL_NOT_VERIFIED` for any account with `emailVerified === null`, blocking login.

So in production: the user registers → receives no email → is shown no link → the link exists only in a server log file they cannot read → and login refuses them. **Every production signup is permanently locked out.**

The only escape is an owner/admin manually clicking "Mark Verified" in the admin panel for each individual user (`/api/admin/users/[id]` with `action: "verify"`) — which does work, but is not a signup flow.

This is not a "wire up email later" TODO. As written, the app's entire registration path is non-functional the moment `NODE_ENV=production` is set — which is exactly what `next start` does.

**Fix:** pick a mail transport (Resend, Postmark, SES, or plain SMTP via nodemailer — already present as a transitive dependency) and implement `sendVerificationEmail` for real. Until that ships, either keep verification off in production or gate the whole feature behind a flag so it fails loudly at boot rather than silently at signup. This is the same blocker as C3 — one mail integration unblocks both.

---

# 🟠 High

## H1. CSRF check is missing on every CV route — and the README says otherwise

**Where:** `src/app/api/cv/route.js` (POST), `src/app/api/cv/[id]/route.js` (PUT, DELETE)

`sameOrigin()` is applied to `/api/auth/register`, `/api/auth/resend-verification`, `/api/user/delete`, and `/api/admin/users/[id]` — but **not** to any CV mutation. `README.md:163` states "custom state-changing routes additionally enforce a same-origin check." That is not true of the routes that mutate user content.

**Honest exploitability:** the NextAuth cookie is `SameSite=Lax`, which does block cross-site POST/PUT/DELETE from carrying it in current browsers. So this is not an open hole today. It is a **defence-in-depth layer that is documented as present and is absent**, precisely where user data is destroyed — and the docs claiming otherwise is the part that will bite you in a real security review.

**Fix:** add the `sameOrigin()` guard to all three handlers, or (better) hoist it into a shared wrapper so it cannot be forgotten on the next route. Then re-check the README claim.

---

## H2. No schema validation on CV data — malformed input is stored and crashes the renderer

**Where:** `src/app/api/cv/route.js:44-49`, `src/app/api/cv/[id]/route.js:60-65`

The only check is `typeof cvData === "object"`. Everything past that is `JSON.stringify`'d straight into the database: no shape validation, no type checks on fields, no length caps, **no size limit at all**.

✅ **Verified** against `buildCvHtml()` with non-string values:

```
CRASH   skills as number      -> TypeError: s.trim is not a function
CRASH   bullet as number      -> TypeError: b.trim is not a function
CRASH   skills as object      -> TypeError: s.trim is not a function
OK      summary as object     -> renders literal "[object Object]" into the CV
```

The crash comes from `cvTemplates.js:376` and `:414`, which call `.trim()` on unvalidated array elements.

**Two consequences:**

1. **Stored DoS against admins.** In `/api/cv/[id]/pdf` the crash is caught and becomes a 500. But `CVPreview` calls `buildCvHtml` in a `useMemo` **during client render**, with no boundary. So any ordinary user can `POST /api/cv` with `{"skills":[123]}` and that CV will **crash the admin dashboard** when an admin clicks preview on it. Same for the user's own `/build` page.
2. **Unbounded storage.** Nothing stops a 50 MB `cvData` payload, or a loop writing thousands of them.

**Fix:** validate with Zod (or equivalent) at both write sites — exact shape, `.string().max(n)` on every field, array length caps, and a total payload cap. Harden `buildCvHtml` defensively too (`String(x).trim()`), and wrap `CVPreview` in an error boundary so a bad record degrades to "cannot render" rather than taking the page down.

---

## H3. Puppeteer launches a full Chrome per PDF request, with no limit

**Where:** `src/lib/pdf.js:12-20`, `src/app/api/cv/[id]/pdf/route.js`

Every single PDF download does `puppeteer.launch()` → new browser process → `close()`. There is no browser reuse, no pool, no concurrency cap, no queue, and **no rate limit on the PDF endpoint** (it is the only unthrottled expensive route in the app).

Each Chrome launch costs roughly 100–300 MB RSS and 1–3 seconds. A dozen concurrent downloads — or one user clicking "PDF" repeatedly — will exhaust memory on any small host. `maxDuration = 60` means each one can also hold a worker for a full minute.

`--no-sandbox` and `--disable-setuid-sandbox` are set. That is the standard container workaround and is acceptable *given* the input is your own trusted HTML — but it removes Chrome's last line of defence, so it depends on H2 being fixed.

**Fix:** launch one shared browser at module scope and reuse it (`newPage()`/`page.close()` per request), cap concurrency with a semaphore, add a rate limit to the PDF route, and add a hard timeout. Consider generating the PDF once and caching it against the CV's `updatedAt`.

---

## H4. Audit-log retention is promised to users but never implemented

**Where:** `src/app/privacy/page.js:59-66`, `README.md:170`

Both the Privacy Policy and the README state audit logs are "retained for up to 90 days ... then deleted."

✅ **Verified:** there is no `deleteMany`, no scheduled job, no cron, and no cleanup code anywhere in `src/` or `prisma/`. `AuditLog` rows — which contain **email addresses and IP addresses** — accumulate forever.

Every login attempt writes a row (`lib/auth.js:57`, `:75`), so this table grows faster than any other and holds the most sensitive data in the system.

**Related, same section:** the policy also promises data is "purged from backups within 30 days" — there is no backup system. And it says storage is "SQLite during local development", which stopped being true when the schema moved to Postgres-only.

**Why it matters:** a published privacy policy is a representation to users. Under GDPR-style regimes a stated retention period you do not honour is a real compliance exposure, not a documentation nit.

**Fix:** implement the deletion (a daily job, or a `deleteMany({ where: { createdAt: { lt: ninetyDaysAgo } } })` opportunistically on admin log reads), and correct the policy to describe what the system actually does.

---

# 🟡 Medium

## M1. Landing page runs a 60fps render loop that reloads an iframe document every frame

**Where:** `src/components/landing/HeroPreview.js:60-85` + `src/components/CVPreview.js:17-20`

`HeroPreview` runs a `requestAnimationFrame` loop that never stops. Each frame calls `partial(progress)`, which **returns a fresh object literal**. `CVPreview` memoises on `[cvData, templateId]` — object identity — so the memo **never hits**, and `buildCvHtml()` re-runs ~60 times per second, forever, on your highest-traffic page.

Worse: during the ~6-second typing phase of every 8.2-second cycle the generated HTML genuinely changes each frame, so `srcDoc` changes, and the browser **tears down and re-parses an entire HTML document 60 times a second**.

This is the single largest performance defect in the app — noticeable fan spin-up and battery drain on the marketing page.

**Fix:** drive the animation from a throttled state tick (~8–10fps is plenty for a typing effect), memoise on a primitive (the progress step, not the object), and/or swap `srcDoc` for a stable iframe you write into. A `React.memo` on `CVPreview` with a custom comparator would also cut it.

## M2. Builder preview is not debounced

**Where:** `src/components/build/BuildWizard.js:420` → `CVPreview`

Same mechanism: every keystroke rebuilds the full CV HTML and reloads the preview iframe document. Type a 300-character summary, get 300 full document reloads.

**Fix:** debounce the preview input by 200–300 ms.

## M3. No autosave and no unsaved-changes warning in an 8-step wizard

**Where:** `src/components/build/BuildWizard.js`

All state is in React memory until the user reaches step 8 and clicks Save. Closing the tab, hitting back, a refresh, or a session timeout **silently discards everything**. There is no draft persistence and no `beforeunload` guard.

For a form that asks for a full employment history, this is the highest-impact usability defect in the product.

**Fix:** persist to `localStorage` on change (cheap, no backend work), add a `beforeunload` handler when dirty, and ideally autosave server-side once a CV has an id.

## M4. Admin search is case-sensitive on PostgreSQL

**Where:** `src/app/api/admin/users/route.js:19`, `src/app/api/admin/cvs/route.js:16-20`

```js
where.OR = [{ name: { contains: search } }, { email: { contains: search } }];
```

Prisma's `contains` maps to `LIKE` — **case-sensitive on Postgres**. Searching "Layla" will not match "layla@example.com". `schema.prisma:25` notes the schema was kept portable to SQLite, where `LIKE` *is* case-insensitive for ASCII — so this worked before the Postgres migration and broke silently during it.

**Fix:** add `mode: "insensitive"` to each `contains`.

## M5. Admin CV table shows raw template IDs for 4 of 10 templates

**Where:** `src/app/admin/page.js:34-41`

`TEMPLATE_NAMES` lists six templates. `executive`, `harvard`, `corporate` and `technical` fall through to `|| cv.templateId` and render as lowercase slugs. `src/components/dashboard/CvList.js:14-25` has all ten — the two copies diverged.

**Fix:** delete both literals and import `TEMPLATES` from `@/lib/cvTemplates`, which is already the single source of truth.

## M6. `/api/admin/stats` loads every user row into application memory

**Where:** `src/app/api/admin/stats/route.js:17-40`

```js
prisma.user.findMany({ select: { role: true, createdAt: true } })   // ALL users
```

Then it filters that array in JavaScript **31 times** (once per day of the chart, plus admins, plus new-today). Fine at 100 users; it degrades badly and is a memory risk at scale, on a route an admin refreshes often.

**Fix:** `groupBy` on role, `count` with a `createdAt` filter for today, and one `$queryRaw` with `date_trunc` + `GROUP BY` for the 30-day series.

## M7. No pagination on admin users or CVs

**Where:** `src/app/api/admin/users/route.js:29`, `src/app/api/admin/cvs/route.js:27`

Both hard-cap at `take: 500` with no `skip`, no cursor, and no UI paging. User 501 is simply invisible, with nothing on screen indicating truncation. (The audit-log route does this correctly — copy that pattern.)

## M8. No security headers

**Where:** `next.config.js`

No `headers()` block at all. Missing: `Content-Security-Policy`, `Strict-Transport-Security`, `X-Frame-Options`/`frame-ancestors`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`. Any security scan will flag all six immediately.

## M9. Rate limiting is in-memory, resets on deploy, and trusts a spoofable header

**Where:** `src/lib/rateLimit.js`

Three separate problems:
1. **State is per-process.** Two instances (or one autoscaled container) = the limit is multiplied by the instance count. Vercel/serverless makes it near-useless.
2. **It resets on every deploy and every cold start**, clearing all lockouts.
3. `clientIp()` (`:57-62`) trusts `x-forwarded-for` unconditionally. An attacker sends a random `X-Forwarded-For` per request and the login limiter — the only brute-force defence — is bypassed entirely.

**Fix:** for #3, take the *last* hop your proxy appended, or use the platform's trusted client-IP header, and never trust the raw left-most value. For #1/#2, back the limiter with the database or Redis before running more than one instance. Also consider per-account lockout in addition to per-IP.

## M10. `/api/auth/verify-email` has no rate limit and no origin check

**Where:** `src/app/api/auth/verify-email/route.js`

Every other auth route has both. This one has neither — it is an unauthenticated POST that performs a database write. The HMAC makes token forgery infeasible, so this is hardening rather than an open hole, but it is an inconsistency in an otherwise deliberate pattern.

## M11. User enumeration on registration and login

**Where:** `src/app/api/auth/register/route.js:56-61`, `src/lib/auth.js:51-63`

Registration returns a distinct **409 "An account with this email already exists"** — a clean oracle for testing whether an address has an account here. Login is also timing-distinguishable: `bcrypt.compare` (~100 ms at 12 rounds) only runs when the user exists, so a "no such user" reject returns measurably faster.

`resend-verification` gets this exactly right (`:47` — "Always report success to avoid leaking whether an account exists"), so the intent is clearly there; it just was not applied consistently.

**Fix:** return a generic "check your email to continue" from registration regardless, and run a dummy bcrypt compare on the not-found path in `authorize()`.

## M12. `npm run lint` does not work

**Where:** `package.json:12`

✅ **Verified:** there is no `.eslintrc*` anywhere, so `next lint` drops into an interactive "How would you like to configure ESLint?" prompt. In CI it would hang until timeout. Effectively, **nothing has ever been linted**.

**Fix:** add `.eslintrc.json` with `{ "extends": "next/core-web-vitals" }`.

## M13. Zero tests and zero CI

✅ **Verified:** no test files, no test runner in `package.json`, no `.github/` directory.

There is no automated check that a change to `cvTemplates.js` does not break PDF output, that role permissions still hold, or that the build passes. For an app with a permission matrix this specific (USER/ADMIN/OWNER × own/others' resources), the authorisation rules are the highest-value thing to test.

**Fix:** Vitest + a GitHub Actions workflow running `build`, `lint`, and tests. Start with `assignableRoles()`, the `loadAuthorized()` helper, and `buildCvHtml` snapshots.

---

# 🔵 Low / polish

| # | Finding | Location |
| --- | --- | --- |
| L1 | A deleted user's JWT still passes middleware. `authorized` checks `!!token`, but the jwt callback only nulls `token.uid` — the token object still exists, so the user reaches the page shell before the server-side check empties it. Check `!!token?.uid` instead. | `src/middleware.js:16`, `src/lib/auth.js:116` |
| L2 | The jwt callback queries the database on **every request**, including every middleware run. Cache the role on the token with a short TTL. | `src/lib/auth.js:106-118` |
| L3 | All admin confirmations use native `alert()`/`confirm()`. Inconsistent with the app's otherwise polished modal design. | `src/app/admin/page.js:118,126,167` |
| L4 | `CvList.load()` ignores `res.ok`. A 401 or 500 renders the cheerful "No CVs yet — create your first!" empty state instead of an error. | `src/components/dashboard/CvList.js:31-35` |
| L5 | Privacy policy says data lives in "SQLite during local development" — untrue since the Postgres migration. | `src/app/privacy/page.js:33-39` |
| L6 | `key={i}` on wizard list items. Removing a middle entry re-keys everything below it and can misplace focus mid-typing. | `BuildWizard.js:174,210,278,331` |
| L7 | `AuditLog.userId` is a bare `String?` with no relation to `User` — cannot be joined, and dangles after account deletion (`DELETE_ACCOUNT` writes `userId: null` anyway). Either make it a real optional relation or rename it to signal it is a historical snapshot. | `prisma/schema.prisma:108` |
| L8 | Last-owner protection is a check-then-act race. Two concurrent demotions could both read `owners = 2` and both proceed. Wrap in a transaction. | `src/app/api/admin/users/[id]/route.js:64-72` |
| L9 | Hero CTA "Build my CV" links to `/build`, which middleware bounces to `/login`. The main conversion path dead-ends at a signup wall with no explanation. Consider a guest builder that prompts for signup only at save. | `src/app/page.js:85` |
| L10 | Preview iframe uses `sandbox="allow-same-origin"`, granting it the parent origin. Safe only because `allow-scripts` is absent — remove the attribute entirely for a stricter default. | `src/components/CVPreview.js:46` |
| L11 | No `robots.txt`, `sitemap.xml`, Open Graph/Twitter tags, favicon, or per-page canonical URLs. For a free consumer product that depends on organic search, this is a real gap. | `src/app/layout.js` |
| L12 | `/admin` ships **214 kB** First Load JS — the largest route by 2× — mostly `recharts`. Dynamic-import the chart, or move the tables to server components. ✅ Confirmed from build output. | `src/app/admin/page.js` |
| L13 | Modals have no focus trap, no Escape-to-close, and no `role="dialog"`/`aria-modal`. Keyboard and screen-reader users cannot dismiss them. Affects four modals. | admin page, `DeleteAccount.js`, `BuildWizard.js` |
| L14 | Nothing validates at boot that `NEXTAUTH_SECRET` was changed from the `.env.example` placeholder. `lib/tokens.js:23` also silently falls back to a hardcoded dev secret outside production — correct, but worth an explicit startup assertion. | `src/lib/tokens.js:13-24` |
| L15 | Schema is managed with `prisma db push` only — no `migrations/` directory. There is no migration history, no rollback path, and no safe way to evolve the schema against production data. Switch to `prisma migrate` before real users exist. | `package.json:14`, `prisma/` |

---

# Suggested order of work

**Before anyone else touches this**
1. Rotate the owner password; strip credentials from README / `.env.example` / seed (**C1**)
2. `npm i next@^14.2.35 && npm audit fix` (**C2**)

**Before launch**
3. **Wire up a real mail transport** (**C4**) — this single piece unblocks both verification and password reset, and without it production signup does not work at all
4. Password reset + change password (**C3**)
5. Zod validation on CV writes + error boundary on `CVPreview` (**H2**)
6. `sameOrigin()` on the CV routes, and correct the README claim (**H1**)
7. Shared Puppeteer browser + concurrency cap + rate limit on the PDF route (**H3**)
8. Implement the 90-day audit purge, and fix the privacy policy to match reality (**H4**)

**First iteration after launch**
9. Autosave / unsaved-changes guard (**M3**) — biggest user-facing win
10. Throttle `HeroPreview`, debounce the builder preview (**M1, M2**)
11. `mode: "insensitive"` on admin search; import `TEMPLATES` in the admin table (**M4, M5**)
12. ESLint config + CI running build/lint/tests; start tests with the permission matrix (**M12, M13**)
13. Security headers (**M8**); fix `clientIp` spoofing (**M9**)

**Then**
14. Admin pagination + SQL aggregates for stats (**M6, M7**)
15. `prisma migrate` before production data exists (**L15**)
16. Accessibility pass on modals (**L13**); SEO metadata (**L11**)

---

# Questions worth asking the expert

1. **Deployment target.** Puppeteer's bundled Chromium does not fit Vercel's serverless limits, and the in-memory rate limiter is meaningless there. Is this going on a persistent Node host (Render/Railway/VPS) or serverless? The answer changes H3 and M9 substantially.
2. **Is the repository public?** This decides how urgent C1's history purge is versus just rotating the password.
3. **Admins can read every user's CV** (`/api/cv/[id]`, `/api/admin/cvs`) with no consent flow, no notification to the user, and no audit entry when it happens. The privacy policy permits it "for maintenance and support only" — but nothing enforces or records that. Is that acceptable for your jurisdiction, and should CV *access* be audited the way role changes are?
4. **Email provider.** C4 needs a transport. For a free product the practical options are Resend (generous free tier), Postmark, SES, or SMTP through a Gmail app password. Which fits your budget and region — and do you want verification to stay mandatory once email works, or become optional with a soft nudge?
5. **Scale expectation.** M6/M7 are non-issues at 500 users and serious at 50,000. What is the target?
6. **Is the email-verification gate worth its cost?** It currently blocks 100% of production signups (C4) and adds a step to the funnel. Given CVs contain no payment data and the abuse surface is low, is hard-blocking login the right trade, or would verify-on-first-download be enough?
