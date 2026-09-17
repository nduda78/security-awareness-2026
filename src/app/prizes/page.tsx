import { prisma } from "@/lib/prisma";
import { PrizeWinnersList, type PrizeWinnerRow } from "@/components/PrizeWinnersList";

export const dynamic = "force-dynamic";

/**
 * Public "who won a real prize" board - distinct from XP/badge-flare
 * rewards (see rewards.ts), this is specifically the freeform
 * Challenge.rewardPrize field ("Company hoodie", "Extra PTO day", etc.).
 * A "win" = a CORRECT Submission on a challenge that has a prize set.
 * Manual Bonus challenges (see grantManualXpAction) are synthetic
 * per-employee audit records, not real missions, so they're excluded
 * even though none currently set rewardPrize anyway.
 */
export default async function PrizesPage() {
  const submissions = await prisma.submission.findMany({
    where: {
      status: "CORRECT",
      challenge: { rewardPrize: { not: null } },
    },
    orderBy: { submittedAt: "desc" },
    include: {
      employee: {
        select: { email: true, displayName: true, photoUpdatedAt: true, isHidden: true },
      },
      challenge: {
        select: { title: true, slug: true, rewardPrize: true },
      },
    },
  });

  const rows: PrizeWinnerRow[] = submissions
    .filter((s) => !s.employee.isHidden && !!s.challenge.rewardPrize && !s.challenge.slug.startsWith("manual-bonus-"))
    .map((s) => ({
      submissionId: s.id,
      employeeEmail: s.employee.email,
      displayName: s.employee.displayName,
      photoUrl: s.employee.photoUpdatedAt
        ? `/api/photo/${encodeURIComponent(s.employee.email)}?v=${s.employee.photoUpdatedAt.getTime()}`
        : null,
      challengeTitle: s.challenge.title,
      challengeSlug: s.challenge.slug,
      prize: s.challenge.rewardPrize as string,
      wonAt: s.submittedAt.toISOString(),
    }));

  return (
    <div className="fade-in-up mx-auto max-w-3xl">
      <h1 className="mb-2 font-display text-2xl font-semibold">Prizes</h1>
      <p className="mb-6 font-terminal text-sm text-brand-sand/45">
        Agents who&apos;ve earned a real-world prize by completing a challenge.
      </p>
      <PrizeWinnersList rows={rows} />
    </div>
  );
}
