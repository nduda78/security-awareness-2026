import { prisma } from "@/lib/prisma";
import { getAgentIdentity } from "@/lib/session";
import { getViewerClearanceInfo } from "@/lib/leaderboard";
import { groupChallengesForViewer } from "@/lib/challengeSections";
import { ChallengesBoard } from "@/components/ChallengesBoard";
import type { ClientChallengeSection } from "@/lib/client-types";

export const dynamic = "force-dynamic";

export default async function ChallengesPage() {
  const identity = await getAgentIdentity();
  const now = new Date();

  const allChallenges = await prisma.challenge.findMany({
    where: { isActive: true },
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
      const mine = "submissions" in c ? (c.submissions as { status: string; xpAwarded: number }[]) : [];
      const status = mine.length > 0 ? mine[0] : null;
      return {
        id: c.id,
        slug: c.slug,
        title: c.title,
        description: c.description,
        rewardMode: c.rewardMode,
        xpValue: c.xpValue,
        isOpen,
        status: (status?.status as "CORRECT" | "PENDING_REVIEW" | "INCORRECT" | undefined) ?? null,
        xpAwarded: status?.xpAwarded ?? 0,
        completed: status?.status === "CORRECT",
        reward: {
          rewardBackgroundEffect: c.rewardBackgroundEffect,
          rewardBorderStyle: c.rewardBorderStyle,
          rewardIcon: c.rewardIcon,
          rewardRibbonText: c.rewardRibbonText,
          rewardNameSuffix: c.rewardNameSuffix,
          rewardOutlineColor: c.rewardOutlineColor,
          rewardBackgroundColor: c.rewardBackgroundColor,
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
