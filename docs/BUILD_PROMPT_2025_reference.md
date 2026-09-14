# Build Prompt: Dutchie Cybersecurity Awareness Month Leaderboard

Use this prompt to brief an AI coding agent on building this app from scratch.

---

## What we're building

A public leaderboard page for **"2026 Dutchie Cybersecurity Awareness Month."** Throughout the month, employees complete security-awareness challenges (phishing quizzes, briefings, trivia, etc.) via Google Forms. Each completed challenge earns them XP. Their total XP maps to a **security clearance level**, and the leaderboard displays every participant as a badge card, grouped by clearance tier — like a fun, gamified personnel roster rather than a numeric leaderboard/ranking.

This is an internal morale/engagement tool, not a real security system — but it should look and feel like a slick, polished internal "classified access" theme (dark, glitchy, spy-thriller aesthetic) rather than a generic gamification widget.

## Core mechanic: XP → Clearance tiers

Three visible tiers, plus one hidden one:

| Tier | XP range | Notes |
|------|----------|-------|
| UNCLASSIFIED | 0–200 XP | Default starting tier |
| SECRET | 201–400 XP | |
| TOP_SECRET | 401+ XP | |
| **ROGUE** (hidden) | N/A — manual override only | Not reachable via XP. An admin manually flags someone as ROGUE and it overrides whatever their XP would otherwise compute to. |

Each person's badge shows a **"Clearance issued [date]"** line. This must be a *real* computed date, not a random placeholder: it's the exact date their cumulative XP first crossed into their current tier (for UNCLASSIFIED, that's just the date of their very first submission, since everyone starts there). This requires tracking submission timestamps and walking them in chronological order, not just summing total XP.

## The hidden ROGUE tier and its lore

ROGUE is a joke/easter-egg tier for whichever coworker(s) leadership wants to flag as "went rogue" — think "decommissioned agent," "signal gone dark," "not issued by security." It has its own visual language:
- Red color scheme (not the palette's default colors) with a subtle constant flicker animation
- A warning banner: "THIS CLEARANCE TIER WAS NOT ISSUED BY DUTCHIE SECURITY. ORIGIN UNTRACEABLE."
- A glitch/chromatic-aberration text effect on ROGUE names/headers (RGB-channel-split flicker)
- A background watermark reading "PROCESS_420" bleeding through faintly
- A secret keyboard easter egg: typing "process420" anywhere on the page triggers a few seconds of full-page chaos/glitch effect
- ROGUE section members should NOT be visible to casual visitors by default — see "Access-gating ROGUE" below.

## Leaderboard layout

- Grouped by tier as sections, **not** a single ranked list. Order top-to-bottom: ROGUE (if any) → TOP_SECRET → SECRET → UNCLASSIFIED. Empty tiers are omitted entirely (don't show a tier with zero members).
- Each section has a header with tier icon, name, XP range, and member count ("3 agents").
- Within a section, members are sorted by XP descending, name ascending as tiebreak — except pinned members (see badge flare below), who always render first.

## Badge card design

Each person is a flippable card:

**Front face:**
- Circular XP progress ring showing progress toward the next tier (100%/full ring style for ROGUE/max tier)
- Name, and a deterministic "codename" (see below)
- A short deterministic "fun fact" flavor line
- Agent ID (deterministic, format `AGT-####`)
- "Clearance issued [date]" (see above — must be real, not decorative)
- Total XP, and "XX XP to [next tier]" progress note
- Achievement/prize chips if they have any (trophy icon + text)
- Click anywhere to flip to the back face; confetti bursts on flip for TOP_SECRET and ROGUE members

**Back face ("PERSONNEL FILE"):**
- Restates codename/agent ID
- "Ranked #X of Y in [TIER]" note
- Click again to flip back

**Deterministic flavor text**: codename, agent ID, fun fact, and a decorative barcode are all generated deterministically from each person's identity (see "Identity" below) via a simple string hash — same person always gets the same flavor text across rebuilds, but different people should essentially never collide. Codenames are drawn from an adjective+noun pool with a **cannabis/cybersecurity mashup theme** (e.g. "FIREWALLED COOKIES," "SPOOFED PUNCH," "GHOST PROTOCOL"). **Codenames must be guaranteed unique across all current participants** — if the deterministic hash collides for two people, deterministically retry alternate combinations for whoever loses the tie (in a stable order, so results don't reshuffle every rebuild just because someone's XP changed), falling back to a numbered suffix if the whole pool is ever exhausted.

**Identity**: use each person's **email address** (lowercased) as their stable identity key for all deterministic generation and data joins — not a database-generated ID that changes every time data gets reloaded/reseeded.

## Interactive features (client-side, no backend calls needed)

- **Search** ("Find your badge...") — filters/dims cards by name match, Enter key scrolls to and spotlights the first match
- **Filter chips**: All / Rogue / Top Secret / Secret / Unclassified / 🏆 Winners (winners = anyone with at least one achievement/prize)
- **Sort dropdown**: XP descending (default) / XP ascending / Name A-Z / Closest to leveling up
- **XP count-up animation** on page load (numbers animate from 0 to their real value)
- **Hover tilt** effect on cards (subtle 3D perspective tilt following the cursor)
- **Click-to-flip** with confetti burst for TOP_SECRET/ROGUE

## Badge flare: admin-editable customization per person

Beyond the auto-generated stuff, admins can add optional per-person customization ("flare") for individual badges. Every field is independent and optional — think of it as a set of small rewards/customizations an admin can hand out. Suggested fields:

- **Achievement/prize note(s)** — one or more short strings ("Won a MacBook"), rendered as trophy chips. Support multiple per person.
- **Badge outline/accent color** — a custom border/glow color for their card, accepting hex codes, CSS color names, or informal phrases ("Hot Pink," "Bright Blue") resolved to a sensible real color.
- **Badge background color** — a solid fill color behind the card, independent of the outline color and independent of any background effect (below). Layers correctly underneath other effects.
- **Badge background effect** — a small fixed set of animated background treatments: e.g. a holographic rainbow sheen, a CRT-glitch/static scanline effect, a bold brand-colored gradient sweep, a twinkling starfield. Pick a short, extensible list and leave room to add more later.
- **Codename override** — replace the auto-generated codename with exact custom text.
- **Badge motto/tagline** — a short custom line on the card.
- **Badge icon override** — swap their tier icon for a different one from a small fixed set (crown, flame, trophy, lightning, etc).
- **Border style** — a small set of animated border treatments (pulsing glow, sparkle/shimmer, marching ants/dashed), independent of the outline color.
- **Prestige ribbon** — a corner ribbon with freeform text (not a restricted enum — real usage will include inside jokes, not just formal "Gold/Platinum/Diamond" tiers, though a couple of recognized values can get extra-special styling as a bonus).
- **Pin to top** — force this person's badge to render first within their tier section regardless of XP.
- **Name suffix** — freeform text appended directly after their displayed name (e.g. "Nick Duda" + "the Master" → "Nick Duda the Master"). Should NOT affect search/sort, which should still key off the real name.
- **Flare expiration date** — once passed, the entire flare row for that person is treated as if it didn't exist (useful for "this week's champion" rewards that shouldn't need manual cleanup).
- **Manual ROGUE override flag** — flips someone into the hidden ROGUE tier regardless of their XP.

**Critical design rule**: any unrecognized/invalid flare value (bad color name, unknown icon, typo'd effect name, etc.) must be logged as a warning during build and silently ignored — never crash the build, never render broken. Admins should be able to experiment freely without fear of breaking the page.

## Data model & pipeline (no database)

Design this to run entirely off flat files, not a database — assume the hosting environment can lose a database at any time (ephemeral compute), but plain files on disk persist. Concretely:

- One shared folder containing a mix of CSV files, dropped in over time (e.g. exported from Google Forms → Google Sheets → CSV, whatever filename the export tool happens to produce).
- **Files are auto-classified by their header row content, not filename** — a file with an XP/points column is a "challenge results" file; a file with achievement/color/icon/etc. columns is the "badge flare" file. This matters because real exports have unpredictable names.
- Accept several reasonable header-name aliases per field (e.g. "XP", "XP Earned", "Points" all mean the same thing), case-insensitively.
- Multiple challenge-result files can exist; a person's total XP is the **sum across every file** they appear in validly.
- Some challenge files may have no per-row timestamp at all (e.g. a manually-maintained "give someone bonus XP for any reason" sheet) — for those, fall back to using the file's own last-modified time as a stand-in timestamp for every row in it, rather than losing the "clearance issued" date calculation entirely for anyone who received XP from it.
- Robust, forgiving parsing throughout: duplicate rows for the same person in one file → first one wins, rest logged as a warning; invalid/missing email or non-numeric/blank XP → skip that row with a warning; never let bad data crash the build.

## Output: fully static page

The leaderboard should build to a **fully static HTML/CSS/JS snapshot** — no live backend, no client-side fetch calls. Regenerate the snapshot on demand from the current CSV data whenever it changes, and (re)publish it as static files. This keeps the leaderboard durable and independent of any backend/database uptime.

## Visual identity

- Dark, techy, "classified access terminal" aesthetic — dark green/near-black background, monospace/technical accent font for labels, a clean sans-serif for names.
- Use a real brand color palette (this project's: dark green `#042017`, medium green `#003d29`, sand `#f1e8d6`, purple `#5e324e`, light green `#6aba48`, yellow `#ffc02a`) mapped per-tier: e.g. yellow for SECRET, light green for TOP_SECRET, muted sand for UNCLASSIFIED, red for ROGUE.
- Company logo in the header, page title "2026 [COMPANY] CYBERSECURITY AWARENESS MONTH LEADERBOARD" with a tagline underneath.

## Optional stretch feature: gating a sensitive section behind a password (if you want this)

If you want to hide a specific section (like ROGUE) from casual visitors on a static, backend-less page:
- Don't just base64-encode the hidden section's HTML — that's *encoding*, trivially reversible by anyone with zero knowledge of any password (`atob()`, one line). If you want it to actually require the password, **encrypt** the section's HTML (e.g. AES-256-GCM) with a key **derived from the password itself** (e.g. via PBKDF2 with a meaningful iteration count), and derive the identical key client-side to attempt decryption. A wrong password then fails the cipher's own authentication check — there's no need for (and no value in) a separately stored password hash.
- Be upfront that this is a deterrent, not real access control: on a fully static page, everything shippable to the browser is inherently inspectable, and there's no way to rate-limit someone brute-forcing the extracted ciphertext entirely offline. True access control would require a server that checks the password before ever sending the protected content — out of scope if you're intentionally avoiding a backend.
- Nothing about the *locked* state (labels, messages, filter options) should hint at which section or whose data is behind it.
- Don't leak anything through the raw page source before unlocking — the hidden section's real content shouldn't appear anywhere as plain text if it's supposed to be gated. Watch for renderer-wrapper duplication (e.g. don't wrap an already-self-contained gated block in another element carrying the same styling class — creates a visible "frame within a frame").
- Handle character-encoding correctly across any encode/decode step — base64 round-trips and similar bytes-based transforms don't automatically preserve non-ASCII characters (em dashes, special glyphs) unless explicitly decoded as UTF-8 on the way back out.
