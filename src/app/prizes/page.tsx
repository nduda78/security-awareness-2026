import { prisma } from "@/lib/prisma";
import { PrizeWinnersList, type PrizeWinnerGroup, type PrizeWinnerEntry } from "@/components/PrizeWinnersList";
import { parseAchievements } from "@/lib/flare";

export const dynamic = "force-dynamic";

function titleCase(s: string): string {
  return s
    .split(/[\s-]+/)
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
    .join(" ");
}

/**
 * Registry of who's won what — grouped by person. Real prizes here come
 * from what's actually been issued to an agent's badge - not the unused
 * Challenge.rewardPrize field (nothing grants that in practice) - so this
 * reads each employee's BadgeFlare row and surfaces every field an admin
 * can actually grant on it:
 *  - every freeform Achievements entry (the same list shown on their
 *    profile badge, e.g. "Won a MacBook")
 *  - ribbon text / name suffix (freeform, e.g. "Legendary", "the O.G.")
 *  - border style / background effect / icon override (picked from the
 *    fixed catalogs in flare.ts, e.g. "Rainbow", "Fireflies", "Crown")
 *  - the holographic cursor sheen toggle, and the outline/background
 *    color-picker capability unlocks
 * All of the above genuinely got issued to someone by an admin (or, for
 * the two color pickers, unlocked as a capability) - there's no flare
 * field left out anymore; if an admin grants it, it shows up here.
 * BadgeFlare has no per-entry timestamp, so `updatedAt` on the row
 * (last time any of it was edited) is used as the "won" date for
 * everything from that employee - an approximation, not a precise
 * per-prize grant time.
 *
 * "Why" attribution: there's no persisted link recording which specific
 * challenge caused a given flare grant (they're issued by hand in
 * /admin/flare) — so most fields are attributed by matching the granted
 * value against that same employee's own completed challenges'
 * advertised reward fields (same idea as getUnlockedFlareOptions in
 * rewards.ts). The two color pickers are a capability flag rather than a
 * specific value, so they're attributed to any completed challenge that
 * advertises unlocking that capability. Freeform Achievements entries
 * have no matching field to correlate against at all, so those are
 * always unattributed ("manually awarded").
 */
export default async function PrizesPage() {
  const flares = await prisma.badgeFlare.findMany({
    where: { employee: { isHidden: false } },
    include: {
      employee: { select: { id: true, email: true, displayName: true, photoUpdatedAt: true } },
    },
  });

  const groups: PrizeWinnerGroup[] = [];

  for (const f of flares) {
    const entries: PrizeWinnerEntry[] = [];
    const achievements = parseAchievements(f.achievements);
    const wonAt = f.updatedAt.toISOString();

    for (const a of achievements) {
      entries.push({
        prize: a.text,
        icon: a.icon,
        wonAt,
        source: "achievement",
        sourceChallengeTitle: null,
        sourceChallengeSlug: null,
      });
    }

    const hasAnyFlareGrant =
      f.ribbonText ||
      f.nameSuffix ||
      f.borderStyle ||
      f.backgroundEffect ||
      f.iconOverride ||
      f.holoSheen ||
      f.outlineColor ||
      f.backgroundColor;

    if (hasAnyFlareGrant) {
      const correct = await prisma.submission.findMany({
        where: { employeeId: f.employeeId, status: "CORRECT" },
        include: {
          challenge: {
            select: {
              title: true,
              slug: true,
              rewardRibbonText: true,
              rewardNameSuffix: true,
              rewardBorderStyle: true,
              rewardBackgroundEffect: true,
              rewardIcon: true,
              rewardOutlineColorPicker: true,
              rewardBackgroundColorPicker: true,
            },
          },
        },
      });

      function pushFlareEntry(
        prize: string,
        flareField: string,
        matcher: (rewards: (typeof correct)[number]["challenge"]) => boolean
      ) {
        const source = correct.find((s) => matcher(s.challenge));
        entries.push({
          prize,
          wonAt,
          source: "flare",
          flareField,
          sourceChallengeTitle: source?.challenge.title ?? null,
          sourceChallengeSlug: source?.challenge.slug ?? null,
        });
      }

      if (f.ribbonText) {
        pushFlareEntry(f.ribbonText, "Ribbon Text", (r) => r.rewardRibbonText === f.ribbonText);
      }
      if (f.nameSuffix) {
        pushFlareEntry(f.nameSuffix, "Name Suffix", (r) => r.rewardNameSuffix === f.nameSuffix);
      }
      if (f.borderStyle) {
        pushFlareEntry(titleCase(f.borderStyle), "Border Style", (r) => r.rewardBorderStyle === f.borderStyle);
      }
      if (f.backgroundEffect) {
        pushFlareEntry(titleCase(f.backgroundEffect), "Background Effect", (r) => r.rewardBackgroundEffect === f.backgroundEffect);
      }
      if (f.iconOverride) {
        pushFlareEntry(titleCase(f.iconOverride), "Badge Icon", (r) => r.rewardIcon === f.iconOverride);
      }
      if (f.holoSheen) {
        pushFlareEntry("Holographic Cursor Sheen", "Holo Sheen", () => false);
      }
      if (f.outlineColor) {
        pushFlareEntry("Custom Outline Color", "Outline Color", (r) => r.rewardOutlineColorPicker);
      }
      if (f.backgroundColor) {
        pushFlareEntry("Custom Background Color", "Background Color", (r) => r.rewardBackgroundColorPicker);
      }
    }

    if (entries.length === 0) continue;

    entries.sort((a, b) => b.wonAt.localeCompare(a.wonAt));

    groups.push({
      employeeEmail: f.employee.email,
      displayName: f.employee.displayName,
      photoUrl: f.employee.photoUpdatedAt
        ? `/api/photo/${encodeURIComponent(f.employee.email)}?v=${f.employee.photoUpdatedAt.getTime()}`
        : null,
      entries,
      latestWonAt: entries[0].wonAt,
    });
  }

  groups.sort((a, b) => b.latestWonAt.localeCompare(a.latestWonAt));

  return (
    <div className="fade-in-up mx-auto max-w-3xl">
      <h1 className="mb-2 font-display text-2xl font-semibold">Prizes</h1>
      <p className="mb-6 font-terminal text-sm text-brand-sand/45">
        Registry of agents who&apos;ve won something - real prizes and badge flare alike.
      </p>
      <PrizeWinnersList groups={groups} />
    </div>
  );
}
