import { prisma } from "./prisma";
import { BACKGROUND_EFFECTS, BORDER_STYLES, ICONS } from "./flare";

export interface UnlockedFlareOptions {
  backgroundEffect: string[];
  borderStyle: string[];
  icon: string[];
  ribbonText: string[];
  nameSuffix: string[];
  // Not value pools like the fields above — these are capability flags.
  // Once true, the employee may set *any* resolvable color of their own
  // choosing for that field, not just a pre-set option.
  canPickOutlineColor: boolean;
  canPickBackgroundColor: boolean;
}

const EMPTY: UnlockedFlareOptions = {
  backgroundEffect: [],
  borderStyle: [],
  icon: [],
  ribbonText: [],
  nameSuffix: [],
  canPickOutlineColor: false,
  canPickBackgroundColor: false,
};

/**
 * The pool of badge-flare options an employee has actually "won" \u2014 the
 * union of reward fields across every challenge they've completed
 * (status CORRECT). Self-service flare edits (see actions/selfFlare.ts)
 * may only pick from this pool; everyone starts with an empty pool for
 * every field until they complete a challenge that rewards it.
 */
export async function getUnlockedFlareOptions(employeeId: string): Promise<UnlockedFlareOptions> {
  const employee = await prisma.employee.findUnique({ where: { id: employeeId }, select: { isAdmin: true } });

  // Game-master perk: admins get every badge customization option
  // unlocked outright, rather than needing to actually complete
  // challenges (which would falsely inflate their XP/leaderboard rank).
  // backgroundEffect/borderStyle/icon have a fixed, enumerable catalog
  // (see flare.ts), so "all" means the full catalog. ribbonText/
  // nameSuffix are freeform text with no closed set - "all" there means
  // every distinct value any challenge in the game currently grants.
  if (employee?.isAdmin) {
    const allChallenges = await prisma.challenge.findMany({
      select: { rewardRibbonText: true, rewardNameSuffix: true },
    });
    const ribbonText = [...new Set(allChallenges.map((c) => c.rewardRibbonText).filter((v): v is string => !!v))];
    const nameSuffix = [...new Set(allChallenges.map((c) => c.rewardNameSuffix).filter((v): v is string => !!v))];
    return {
      backgroundEffect: [...BACKGROUND_EFFECTS],
      borderStyle: [...BORDER_STYLES],
      icon: [...ICONS],
      ribbonText,
      nameSuffix,
      canPickOutlineColor: true,
      canPickBackgroundColor: true,
    };
  }

  const correct = await prisma.submission.findMany({
    where: { employeeId, status: "CORRECT" },
    include: { challenge: true },
  });

  const result: UnlockedFlareOptions = {
    backgroundEffect: [],
    borderStyle: [],
    icon: [],
    ribbonText: [],
    nameSuffix: [],
    canPickOutlineColor: false,
    canPickBackgroundColor: false,
  };
  const seen = {
    backgroundEffect: new Set<string>(),
    borderStyle: new Set<string>(),
    icon: new Set<string>(),
    ribbonText: new Set<string>(),
    nameSuffix: new Set<string>(),
  };

  for (const { challenge: c } of correct) {
    if (c.rewardBackgroundEffect && !seen.backgroundEffect.has(c.rewardBackgroundEffect)) {
      seen.backgroundEffect.add(c.rewardBackgroundEffect);
      result.backgroundEffect.push(c.rewardBackgroundEffect);
    }
    if (c.rewardBorderStyle && !seen.borderStyle.has(c.rewardBorderStyle)) {
      seen.borderStyle.add(c.rewardBorderStyle);
      result.borderStyle.push(c.rewardBorderStyle);
    }
    if (c.rewardIcon && !seen.icon.has(c.rewardIcon)) {
      seen.icon.add(c.rewardIcon);
      result.icon.push(c.rewardIcon);
    }
    if (c.rewardRibbonText && !seen.ribbonText.has(c.rewardRibbonText)) {
      seen.ribbonText.add(c.rewardRibbonText);
      result.ribbonText.push(c.rewardRibbonText);
    }
    if (c.rewardNameSuffix && !seen.nameSuffix.has(c.rewardNameSuffix)) {
      seen.nameSuffix.add(c.rewardNameSuffix);
      result.nameSuffix.push(c.rewardNameSuffix);
    }
    if (c.rewardOutlineColorPicker) result.canPickOutlineColor = true;
    if (c.rewardBackgroundColorPicker) result.canPickBackgroundColor = true;
  }

  return result;
}

export function emptyUnlockedFlareOptions(): UnlockedFlareOptions {
  return { ...EMPTY };
}
