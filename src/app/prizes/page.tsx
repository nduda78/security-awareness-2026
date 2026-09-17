import { prisma } from "@/lib/prisma";
import { PrizeWinnersList, type PrizeWinnerRow } from "@/components/PrizeWinnersList";

export const dynamic = "force-dynamic";

/**
 * Public "who's actually won something" board. Real prizes here come
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
 */
export default async function PrizesPage() {
  const flares = await prisma.badgeFlare.findMany({
    include: {
      employee: { select: { email: true, displayName: true, photoUpdatedAt: true, isHidden: true } },
    },
  });

  const rows: PrizeWinnerRow[] = [];
  let counter = 0;

  for (const f of flares) {
    if (f.employee.isHidden) continue;
    const photoUrl = f.employee.photoUpdatedAt
      ? `/api/photo/${encodeURIComponent(f.employee.email)}?v=${f.employee.photoUpdatedAt.getTime()}`
      : null;
    const wonAt = f.updatedAt.toISOString();

    const prizes: string[] = [];
    let achievements: string[] = [];
    try {
      achievements = JSON.parse(f.achievements || "[]");
    } catch {
      achievements = [];
    }
    prizes.push(...achievements);

    if (f.ribbonText) prizes.push(f.ribbonText);
    if (f.nameSuffix) prizes.push(f.nameSuffix);

    for (const prize of prizes) {
      rows.push({
        submissionId: `${f.employeeId}-${counter++}`,
        employeeEmail: f.employee.email,
        displayName: f.employee.displayName,
        photoUrl,
        challengeTitle: "",
        challengeSlug: "",
        prize,
        wonAt,
      });
    }
  }

  rows.sort((a, b) => b.wonAt.localeCompare(a.wonAt));

  return (
    <div className="fade-in-up mx-auto max-w-3xl">
      <h1 className="mb-2 font-display text-2xl font-semibold">Prizes</h1>
      <p className="mb-6 font-terminal text-sm text-brand-sand/45">
        Agents who&apos;ve won something - real prizes and badge flare alike.
      </p>
      <PrizeWinnersList rows={rows} />
    </div>
  );
}
