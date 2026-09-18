import { buildAgentRoster, groupByTier, rankWithinTier } from "@/lib/leaderboard";
import { toClientCard } from "@/lib/client-types";
import { LeaderboardClient, type ClientTierSection } from "@/components/LeaderboardClient";
import { isCompromisedModeEnabled } from "@/lib/settings";

export const dynamic = "force-dynamic";

export default async function LeaderboardPage() {
  const fullRoster = await buildAgentRoster();
  // Hidden agents (see Employee.isHidden) are completely excluded here -
  // not just visually skipped - so a prop/placeholder badge with
  // fabricated XP can never skew anyone else's real rank numbers. They're
  // still fully manageable in /admin and still reachable by direct
  // profile URL; this only affects the public Leaderboard.
  const roster = fullRoster.filter((c) => !c.isHidden);
  const sections = groupByTier(roster);
  const compromised = await isCompromisedModeEnabled();

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
        <div className="section-eyebrow mb-2">{compromised ? "COMPROMISED ASSET REGISTRY" : "Personnel Roster"}</div>
        <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
          {compromised ? (
            <>
              <span className="gradient-text">Br34ch</span> L34derboard
            </>
          ) : (
            <>
              <span className="gradient-text">Clearance</span> Leaderboard
            </>
          )}
        </h1>
        <p className="mt-3 max-w-2xl text-sm text-brand-sand/60">
          {compromised ? (
            <>
              Telemetry corrupted. XP values may be fabricated by the intruder. Clearance still climbs from{" "}
              <span className="text-brand-sand">UNCLASSIFIED</span> to{" "}
              <span className="text-brand-yellow">SECRET</span> to{" "}
              <span className="text-brand-light-green">TOP SECRET</span> — assuming the numbers can be trusted
              anymore.
            </>
          ) : (
            <>
              Every completed challenge earns XP. XP unlocks clearance tiers. Climb from{" "}
              <span className="text-brand-sand">UNCLASSIFIED</span> to{" "}
              <span className="text-brand-yellow">SECRET</span> to{" "}
              <span className="text-brand-light-green">TOP SECRET</span> — if you dare.
            </>
          )}
        </p>
      </div>
      <LeaderboardClient sections={clientSections} compromised={compromised} />
    </div>
  );
}
