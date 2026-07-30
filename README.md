# CV Maker — free professional CV builder

A free web app where users sign in with **email & password**, fill in a guided
multi-step form, watch a **live preview** of their CV, choose from several
modern **ATS-friendly** templates, and download a polished **PDF** — in English,
accepted in Palestine and worldwide. It includes a full **admin dashboard** with
user management, role assignment, and visibility into every CV.

> There are **no payments** and **no paid third-party services**. Sign-in is
> email/password only — no OAuth providers and no email server. The only thing
> you provide is a free **Supabase** Postgres database.

## Features

- **Authentication** — email/password only (NextAuth). No external OAuth.
- **Email verification** — optional, via Resend. Off by default so local and
  unconfigured deployments work; enable it with `ENABLE_EMAIL_VERIFICATION="true"`
  once a sending domain is verified.
- **Roles** — `USER`, `ADMIN`, `OWNER`. The owner/admin can promote or demote
  users from the dashboard.
- **CV builder** — multi-step form with a live, pixel-accurate preview and
  modern UI animations.
- **Templates** — **five** ATS-proven English designs, each tuned to a hiring
  context: **Classic Corporate**, **Modern Professional**, **Tech / Minimalist**,
  **Executive**, and **Academic / Harvard**. Section order varies by template
  (a technical CV leads with skills, an academic one with education). All use
  standard fonts only — Arial, Calibri, Helvetica, Georgia, Garamond — with no
  external font requests, so previews and PDFs render identically and offline.
  CVs saved under the previous ten template ids are mapped onto their closest
  equivalent automatically.
- **Renameable sections** — any built-in heading can be relabelled ("Work
  Experience" → "Relevant Experience"), with recognised presets suggested.
- **Custom sections** — add your own sections (Projects, Volunteering,
  Publications, Awards…) with full entries: title, subtitle, dates, location and
  bullet points. They render identically to the built-in sections.
- **Never lose your work** — the builder autosaves every change to
  `localStorage`, offers the draft back if you return, and warns before you
  close the tab with unsaved changes.
- **PDF export** — generated through a real headless Chrome (Puppeteer) shared
  across requests, so the download matches the preview exactly and a burst of
  downloads does not spawn a browser per request.
- **Admin dashboard** — overview stats + 30-day signups chart, a user table
  with inline role management, and a CV browser (view / download any CV).
- **Modern green UI** — clean light theme with scroll-reveal and hover motion,
  built with Tailwind CSS.

## Tech stack

- **Next.js 14** (App Router) + **React 18**
- **NextAuth** (JWT sessions) + **Prisma adapter**
- **Prisma** ORM on **PostgreSQL** (Supabase)
- **Tailwind CSS**, **lucide-react**, **recharts**
- **Puppeteer** for PDF generation

## Getting started

```bash
# 1) Install dependencies
npm install

# 2) Set up your database connection (see "Database (Supabase)" below)
cp .env.example .env        # then edit .env with your Supabase URLs + a secret

# 3) Create the tables and seed the owner/demo accounts
npm run db:setup

# 4) Run
npm run dev                 # http://localhost:3000
```

## Database (Supabase)

This app stores everything in a PostgreSQL database hosted on
[Supabase](https://supabase.com) (free tier is plenty).

1. Create a project at **app.supabase.com**.
2. Open **Project → Settings → Database → Connection string** and copy two
   strings into your `.env`:
   - **`DATABASE_URL`** — the **Connection pooling** string (Transaction mode,
     port **6543**). Keep the `?pgbouncer=true` flag. The app uses this at
     runtime.
   - **`DIRECT_URL`** — the **Direct connection** string (port **5432**).
     Prisma uses this for `npm run db:setup` / migrations.

   Replace `[PASSWORD]` with your database password.
3. Run `npm run db:setup` to create the tables and seed accounts.

> **Where does the "anon key" go?** You don't need it. This app connects to
> Postgres **directly through Prisma** using the connection strings above, so
> the Supabase Project URL and anon/public key are **not required**. If you
> later add the `@supabase/supabase-js` client (for Auth/Storage/Realtime),
> placeholders for `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
> are included (commented out) at the bottom of `.env.example`.

### Generating the auth secret

```bash
openssl rand -base64 32      # paste into NEXTAUTH_SECRET in .env
```

### Seeded accounts

| Account | Email | Password | Role |
| ------- | ----- | -------- | ---- |
| Owner | `jibreelebornat@gmail.com` | `Miskbo123` | OWNER |
| Admin | `admin@cvmaker.local` | `Admin1234` | ADMIN |
| Demo user (has 2 sample CVs) | `demo@cvmaker.local` | `Demo1234` | USER |

All seeded accounts are pre-verified. Sign in at `/login`; the owner/admin can
open `/admin`. The owner can grant the `ADMIN` or `OWNER` role to any user.

### Email verification (Resend)

Verification email is sent through [Resend](https://resend.com). It is **opt-in
and off by default**, and only runs when **both** of these are set:

```
ENABLE_EMAIL_VERIFICATION="true"
RESEND_API_KEY="re_xxxxxxxxxxxx"
```

| Configuration | Behaviour |
| ------------- | --------- |
| Flag unset / `"false"` (default) | Verification off. New accounts are created already verified and can sign in immediately. |
| Flag `"true"` + working key + verified domain | Verification email sent. The account cannot sign in until the link is opened. |
| Flag `"true"` but Resend refuses for a config reason | The account is verified automatically and a warning is logged — signup never gets stuck. |

Leave the flag off until your custom domain's DNS is verified in Resend. The
coupling is deliberate: requiring a verified address while no mail can be sent
would lock every new account out permanently.

#### Setting up a custom domain

1. Create a free account at [resend.com](https://resend.com).
2. **Domains → Add Domain**, then add the DKIM/SPF records it gives you to your
   DNS. Wait for the domain to show **Verified**.
3. **API Keys → Create API Key**.
4. Set in your environment:
   ```
   ENABLE_EMAIL_VERIFICATION="true"
   RESEND_API_KEY="re_xxxxxxxxxxxx"
   EMAIL_FROM="CV Maker <noreply@yourdomain.com>"
   NEXTAUTH_URL="https://your-domain.com"
   ```
   `EMAIL_FROM` must be an address **on the domain you verified**.

> **About `onboarding@resend.dev`.** Resend's shared test sender needs no domain,
> but it can **only deliver to the email address that owns your Resend account** —
> every other recipient is rejected with a 403. Do not point `EMAIL_FROM` at it
> for real users.

#### What happens when Resend refuses a message

The free tier rejects sends while a domain is still pending. Rather than leave
those users unable to log in, `src/lib/mailer.js` separates two kinds of failure:

- **Configuration errors** (403, `validation_error`, `invalid_from_address`,
  `restricted_api_key`, bad or missing key) — the email could never arrive under
  the current setup, so the account is verified automatically, a warning is
  logged, and the sign-up screen says *"Account created! You can log in
  immediately."*
- **Transient errors** (rate limit, quota, network) — the message may still
  arrive on a retry, so the account stays unverified and the user can request a
  fresh link. Verification is not silently downgraded just because traffic spiked.

The emailed link points at `/api/auth/verify-email?token=...`, which validates
the signed 24-hour token, sets `emailVerified`, and redirects to a confirmation
page. Expired links offer a resend.

> **Security note.** While verification is off — or while it is auto-bypassing a
> domain restriction — email addresses are effectively unconfirmed, so someone
> can register with an address they do not own. That is the intended trade during
> the transitional period; turn the flag on once your domain is verified.

| Role  | Can do                                                            |
| ----- | ---------------------------------------------------------------- |
| USER  | Create, edit, download, and delete their own CVs                 |
| ADMIN | Everything above + view all users/CVs, toggle USER ↔ ADMIN       |
| OWNER | Everything above + grant/revoke OWNER, delete users              |

## Project structure

```
prisma/
  schema.prisma        # User, Account, Session, VerificationToken, CV, AuditLog
  seed.js              # seeds the OWNER + demo accounts and sample CVs
src/
  app/
    page.js            # landing page
    login/ register/   # auth pages
    verify-email/      # email verification page
    dashboard/         # user's CV list
    settings/          # account settings + danger zone (delete account)
    build/             # CV builder (create / edit)
    admin/             # admin dashboard
    admin/audit-logs/  # audit log viewer (owner only)
    privacy/ terms/    # legal pages
    api/
      auth/            # NextAuth, register, verify-email, resend-verification
      cv/              # CRUD + /[id]/pdf
      user/delete/     # account self-deletion
      admin/           # stats, users, role changes, cvs, audit-logs
    error.js           # friendly route error boundary (replaces blank error page)
    global-error.js    # root error boundary
  components/
    ErrorBoundary.js   # isolates the CV renderer from the surrounding page
    build/
      BuildWizard.js   # the 9-step builder
      CustomSections.js# user-defined section editor
      SectionTitleField.js # rename any built-in heading
      useCvDraft.js    # localStorage autosave + draft restore
    Reveal.js          # scroll-reveal animation wrapper
    Footer.js          # footer (with "Made by Jibreel Bornat")
    ...                # other UI components
  lib/
    auth.js            # NextAuth config + role helpers
    session.js         # server-side session/role guards
    tokens.js          # signed email-verification tokens
    mailer.js          # Resend transport + the verification on/off switch
    rateLimit.js       # in-memory rate limiter
    audit.js           # audit logging
    security.js        # same-origin (CSRF) check
    cvTemplates.js     # CV HTML/CSS generator — renders a CV to a full document
    cvTemplateMeta.js  # the 5 templates: fonts, accents, section order, legacy ids
    cvSections.js      # standard section headings + rename/creation presets
    validations/cv.js  # Zod schema — normalises all CV input before it is stored
    cvDefaults.js      # empty + sample CV data
    pdf.js             # Puppeteer HTML → PDF (shared browser, concurrency gate)
    prisma.js          # Prisma client singleton
  middleware.js        # route protection (/dashboard, /build, /admin, /settings)
```

## Security & Privacy

- **Email verification.** Email/password sign-ups must verify their address
  before they can log in. Registration generates a signed, 24-hour verification
  link shown on screen (no email is sent in this local build); unverified
  accounts are blocked at login. Owners/admins can manually verify or remove
  unverified accounts from the admin dashboard.
- **Password hashing.** Passwords are hashed with bcrypt (12 salt rounds). Plain
  passwords are never stored or logged.
- **CSRF & cookies.** NextAuth session cookies are `HttpOnly`, `SameSite=Lax`,
  and `Secure` in production. The NextAuth callback is CSRF-token protected, and
  every custom state-changing route — including all CV create/update/delete
  endpoints — additionally enforces a same-origin check.
- **Input validation.** All CV data passes through a Zod schema
  (`src/lib/validations/cv.js`) before it is stored. The schema normalises rather
  than rejects: every field is coerced to a safe type and capped in length, so
  malformed input can neither be persisted nor crash the renderer.
- **Rate limiting.** Login is limited to 5 failed attempts per IP per 15 minutes;
  registration to 3 accounts per IP per hour. The limiter is in-memory (per
  instance) with no external dependency — ideal for local development and
  single-instance deployments.
- **Audit logs.** Logins (success/failure), role changes, and account deletions
  are recorded in an `AuditLog` table, viewable by the owner at
  `/admin/audit-logs`. Audit logs are retained for **90 days**.
- **Your data.** Users can permanently delete their account and all CVs at any
  time from **Settings → Danger Zone**. See the in-app
  [Privacy Policy](/privacy) and [Terms of Service](/terms).

## Deploying to production

1. **Database** — already PostgreSQL/Supabase. Set `DATABASE_URL` and
   `DIRECT_URL` in your host's env vars and run `npm run db:setup` once.
2. **PDF on serverless** — Puppeteer's bundled Chromium is too large for some
   serverless platforms. Replace `puppeteer` with `puppeteer-core` +
   `@sparticuz/chromium` in `src/lib/pdf.js`. On a regular Node host (Render,
   Railway, a VPS, Docker) the current setup works as-is. The renderer keeps one
   shared browser per process and caps concurrent renders (see `pdf.js`), so a
   long-lived Node host benefits most.
3. **Environment** — set `NEXTAUTH_URL` to the production URL and a strong
   `NEXTAUTH_SECRET` (`openssl rand -base64 32`).
4. **Email** — verification stays off until you set
   `ENABLE_EMAIL_VERIFICATION="true"` alongside a working `RESEND_API_KEY` and a
   verified sending domain. Deploying with it off is a supported configuration:
   accounts are simply usable immediately.
