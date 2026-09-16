import { prisma } from "@/lib/prisma";
import { postSystemMessage } from "@/lib/actions/chat";

/**
 * Announces any active, non-Manual-Bonus challenge whose Opens At time has
 * now passed but hasn't posted its "New challenge dropped" Chat Room
 * announcement yet. This is the ONLY place that announcement fires from -
 * deliberately not done synchronously at creation time in admin.ts, since
 * a challenge scheduled to open later is meant to be a surprise (see the
 * matching hide-until-open logic in challenges/page.tsx and
 * challenges/[slug]/page.tsx) - announcing its title/link the moment an
 * admin saves it would leak the surprise hours or days early.
 *
 * Instead, this same check runs every time it's cheap to (chat poll tick,
 * chat page load, challenges list page load) and is idempotent: the
 * updateMany's `dropAnnouncedAt: null` guard means only the first caller
 * to reach a given challenge actually flips it and posts, so concurrent
 * callers can never double-announce the same challenge. Worst case if
 * nobody visits either page right at opens-at, the announcement is simply
 * a little late - same class of trade-off as the rest of the polling-based
 * Chat Room.
 */
export async function announceJustOpenedChallenges(): Promise<void> {
  const now = new Date();
  const candidates = await prisma.challenge.findMany({
    where: {
      isActive: true,
      dropAnnouncedAt: null,
      // Covers both a challenge with no opens-at at all (available the
      // moment it's created/activated) and one whose scheduled opens-at
      // has now passed.
      OR: [{ opensAt: null }, { opensAt: { lte: now } }],
      NOT: { slug: { startsWith: "manual-bonus-" } },
    },
    select: { id: true, slug: true, title: true, xpValue: true, rewardMode: true },
  });

  for (const c of candidates) {
    const { count } = await prisma.challenge.updateMany({
      where: { id: c.id, dropAnnouncedAt: null },
      data: { dropAnnouncedAt: now },
    });
    if (count === 0) continue; // another concurrent caller already claimed this one
    const xpNote = c.rewardMode === "UNLOCK" ? "unlocks a reward" : `+${c.xpValue} XP`;
    await postSystemMessage(`📡 New challenge dropped: [[${c.title}]](/challenges/${c.slug}) (${xpNote})`);
  }
}
