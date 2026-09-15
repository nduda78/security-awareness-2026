import { buildAgentRoster, groupByTier, rankWithinTier } from "@/lib/leaderboard";
import { toClientCard } from "@/lib/client-types";
import { LeaderboardClient, type ClientTierSection } from "@/components/LeaderboardClient";

export const dynamic = "force-dynamic";

export default async function LeaderboardPage() {
  const roster = await buildAgentRoster();
  const sections = groupByTier(roster);

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
    <div className="fade-in-up">
      <div className="mb-8">
        <div className="section-eyebrow mb-2">Personnel Roster</div>
        <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
          <span className="gradient-text">Clearance</span> Leaderboard
        </h1>
        <p className="mt-3 max-w-2xl text-sm text-brand-sand/60">
          Every completed challenge earns XP. XP unlocks clearance tiers. Climb from{" "}
          <span className="text-brand-sand">UNCLASSIFIED</span> to{" "}
          <span className="text-brand-yellow">SECRET</span> to{" "}
          <span className="text-brand-light-green">TOP SECRET</span> — if you dare.
        </p>
      </div>
      <LeaderboardClient sections={clientSections} />
    </div>
  );
}
