import { TIERS, TierKey, TierDef, meetsClearance } from "@/lib/tiers";

export interface ChallengeSection<T> {
  tier: TierDef | null; // null = the "Info" (non-XP / UNLOCK-mode) section
  label: string;
  challenges: T[];
}

/**
 * Groups a viewer-visible slice of challenges into display sections:
 * one section per clearance tier (only tiers the viewer's clearance
 * actually reaches, and only if that tier has at least one eligible
 * challenge tagged for it), in TIERS order (ROGUE, TOP_SECRET, SECRET,
 * UNCLASSIFIED) — then a trailing "Info" section holding every
 * UNLOCK-mode (non-XP) challenge the viewer is eligible for, regardless
 * of which clearance tier it's tagged with.
 *
 * A challenge the viewer's clearance doesn't reach is dropped entirely
 * (not just hidden-but-listed) — matching the classified-briefing framing
 * of the app: you don't even see that something exists below your
 * clearance.
 */
export function groupChallengesForViewer<
  T extends { minClearance: string; rewardMode: string }
>(challenges: T[], viewer: { xp: number; rogueOverride: boolean }): ChallengeSection<T>[] {
  const eligible = challenges.filter((c) => meetsClearance(viewer, c.minClearance as TierKey));

  const xpChallenges = eligible.filter((c) => c.rewardMode !== "UNLOCK");
  const infoChallenges = eligible.filter((c) => c.rewardMode === "UNLOCK");

  const sections: ChallengeSection<T>[] = [];
  for (const tier of [...TIERS].sort((a, b) => a.order - b.order)) {
    const members = xpChallenges.filter((c) => c.minClearance === tier.key);
    if (members.length === 0) continue;
    sections.push({ tier, label: tier.label, challenges: members });
  }

  if (infoChallenges.length > 0) {
    sections.push({ tier: null, label: "INFO", challenges: infoChallenges });
  }

  return sections;
}
