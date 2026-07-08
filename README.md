# Lead Intake & Nurture — Demo

A small, portfolio-grade demo of a lead intake and nurture automation flow:
a public inquiry form that captures a prospect, fires off a branded
confirmation email, and drops the lead into an internal admin dashboard —
which visually flags anyone who hasn't been followed up with in a few days,
so leads don't quietly go cold.

This is a demo/portfolio project, not a production SaaS. Data is realistic,
copy is real, and the code is written the way it would be for a real client —
but the scope is intentionally small.

## Tech stack

- **Next.js** (App Router, TypeScript) — public form, API route, and admin
  dashboard, all in one app
- **Tailwind CSS** — styling
- **better-sqlite3** — a single local SQLite file (`data/leads.db`) as the
  datastore, no external database needed
- **Resend** — transactional email for the confirmation message (falls back
  to a console-logged simulation when no API key is configured, so the app
  runs end-to-end with zero setup)
- HTTP Basic Auth (via `middleware.ts`) gating the `/admin` dashboard

## Setup

```bash
npm install
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000) for the public form,
or [http://localhost:3000/admin](http://localhost:3000/admin) for the
dashboard (you'll be prompted for the admin username/password — see below).

On first run, `data/leads.db` is created automatically and seeded with five
realistic demo leads so the dashboard isn't empty. Real submissions through
the form are added on top of that seed data.

Copy `.env.example` to `.env` and adjust as needed — see the table below.
Everything works with `RESEND_API_KEY` left blank (email sends are simulated
and logged to the console instead).

## Environment variables

| Variable | Purpose |
| --- | --- |
| `RESEND_API_KEY` | Your [Resend](https://resend.com) API key. Leave blank to run in email-simulation mode — confirmation emails are logged to the console instead of actually sent, so the demo works with no third-party account. |
| `RESEND_FROM_EMAIL` | The "from" address used for confirmation emails. Defaults to `onboarding@resend.dev`, Resend's shared sandbox sender, which works without verifying your own domain. |
| `ADMIN_USER` | Username required by the Basic Auth prompt in front of `/admin`. **Required in production** — if unset there, `/admin` fails closed (always 401) rather than falling back to the development default. |
| `ADMIN_PASSWORD` | Password required by the Basic Auth prompt in front of `/admin`. Same production fail-closed behavior as `ADMIN_USER`. |
| `DATA_DIR` | Optional. Directory for the SQLite file. Point it at a mounted persistent volume in production (e.g. `/data` on Railway) so lead data survives redeploys. Defaults to `./data`. |
| `DISPLAY_TZ` | Optional. IANA timezone (e.g. `America/New_York`) used for date display in the dashboard, so a UTC server doesn't show "tomorrow's" date. Defaults to `America/Denver`. |

The public form endpoint (`POST /api/leads`) has basic abuse protection:
a hidden honeypot field that silently drops bot submissions, per-field
length caps, and a per-IP rate limit (5 submissions/minute). The dashboard
also has a per-row **Remove** action for cleaning up any junk that gets
through.

## How the nurture highlighting works

Every lead has a `created_at` timestamp and a `followed_up` flag. The admin
dashboard computes how many whole days have passed since each lead came in,
and if a lead is **more than 3 days old and still hasn't been marked followed
up**, its row is visually flagged — an amber background wash, a left accent
border, and a "Needs follow-up" badge — and it's counted in the "Needs
follow-up" stat card up top. Clicking "Mark followed up" on a row clears the
flag immediately (via a Server Action, no page reload). The point is to make
leads that are quietly going cold impossible to miss at a glance.

## Demo admin login

Username is `admin`. The password is whatever `ADMIN_PASSWORD` is set to in
your local `.env` — see that file (it isn't documented here since it's a
credential, even for a demo).

## Deployment note

This app is built to run on **Railway** (or any host that gives you a
persistent, long-running Node process), not Vercel. It uses better-sqlite3
against a local file (`data/leads.db`) for simplicity, and Vercel's
serverless functions run on an ephemeral, read-only-between-invocations
filesystem — writes to a local SQLite file won't reliably persist from one
request to the next. A persistent Node process (Railway, Render, Fly.io, a
plain VM, etc.) keeps that file on disk across requests, which is exactly
what this demo needs. `package.json`'s `start` script already respects
Railway's `PORT` environment variable, and a small `nixpacks.toml` ensures
Railway's build has the toolchain available to compile better-sqlite3's
native module if a prebuilt binary isn't available for the target platform.
