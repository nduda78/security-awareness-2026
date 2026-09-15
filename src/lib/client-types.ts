import type { AgentCard } from "./leaderboard";
import { resolveFlare, type RawFlareInput } from "./flare";

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

// --- Challenges page (ChallengesBoard) ---

export interface ClientChallengeCard {
  id: string;
  slug: string;
  title: string;
  description: string;
  rewardMode: string; // "XP" | "UNLOCK"
  xpValue: number;
  isOpen: boolean;
  status: "CORRECT" | "PENDING_REVIEW" | "INCORRECT" | null;
  xpAwarded: number;
  completed: boolean; // status === "CORRECT"
  reward: {
    rewardBackgroundEffect: string | null;
    rewardBorderStyle: string | null;
    rewardIcon: string | null;
    rewardRibbonText: string | null;
    rewardNameSuffix: string | null;
    rewardOutlineColor: string | null;
    rewardBackgroundColor: string | null;
    rewardPrize: string | null;
  };
  unlockTeaser: {
    hasAudio: boolean;
    unlockText: string | null;
    unlockLinkUrl: string | null;
    hasImage: boolean;
    hasVideo: boolean;
  };
}

export interface ClientChallengeSection {
  key: string; // tier key, or "INFO" for the non-XP section
  label: string;
  color: string;
  icon: string;
  challenges: ClientChallengeCard[];
}

function formatDate(d: Date | null): string | null {
  if (!d) return null;
  return d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

/**
 * Live-previews what a card would look like with a given (not-yet-saved)
 * set of flare inputs applied — same validation/warn-and-ignore rules as
 * the real save path (via resolveFlare), so the admin preview never shows
 * something that couldn't actually be saved. `defaultCodename` is the
 * auto-generated codename this employee would have with no override, used
 * when the override field is empty (or the whole flare has expired).
 */
export function applyFlareToCard(
  base: ClientAgentCard,
  defaultCodename: string,
  raw: RawFlareInput
): ClientAgentCard {
  const resolved = resolveFlare(raw);
  if (!resolved) {
    return {
      ...base,
      achievements: [],
      outlineColor: null,
      backgroundColor: null,
      backgroundEffect: null,
      motto: null,
      iconOverride: null,
      borderStyle: null,
      ribbonText: null,
      ribbonRecognized: false,
      codename: defaultCodename,
      renderedName: base.displayName,
    };
  }
  return {
    ...base,
    achievements: resolved.achievements,
    outlineColor: resolved.outlineColor,
    backgroundColor: resolved.backgroundColor,
    backgroundEffect: resolved.backgroundEffect,
    motto: resolved.motto,
    iconOverride: resolved.iconOverride,
    borderStyle: resolved.borderStyle,
    ribbonText: resolved.ribbonText,
    ribbonRecognized: resolved.ribbonRecognized,
    codename: resolved.codenameOverride || defaultCodename,
    renderedName: resolved.nameSuffix ? `${base.displayName} ${resolved.nameSuffix}` : base.displayName,
  };
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
