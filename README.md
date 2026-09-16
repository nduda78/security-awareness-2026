# 2026 Dutchie Cybersecurity Awareness Month

The central hub for Security Awareness Month 2026: a gamified security-clearance
progression system with a leaderboard, employee profiles, and in-app challenge
forms that award XP automatically.

Built with Next.js (App Router) + TypeScript + Tailwind + Prisma/SQLite.

## Why a live app, not the old static leaderboard?

`BUILD_PROMPT.md`-style leaderboards (a prior iteration of this idea) were
fully static and fed by CSV drops — great for read-only display, but this app
also needs to **accept submissions live, grade them, award XP automatically,
and prevent double-claiming**. That requires real persistence, so this is a
SQLite-backed app instead (originally Postgres — migrated to SQLite; see
"Database" below for why). The tier model, badge-card anatomy, deterministic
codename system, and visual language are carried over from that spec.

## Core mechanics

- **XP → Clearance tiers**: UNCLASSIFIED (0–200) → SECRET (201–400) → TOP_SECRET
  (401+). ROGUE is an admin-only manual override tier — never reachable via
  XP, only set via the admin panel. See `src/lib/tiers.ts`.
- **Challenges**: admins create challenges with an XP value and one of four
  grading modes (exact match, case-insensitive match, multiple choice, or
  free-text manual review). Employees submit via `/challenges/[slug]`.
- **Dedup**: enforced both in the UI (shows "already completed") and via a
  hard `@@unique([employeeId, challengeId])` constraint — no one can
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

## Database

This app uses **SQLite via Prisma** — a single file at `prisma/data/security_awareness_2026.db`
(the path Prisma resolves `DATABASE_URL="file:./data/..."` against is
relative to `prisma/`, not the repo root — worth knowing if you go looking
for the file). There's no database *service* to install, start, or lose:
unlike the original Postgres setup (which ran as a system service on this
pod's own disk with no persistent volume, and was fully wiped by a pod
restart once already), the SQLite file is just a file. It's still on this
pod's ephemeral disk, though, so it still needs a backup strategy:

- **`npm run db:backup`** dumps the live DB to a timestamped, git-friendly
  SQL text file under `db-backups/`. A supervised VAPE proc
  (`security-awareness-2026-db-backup`) runs this automatically every 15
  minutes — check `get_proc_status`/`get_proc_logs` for that proc.
- **`npm run db:restore`** rebuilds `prisma/data/security_awareness_2026.db`
  from the most recent dump in `db-backups/` (or pass a specific dump path).
  This is the full pod-wipe recovery procedure — no `apt-get install`, no
  service to restart, just one restore command.
- Commit fresh `db-backups/*.sql` dumps to git periodically so they survive
  even if the pod is deleted outright, not just restarted.

## Local development

```bash
cp .env.example .env   # then fill in real secrets
npm install
npx prisma migrate deploy   # apply schema (creates prisma/data/*.db if missing)
npm run db:restore           # OR: restore real data from the latest backup
npm run db:seed               # OR: seed fresh demo employees/challenges/flare
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
