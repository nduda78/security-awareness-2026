// Security clearance tier model — source of truth: BUILD_PROMPT.md
// (reused verbatim for 2026 per the Security team's direction).

export type TierKey = "ROGUE" | "TOP_SECRET" | "SECRET" | "UNCLASSIFIED";

export interface TierDef {
  key: TierKey;
  label: string;
  shortLabel: string;
  minXp: number;
  maxXp: number | null; // null = no ceiling
  color: string; // brand hex
  icon: string; // default icon key
  order: number; // display order, lower = higher up (ROGUE first)
}

// Brand palette (BUILD_PROMPT.md):
export const BRAND = {
  darkGreen: "#042017",
  mediumGreen: "#003d29",
  sand: "#f1e8d6",
  purple: "#5e324e",
  lightGreen: "#6aba48",
  yellow: "#ffc02a",
  red: "#e5484d",
};

export const TIERS: TierDef[] = [
  {
    key: "ROGUE",
    label: "ROGUE",
    shortLabel: "Rogue",
    minXp: 0,
    maxXp: null,
    color: BRAND.red,
    icon: "skull",
    order: 0,
  },
  {
    key: "TOP_SECRET",
    label: "TOP SECRET",
    shortLabel: "Top Secret",
    minXp: 401,
    maxXp: null,
    color: BRAND.lightGreen,
    icon: "shield",
    order: 1,
  },
  {
    key: "SECRET",
    label: "SECRET",
    shortLabel: "Secret",
    minXp: 201,
    maxXp: 400,
    color: BRAND.yellow,
    icon: "lock",
    order: 2,
  },
  {
    key: "UNCLASSIFIED",
    label: "UNCLASSIFIED",
    shortLabel: "Unclassified",
    minXp: 0,
    maxXp: 200,
    color: BRAND.sand,
    icon: "file",
    order: 3,
  },
];

export const TIER_BY_KEY: Record<TierKey, TierDef> = Object.fromEntries(
  TIERS.map((t) => [t.key, t])
) as Record<TierKey, TierDef>;

/** Non-ROGUE tiers ordered from lowest to highest XP, for tier-crossing walks. */
export const XP_TIERS_ASC: TierDef[] = [
  TIER_BY_KEY.UNCLASSIFIED,
  TIER_BY_KEY.SECRET,
  TIER_BY_KEY.TOP_SECRET,
];

/** Computes which XP-reachable tier a given total XP falls into (never ROGUE). */
export function tierForXp(xp: number): TierDef {
  if (xp >= TIER_BY_KEY.TOP_SECRET.minXp) return TIER_BY_KEY.TOP_SECRET;
  if (xp >= TIER_BY_KEY.SECRET.minXp) return TIER_BY_KEY.SECRET;
  return TIER_BY_KEY.UNCLASSIFIED;
}

/** Given a rogueOverride flag + total XP, returns the effective tier. */
export function effectiveTier(rogueOverride: boolean, xp: number): TierDef {
  if (rogueOverride) return TIER_BY_KEY.ROGUE;
  return tierForXp(xp);
}

/** Next XP-reachable tier above the given tier, or null if already at the top (or ROGUE). */
export function nextTier(tier: TierDef): TierDef | null {
  if (tier.key === "ROGUE") return null;
  if (tier.key === "UNCLASSIFIED") return TIER_BY_KEY.SECRET;
  if (tier.key === "SECRET") return TIER_BY_KEY.TOP_SECRET;
  return null; // TOP_SECRET is the ceiling
}

export interface ProgressInfo {
  tier: TierDef;
  xp: number;
  next: TierDef | null;
  xpIntoTier: number;
  xpSpanOfTier: number | null; // null when tier has no ceiling (TOP_SECRET/ROGUE)
  progressPct: number; // 0-100, 100 for max/ROGUE
  xpToNext: number | null;
}

export function computeProgress(rogueOverride: boolean, xp: number): ProgressInfo {
  const tier = effectiveTier(rogueOverride, xp);

  if (tier.key === "ROGUE") {
    return {
      tier,
      xp,
      next: null,
      xpIntoTier: xp,
      xpSpanOfTier: null,
      progressPct: 100,
      xpToNext: null,
    };
  }

  const next = nextTier(tier);
  if (!next) {
    // TOP_SECRET, no ceiling
    return {
      tier,
      xp,
      next: null,
      xpIntoTier: xp - tier.minXp,
      xpSpanOfTier: null,
      progressPct: 100,
      xpToNext: null,
    };
  }

  const span = next.minXp - tier.minXp;
  const into = xp - tier.minXp;
  const pct = Math.max(0, Math.min(100, Math.round((into / span) * 100)));

  return {
    tier,
    xp,
    next,
    xpIntoTier: into,
    xpSpanOfTier: span,
    progressPct: pct,
    xpToNext: Math.max(0, next.minXp - xp),
  };
}

/**
 * Walks a person's CORRECT submissions in chronological order (by the
 * timestamp that should count as "when the XP landed" — reviewedAt for
 * reviewed items, submittedAt otherwise) and records the first moment their
 * running XP total crossed into each XP-reachable tier. UNCLASSIFIED's date
 * is just the timestamp of their very first counted submission, since
 * everyone starts there.
 *
 * Returns a map of tier key -> Date, only for tiers actually reached by XP
 * (ROGUE is never included here — its "issued" story is different, handled
 * by the caller when rogueOverride is set).
 */
export function computeClearanceIssuedDates(
  submissions: { xpAwarded: number; effectiveAt: Date }[]
): Partial<Record<TierKey, Date>> {
  const sorted = [...submissions]
    .filter((s) => s.xpAwarded > 0)
    .sort((a, b) => a.effectiveAt.getTime() - b.effectiveAt.getTime());

  const issued: Partial<Record<TierKey, Date>> = {};
  let running = 0;
  let lastTierKey: TierKey | null = null;

  for (const s of sorted) {
    if (lastTierKey === null) {
      // First-ever counted submission: UNCLASSIFIED issuance moment.
      issued.UNCLASSIFIED = s.effectiveAt;
      lastTierKey = "UNCLASSIFIED";
    }

    running += s.xpAwarded;
    const currentTier = tierForXp(running);

    if (currentTier.key !== lastTierKey && !issued[currentTier.key]) {
      issued[currentTier.key] = s.effectiveAt;
    }
    lastTierKey = currentTier.key;
  }

  return issued;
}
