# 2026 Dutchie Cybersecurity Awareness Month

The central hub for Security Awareness Month 2026: a gamified security-clearance
progression system with a leaderboard, employee profiles, and in-app challenge
forms that award XP automatically.

Built with Next.js (App Router) + TypeScript + Tailwind + Prisma/Postgres.

## Why a live app, not the old static leaderboard?

`BUILD_PROMPT.md`-style leaderboards (a prior iteration of this idea) were
fully static and fed by CSV drops — great for read-only display, but this app
also needs to **accept submissions live, grade them, award XP automatically,
and prevent double-claiming**. That requires real persistence, so this is a
Postgres-backed app instead. The tier model, badge-card anatomy, deterministic
codename system, and visual language are carried over from that spec.

## Core mechanics

- **XP → Clearance tiers**: UNCLASSIFIED (0–200) → SECRET (201–400) → TOP_SECRET
  (401+). ROGUE is an admin-only manual override tier — never reachable via
  XP, only set via the admin panel. See `src/lib/tiers.ts`.
- **Challenges**: admins create challenges with an XP value and one of four
  grading modes (exact match, case-insensitive match, multiple choice, or
  free-text manual review). Employees submit via `/challenges/[slug]`.
- **Dedup**: enforced both in the UI (shows "already completed") and via a
  hard Postgres `@@unique([employeeId, challengeId])` constraint — no one can
  double-claim XP for the same challenge, even under a race.
- **Clearance issued date**: computed by walking a person's XP chronologically
  and recording the exact moment their running total first crossed into each
  tier — not a decorative placeholder. See `computeClearanceIssuedDates` in
  `src/lib/tiers.ts`.
- **Badge flare**: admins can add achievements, custom colors/effects, ribbons,
  icon overrides, pin-to-top, name suffixes, and expiring flare per employee.
  Any invalid/unrecognized flare value is logged as a warning and silently
  ignored — it never breaks rendering. See `src/lib/flare.ts`.
- **Deterministic flavor text**: codenames, agent IDs, fun facts, and barcodes
  are derived from each person's lowercased email via a stable hash, with
  guaranteed-unique codenames across the current roster. See
  `src/lib/identity.ts`.

## Identity model

Employees "identify" with just a name + `@dutchie.com` email (no SSO/password) —
stored in a signed cookie. This is an internal engagement tool, not a real
security boundary, per the team's decision. The lowercased email is the stable
identity key used everywhere (profile URLs, dedup, flavor generation).

Admins get a separate passphrase-gated `/admin` area (`ADMIN_PASSPHRASE` env
var) since they can grant XP and edit flare.

The ROGUE tier renders in the leaderboard like any other tier (red glitch
styling, warning banner, `PROCESS_420` watermark, `process420` keyboard
easter egg) — there's no password gate on it. Anyone who's been manually
flagged ROGUE by an admin is simply visible to everyone.

## Local development

Postgres must be running and reachable at `DATABASE_URL` (see `.env.example`).
In this VAPE environment, Postgres was installed locally and is managed via
`service postgresql start` (no sidecar was provisioned for this empty
constellation) — the `security_awareness_2026` database and `postgres/postgres`
credentials are already set up.

```bash
cp .env.example .env   # then fill in real secrets
npm install
npx prisma migrate dev   # apply schema
npm run db:seed          # optional: demo employees/challenges/flare
npm run dev
```

The app is also registered as a supervised VAPE proc named
`security-awareness-2026` (see `get_proc_status`/`get_proc_logs`).

## Admin workflow

1. Go to `/admin`, enter `ADMIN_PASSPHRASE`.
2. **Challenges**: create/edit challenges, set XP value, grading mode, and an
   optional open/close window.
3. **Submissions**: approve/reject free-text (`FREE_TEXT_REVIEW`) submissions —
   XP posts only once approved.
4. **Badge Flare**: pick an employee, set achievements/colors/effects/ribbons/
   etc. Invalid values are ignored with a warning (visible in proc logs).
5. **Employees**: flip the manual ROGUE override, or grant ad-hoc bonus XP
   (recorded as an auditable synthetic "Manual Bonus" challenge submission,
   not an untracked side channel).

## Project structure

```
src/
  app/                 Next.js App Router pages
    leaderboard/        Public tier-grouped badge wall
    challenges/         Challenge list + submission forms
    profile/[email]/    Read-only profile pages
    identify/           Name + email entry gate
    admin/              Passphrase-gated admin panel
  components/          BadgeCard, LeaderboardClient, Nav, Icon, confetti, etc.
  lib/
    tiers.ts            Tier definitions, progress math, clearance-issued dates
    identity.ts          Deterministic codename/agent-id/fun-fact generation
    flare.ts             Badge flare validation/resolution (never crashes)
    leaderboard.ts        Roster building, grouping, ranking
    session.ts            Signed cookie helpers (agent/admin)
    actions/              Server actions (identify, submit, admin)
  proxy.ts               Middleware-equivalent: gates all pages behind /identify
prisma/
  schema.prisma          Employee / Challenge / Submission / BadgeFlare models
  seed.ts                Demo data across all tiers, including one ROGUE + flare
```
