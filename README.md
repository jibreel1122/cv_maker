# CV Maker — free professional CV builder

A free web app where users sign in (Google, Apple, or email), fill in a guided
multi-step form, watch a **live preview** of their CV, choose from several
modern **ATS-friendly** templates, and download a polished **PDF** — in English,
accepted in Palestine and worldwide. It includes a full **admin dashboard** with
user management, role assignment, and visibility into every CV.

> There are **no payments**. The whole product is free.

## Features

- **Authentication** — Google, Apple, and email/password (NextAuth).
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

```bash
# 1) Install dependencies
npm install

# 2) Configure environment variables
cp .env.example .env.local
#   - Set NEXTAUTH_SECRET (e.g. `openssl rand -base64 32`)
#   - Optionally add Google / Apple OAuth keys
#   - OWNER_EMAIL / OWNER_PASSWORD seed the first owner account

# 3) Create the database schema
npm run db:push

# 4) Seed the owner/admin account
npm run db:seed

# 5) Run
npm run dev          # http://localhost:3000
```

### Owner / admin account

The first owner is seeded from `OWNER_EMAIL` / `OWNER_PASSWORD` in `.env.local`
(defaults to the project owner's credentials). Sign in at `/login` and open
`/admin`. The owner can grant the `ADMIN` or `OWNER` role to any user.

| Role  | Can do                                                            |
| ----- | ---------------------------------------------------------------- |
| USER  | Create, edit, download, and delete their own CVs                 |
| ADMIN | Everything above + view all users/CVs, toggle USER ↔ ADMIN       |
| OWNER | Everything above + grant/revoke OWNER, delete users              |

## Google & Apple sign-in

Both activate automatically once their keys are present in the environment:

- **Google** — create OAuth credentials in Google Cloud Console and set
  `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`. Redirect URI:
  `<NEXTAUTH_URL>/api/auth/callback/google`.
- **Apple** — from your Apple Developer account (Sign in with Apple), set
  `APPLE_ID` and `APPLE_CLIENT_SECRET` (the signed client-secret JWT). Redirect
  URI: `<NEXTAUTH_URL>/api/auth/callback/apple`.

When neither is configured, the email/password flow still works and the sign-in
pages simply hide the social buttons.

## Project structure

```
prisma/
  schema.prisma        # User, Account, Session, VerificationToken, CV
  seed.js              # seeds the OWNER account
src/
  app/
    page.js            # landing page
    login/ register/   # auth pages
    dashboard/         # user's CV list
    build/             # CV builder (create / edit)
    admin/             # admin dashboard
    api/
      auth/            # NextAuth + register
      cv/              # CRUD + /[id]/pdf
      admin/           # stats, users, role changes, cvs
  components/          # UI components
  lib/
    auth.js            # NextAuth config + role helpers
    session.js         # server-side session/role guards
    cvTemplates.js     # CV HTML/CSS generator (single source of truth)
    cvDefaults.js      # empty + sample CV data
    pdf.js             # Puppeteer HTML → PDF
    prisma.js          # Prisma client singleton
  middleware.js        # route protection (/dashboard, /build, /admin)
```

## Deploying to production

1. **Database** — switch `provider` in `prisma/schema.prisma` to `postgresql`
   and point `DATABASE_URL` at a managed Postgres (Neon / Supabase). Run
   `npm run db:push` and `npm run db:seed`.
2. **PDF on serverless** — Puppeteer's bundled Chromium is too large for some
   serverless platforms. Replace `puppeteer` with `puppeteer-core` +
   `@sparticuz/chromium` in `src/lib/pdf.js`. On a regular Node host (Render,
   Railway, a VPS, Docker) the current setup works as-is.
3. **Environment** — set `NEXTAUTH_URL` to the production URL and a strong
   `NEXTAUTH_SECRET`, plus any OAuth keys.
