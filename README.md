# CV Maker — free professional CV builder

A free web app where users sign in with **email & password**, fill in a guided
multi-step form, watch a **live preview** of their CV, choose from several
modern **ATS-friendly** templates, and download a polished **PDF** — in English,
accepted in Palestine and worldwide. It includes a full **admin dashboard** with
user management, role assignment, and visibility into every CV.

> There are **no payments** and **no external services**. The whole product is
> free and runs **100% locally** — no API keys, OAuth providers, email servers,
> or third-party accounts required.

## Features

- **Authentication** — email/password only (NextAuth). No external OAuth.
- **Roles** — `USER`, `ADMIN`, `OWNER`. The owner/admin can promote or demote
  users from the dashboard.
- **CV builder** — multi-step form with a live, pixel-accurate preview.
- **Templates** — six distinct, single-column, ATS-safe English designs
  (Classic, Modern, Professional, Minimal, Elegant, Compact).
- **PDF export** — generated through a real headless Chrome (Puppeteer), so the
  download matches the preview exactly.
- **Admin dashboard** — overview stats + 30-day signups chart, a user table
  with inline role management, and a CV browser (view / download any CV).
- **Modern green UI** — clean light theme built with Tailwind CSS.

## Tech stack

- **Next.js 14** (App Router) + **React 18**
- **NextAuth** (JWT sessions) + **Prisma adapter**
- **Prisma** ORM — SQLite for local dev, Postgres-ready for production
- **Tailwind CSS**, **lucide-react**, **recharts**
- **Puppeteer** for PDF generation

## Getting started

No configuration is required — just install and run:

```bash
npm install
npm run dev          # http://localhost:3000
```

`npm run dev` automatically generates the Prisma client, creates the local
SQLite database (`prisma/dev.db`), and seeds the owner + demo accounts before
starting Next.js. There are **no keys to set** and **nothing to copy** — the
non-secret `DATABASE_URL` ships in the committed `.env`, and a development
`NEXTAUTH_SECRET` fallback is used automatically.

> Want to customise? Copy `.env.example` to `.env.local` and set
> `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, or override the seeded owner credentials.

### Seeded accounts

| Account | Email | Password | Role |
| ------- | ----- | -------- | ---- |
| Owner | `jibreelebornat@gmail.com` | `Miskbo123` | OWNER |
| Admin | `admin@cvmaker.local` | `Admin1234` | ADMIN |
| Demo user (has 2 sample CVs) | `demo@cvmaker.local` | `Demo1234` | USER |

All seeded accounts are pre-verified. Sign in at `/login`; the owner/admin can
open `/admin`. The owner can grant the `ADMIN` or `OWNER` role to any user.

### Email verification (local mock)

There is **no email server**. When a new user registers, the verification link
is **shown directly on screen** (and printed to the server console) — click it
to verify the account immediately. The backend still validates the signed,
24-hour token and sets `emailVerified` before the account can log in.

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
  components/          # UI components
  lib/
    auth.js            # NextAuth config + role helpers
    session.js         # server-side session/role guards
    tokens.js          # signed email-verification tokens
    mailer.js          # local mock — builds & logs the verification link (no email sent)
    rateLimit.js       # in-memory rate limiter
    audit.js           # audit logging
    security.js        # same-origin (CSRF) check
    cvTemplates.js     # CV HTML/CSS generator (single source of truth)
    cvDefaults.js      # empty + sample CV data
    pdf.js             # Puppeteer HTML → PDF
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
  custom state-changing routes additionally enforce a same-origin check.
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

1. **Database** — switch `provider` in `prisma/schema.prisma` to `postgresql`
   and point `DATABASE_URL` at a managed Postgres (Neon / Supabase). Run
   `npm run db:push` and `npm run db:seed`.
2. **PDF on serverless** — Puppeteer's bundled Chromium is too large for some
   serverless platforms. Replace `puppeteer` with `puppeteer-core` +
   `@sparticuz/chromium` in `src/lib/pdf.js`. On a regular Node host (Render,
   Railway, a VPS, Docker) the current setup works as-is.
3. **Environment** — set `NEXTAUTH_URL` to the production URL and a strong
   `NEXTAUTH_SECRET` (`openssl rand -base64 32`). In production the on-screen
   verification link is **not** returned by the API, so wire up a real email
   transport in `src/lib/mailer.js` if you deploy publicly.
