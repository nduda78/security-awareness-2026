import type { AgentCard } from "./leaderboard";

// Plain-data shape safe to pass from server -> client components (dates
// pre-formatted to strings).
export interface ClientAgentCard {
  email: string;
  displayName: string;
  renderedName: string;
  rogueOverride: boolean;
  xp: number;
  tierKey: string;
  tierLabel: string;
  tierColor: string;
  tierIcon: string;
  progressPct: number;
  xpToNext: number | null;
  nextTierLabel: string | null;
  clearanceIssuedLabel: string | null;
  codename: string;
  agentId: string;
  funFact: string;
  barcode: string;
  challengesCompleted: number;
  achievements: string[];
  outlineColor: string | null;
  backgroundColor: string | null;
  backgroundEffect: string | null;
  motto: string | null;
  iconOverride: string | null;
  borderStyle: string | null;
  ribbonText: string | null;
  ribbonRecognized: boolean;
  rankInTier: number;
  totalInTier: number;
  photoUrl: string | null;
}

function formatDate(d: Date | null): string | null {
  if (!d) return null;
  return d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

export function toClientCard(card: AgentCard, rankInTier: number, totalInTier: number): ClientAgentCard {
  return {
    email: card.email,
    displayName: card.displayName,
    renderedName: card.renderedName,
    rogueOverride: card.rogueOverride,
    xp: card.xp,
    tierKey: card.tier.key,
    tierLabel: card.tier.label,
    tierColor: card.tier.color,
    tierIcon: card.tier.icon,
    progressPct: card.progress.progressPct,
    xpToNext: card.progress.xpToNext,
    nextTierLabel: card.progress.next?.label ?? null,
    clearanceIssuedLabel: formatDate(card.clearanceIssued),
    codename: card.codename,
    agentId: card.agentId,
    funFact: card.funFact,
    barcode: card.barcode,
    challengesCompleted: card.challengesCompleted,
    achievements: card.flare?.achievements ?? [],
    outlineColor: card.flare?.outlineColor ?? null,
    backgroundColor: card.flare?.backgroundColor ?? null,
    backgroundEffect: card.flare?.backgroundEffect ?? null,
    motto: card.flare?.motto ?? null,
    iconOverride: card.flare?.iconOverride ?? null,
    borderStyle: card.flare?.borderStyle ?? null,
    ribbonText: card.flare?.ribbonText ?? null,
    ribbonRecognized: card.flare?.ribbonRecognized ?? false,
    rankInTier,
    totalInTier,
    photoUrl: card.photoUrl,
  };
}
