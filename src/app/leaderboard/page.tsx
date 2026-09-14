import { buildAgentRoster, groupByTier, rankWithinTier } from "@/lib/leaderboard";
import { toClientCard } from "@/lib/client-types";
import { isRogueUnlocked } from "@/lib/session";
import { LeaderboardClient, type ClientTierSection } from "@/components/LeaderboardClient";

export const dynamic = "force-dynamic";

export default async function LeaderboardPage({
  searchParams,
}: {
  searchParams: Promise<{ rogueError?: string }>;
}) {
  const { rogueError } = await searchParams;
  const roster = await buildAgentRoster();
  const rogueUnlocked = await isRogueUnlocked();

  const visibleRoster = rogueUnlocked ? roster : roster.filter((c) => c.tier.key !== "ROGUE");
  const sections = groupByTier(visibleRoster);

  const clientSections: ClientTierSection[] = sections.map((s) => ({
    tierKey: s.tier.key,
    tierLabel: s.tier.label,
    tierColor: s.tier.color,
    tierIcon: s.tier.icon,
    minXp: s.tier.minXp,
    maxXp: s.tier.maxXp,
    members: s.members.map((m) => {
      const { rank, total } = rankWithinTier(roster, m);
      return toClientCard(m, rank, total);
    }),
  }));

  return (
    <div>
      <p className="mb-6 max-w-3xl text-sm text-brand-sand/70">
        Every completed challenge earns XP. XP unlocks clearance tiers. Climb from{" "}
        <span className="text-brand-sand">UNCLASSIFIED</span> to{" "}
        <span className="text-brand-yellow">SECRET</span> to{" "}
        <span className="text-brand-light-green">TOP SECRET</span> — if you dare.
      </p>
      <LeaderboardClient sections={clientSections} rogueUnlocked={rogueUnlocked} rogueError={!!rogueError} />
    </div>
  );
}
