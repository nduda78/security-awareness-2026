import { prisma } from "@/lib/prisma";
import { PrizeWinnersList, type PrizeWinnerGroup, type PrizeWinnerEntry } from "@/components/PrizeWinnersList";

export const dynamic = "force-dynamic";

/**
 * Registry of who's won what — grouped by person. Real prizes here come
 * from what's actually been issued to an agent's badge - not the unused
 * Challenge.rewardPrize field (nothing grants that in practice) - so this
 * reads each employee's BadgeFlare row and surfaces:
 *  - every freeform Achievements entry (the same list shown on their
 *    profile badge, e.g. "Won a MacBook") as its own prize, and
 *  - the two freeform, reward-flavored badge flare fields - ribbon
 *    text and name suffix (e.g. "Legendary", "the O.G.") - as their
 *    own "badge flare" prize. Purely cosmetic/technical flare (border
 *    style, background effect, badge icon, unlocked color pickers)
 *    is deliberately excluded - those are customization capabilities,
 *    not something that reads as a named prize.
 * BadgeFlare has no per-entry timestamp, so `updatedAt` on the row
 * (last time any of it was edited) is used as the "won" date for
 * everything from that employee - an approximation, not a precise
 * per-prize grant time.
 *
 * "Why" attribution: there's no persisted link recording which specific
 * challenge caused a given flare grant (they're issued by hand in
 * /admin/flare) — so ribbon/suffix prizes are attributed by matching the
 * granted value against that same employee's own completed challenges'
 * advertised reward fields (same idea as getUnlockedFlareOptions in
 * rewards.ts). If a completed challenge advertises the exact ribbon/
 * suffix text they now have, that's almost certainly why they have it.
 * Freeform Achievements entries have no matching field to correlate
 * against at all, so those are always unattributed ("Manually awarded").
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
    let achievements: string[] = [];
    try {
      achievements = JSON.parse(f.achievements || "[]");
    } catch {
      achievements = [];
    }
    const wonAt = f.updatedAt.toISOString();

    for (const prize of achievements) {
      entries.push({ prize, wonAt, source: "achievement", sourceChallengeTitle: null, sourceChallengeSlug: null });
    }

    if (f.ribbonText || f.nameSuffix) {
      const correct = await prisma.submission.findMany({
        where: { employeeId: f.employeeId, status: "CORRECT" },
        include: { challenge: { select: { title: true, slug: true, rewardRibbonText: true, rewardNameSuffix: true } } },
      });

      if (f.ribbonText) {
        const source = correct.find((s) => s.challenge.rewardRibbonText === f.ribbonText);
        entries.push({
          prize: f.ribbonText,
          wonAt,
          source: "flare",
          sourceChallengeTitle: source?.challenge.title ?? null,
          sourceChallengeSlug: source?.challenge.slug ?? null,
        });
      }
      if (f.nameSuffix) {
        const source = correct.find((s) => s.challenge.rewardNameSuffix === f.nameSuffix);
        entries.push({
          prize: f.nameSuffix,
          wonAt,
          source: "flare",
          sourceChallengeTitle: source?.challenge.title ?? null,
          sourceChallengeSlug: source?.challenge.slug ?? null,
        });
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
