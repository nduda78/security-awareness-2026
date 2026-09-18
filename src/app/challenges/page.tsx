import { prisma } from "@/lib/prisma";
import { getAgentIdentity } from "@/lib/session";
import { getViewerClearanceInfo } from "@/lib/leaderboard";
import { groupChallengesForViewer } from "@/lib/challengeSections";
import { ChallengesBoard } from "@/components/ChallengesBoard";
import type { ClientChallengeSection } from "@/lib/client-types";
import { announceJustOpenedChallenges } from "@/lib/challengeDrops";

export const dynamic = "force-dynamic";

export default async function ChallengesPage() {
  const identity = await getAgentIdentity();
  const now = new Date();
  await announceJustOpenedChallenges();

  const allChallenges = await prisma.challenge.findMany({
    // Scheduled-for-the-future challenges are a deliberate surprise - kept
    // entirely off the public list until their opens-at time (see the
    // matching notFound() on the detail page for direct-URL access too).
    // A challenge that's already open and later closes stays listed, just
    // marked "Not currently open" - it was never meant to be secret.
    where: { isActive: true, hiddenFromList: false, OR: [{ opensAt: null }, { opensAt: { lte: now } }] },
    orderBy: { createdAt: "asc" },
    include: {
      submissions: identity ? { where: { employee: { email: identity.email } } } : false,
    },
  });

  const viewer = identity ? await getViewerClearanceInfo(identity.email) : null;
  const grouped = viewer ? groupChallengesForViewer(allChallenges, viewer) : [];

  const sections: ClientChallengeSection[] = grouped.map((section) => ({
    key: section.tier?.key ?? "INFO",
    label: section.tier?.shortLabel ?? "Info",
    color: section.tier?.color ?? "var(--brand-cyan)",
    icon: section.tier?.icon ?? "file",
    challenges: section.challenges.map((c) => {
      const isOpen = (!c.opensAt || c.opensAt <= now) && (!c.closesAt || c.closesAt >= now);
      const mine = "submissions" in c ? (c.submissions as { status: string; xpAwarded: number; attempts: number }[]) : [];
      const status = mine.length > 0 ? mine[0] : null;
      const isFreeText = c.answerType === "FREE_TEXT_REVIEW";
      const attemptsUsed = status?.attempts ?? 0;
      const attemptsRemaining = c.maxAttempts === null ? null : Math.max(0, c.maxAttempts - attemptsUsed);
      const outOfAttempts =
        !isFreeText && status?.status === "INCORRECT" && c.maxAttempts !== null && attemptsUsed >= c.maxAttempts;
      return {
        id: c.id,
        slug: c.slug,
        title: c.title,
        description: c.description,
        rewardMode: c.rewardMode,
        answerType: c.answerType,
        xpValue: c.xpValue,
        isOpen,
        status: (status?.status as "CORRECT" | "PENDING_REVIEW" | "INCORRECT" | undefined) ?? null,
        xpAwarded: status?.xpAwarded ?? 0,
        completed: status?.status === "CORRECT",
        attemptsRemaining: isFreeText ? null : attemptsRemaining,
        outOfAttempts: !!outOfAttempts,
        reward: {
          rewardBackgroundEffect: c.rewardBackgroundEffect,
          rewardBorderStyle: c.rewardBorderStyle,
          rewardIcon: c.rewardIcon,
          rewardRibbonText: c.rewardRibbonText,
          rewardNameSuffix: c.rewardNameSuffix,
          rewardOutlineColorPicker: c.rewardOutlineColorPicker,
          rewardBackgroundColorPicker: c.rewardBackgroundColorPicker,
          rewardPrize: c.rewardPrize,
        },
        unlockTeaser: {
          hasAudio: !!c.unlockAudio,
          unlockText: c.unlockText,
          unlockLinkUrl: c.unlockLinkUrl,
          hasImage: !!c.unlockImage,
          hasVideo: !!c.unlockVideo,
        },
      };
    }),
  }));

  return (
    <div className="fade-in-up">
      <ChallengesBoard sections={sections} />
    </div>
  );
}
