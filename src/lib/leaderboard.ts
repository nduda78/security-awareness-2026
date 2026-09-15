import { prisma } from "./prisma";
import { computeClearanceIssuedDates, computeProgress, effectiveTier, TierKey, TIERS } from "./tiers";
import { computeFlavorProfile, resolveUniqueCodenames, resolveUniqueFunFacts } from "./identity";
import { resolveFlare, logFlareWarnings, ResolvedFlare } from "./flare";

export interface AgentCard {
  email: string;
  displayName: string; // real name, for search/sort — never affected by nameSuffix
  renderedName: string; // displayName + nameSuffix (if any)
  rogueOverride: boolean;
  xp: number;
  tier: (typeof TIERS)[number];
  progress: ReturnType<typeof computeProgress>;
  clearanceIssued: Date | null;
  codename: string;
  agentId: string;
  funFact: string;
  barcode: string;
  challengesCompleted: number;
  flare: ResolvedFlare | null;
  photoUrl: string | null;
}

/**
 * Builds the full roster of agent cards: XP totals, tiers, progress,
 * deterministic flavor text (with unique codenames), clearance-issued
 * dates, and resolved flare — everything the leaderboard/profile pages
 * need, computed fresh from the ledger each request.
 */
export async function buildAgentRoster(): Promise<AgentCard[]> {
  const employees = await prisma.employee.findMany({
    include: {
      flare: true,
      submissions: {
        where: { status: "CORRECT" },
        select: { xpAwarded: true, submittedAt: true, reviewedAt: true },
      },
    },
  });
  const photoUpdatedAtByEmail = new Map(
    (
      await prisma.employee.findMany({
        where: { photoUpdatedAt: { not: null } },
        select: { email: true, photoUpdatedAt: true },
      })
    ).map((e) => [e.email, e.photoUpdatedAt as Date])
  );

  // Stable order for codename collision resolution: sort by email so
  // results don't reshuffle just because someone's XP changed.
  const emailsInStableOrder = employees.map((e) => e.email).sort();
  const overrides = new Map<string, string>();
  for (const e of employees) {
    const flare = resolveFlare(e.flare, new Date());
    if (flare?.codenameOverride) overrides.set(e.email, flare.codenameOverride);
  }
  const codenames = resolveUniqueCodenames(emailsInStableOrder, overrides);
  const funFacts = resolveUniqueFunFacts(emailsInStableOrder);

  const cards: AgentCard[] = employees.map((e) => {
    const flare = resolveFlare(e.flare, new Date());
    if (flare) logFlareWarnings(e.email, flare.warnings);

    const xp = e.submissions.reduce((sum, s) => sum + s.xpAwarded, 0);
    const tier = effectiveTier(e.rogueOverride, xp);
    const progress = computeProgress(e.rogueOverride, xp);

    const issuedDates = computeClearanceIssuedDates(
      e.submissions.map((s) => ({
        xpAwarded: s.xpAwarded,
        effectiveAt: s.reviewedAt ?? s.submittedAt,
      }))
    );
    const clearanceIssued: Date | null = e.rogueOverride
      ? null // ROGUE isn't XP-issued; "origin untraceable" per the lore
      : issuedDates[tier.key as TierKey] ?? issuedDates.UNCLASSIFIED ?? null;

    const flavor = computeFlavorProfile(e.email);
    const codename = codenames.get(e.email) ?? flavor.agentId;

    const displayName = e.displayName;
    const renderedName = flare?.nameSuffix ? `${displayName} ${flare.nameSuffix}` : displayName;

    return {
      email: e.email,
      displayName,
      renderedName,
      rogueOverride: e.rogueOverride,
      xp,
      tier,
      progress,
      clearanceIssued,
      codename,
      agentId: flavor.agentId,
      funFact: funFacts.get(e.email) ?? "",
      barcode: flavor.barcode,
      challengesCompleted: e.submissions.length,
      flare,
      photoUrl: photoUpdatedAtByEmail.has(e.email)
        ? `/api/photo/${encodeURIComponent(e.email)}?v=${photoUpdatedAtByEmail.get(e.email)!.getTime()}`
        : null,
    };
  });

  return cards;
}

export interface TierSection {
  tier: (typeof TIERS)[number];
  members: AgentCard[];
}

/** Groups + sorts the roster per BUILD_PROMPT.md rules: ROGUE -> TOP_SECRET -> SECRET -> UNCLASSIFIED, pinned first, then XP desc, name asc. Empty tiers omitted. */
export function groupByTier(cards: AgentCard[]): TierSection[] {
  const byKey = new Map<string, AgentCard[]>();
  for (const c of cards) {
    const arr = byKey.get(c.tier.key) ?? [];
    arr.push(c);
    byKey.set(c.tier.key, arr);
  }

  const sections: TierSection[] = [];
  for (const tier of [...TIERS].sort((a, b) => a.order - b.order)) {
    const members = byKey.get(tier.key);
    if (!members || members.length === 0) continue;
    members.sort((a, b) => {
      const aPinned = a.flare?.pinned ?? false;
      const bPinned = b.flare?.pinned ?? false;
      if (aPinned !== bPinned) return aPinned ? -1 : 1;
      if (b.xp !== a.xp) return b.xp - a.xp;
      return a.displayName.localeCompare(b.displayName);
    });
    sections.push({ tier, members });
  }
  return sections;
}

/** Overall rank (1-based) by XP desc, name asc — used on profile pages. */
export function overallRank(cards: AgentCard[], email: string): { rank: number; total: number } {
  const sorted = [...cards].sort((a, b) => {
    if (b.xp !== a.xp) return b.xp - a.xp;
    return a.displayName.localeCompare(b.displayName);
  });
  const idx = sorted.findIndex((c) => c.email === email);
  return { rank: idx === -1 ? sorted.length : idx + 1, total: sorted.length };
}

/** Rank within the person's own tier — used for badge card back face. */
export function rankWithinTier(cards: AgentCard[], card: AgentCard): { rank: number; total: number } {
  const tierMembers = cards.filter((c) => c.tier.key === card.tier.key);
  tierMembers.sort((a, b) => {
    const aPinned = a.flare?.pinned ?? false;
    const bPinned = b.flare?.pinned ?? false;
    if (aPinned !== bPinned) return aPinned ? -1 : 1;
    if (b.xp !== a.xp) return b.xp - a.xp;
    return a.displayName.localeCompare(b.displayName);
  });
  const idx = tierMembers.findIndex((c) => c.email === card.email);
  return { rank: idx === -1 ? tierMembers.length : idx + 1, total: tierMembers.length };
}
