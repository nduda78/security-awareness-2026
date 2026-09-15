import { prisma } from "./prisma";

export interface UnlockedFlareOptions {
  backgroundEffect: string[];
  borderStyle: string[];
  icon: string[];
  ribbonText: string[];
  nameSuffix: string[];
  outlineColor: string[];
  backgroundColor: string[];
}

const EMPTY: UnlockedFlareOptions = {
  backgroundEffect: [],
  borderStyle: [],
  icon: [],
  ribbonText: [],
  nameSuffix: [],
  outlineColor: [],
  backgroundColor: [],
};

/**
 * The pool of badge-flare options an employee has actually "won" \u2014 the
 * union of reward fields across every challenge they've completed
 * (status CORRECT). Self-service flare edits (see actions/selfFlare.ts)
 * may only pick from this pool; everyone starts with an empty pool for
 * every field until they complete a challenge that rewards it.
 */
export async function getUnlockedFlareOptions(employeeId: string): Promise<UnlockedFlareOptions> {
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
    outlineColor: [],
    backgroundColor: [],
  };
  const seen = {
    backgroundEffect: new Set<string>(),
    borderStyle: new Set<string>(),
    icon: new Set<string>(),
    ribbonText: new Set<string>(),
    nameSuffix: new Set<string>(),
    outlineColor: new Set<string>(),
    backgroundColor: new Set<string>(),
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
    if (c.rewardOutlineColor && !seen.outlineColor.has(c.rewardOutlineColor)) {
      seen.outlineColor.add(c.rewardOutlineColor);
      result.outlineColor.push(c.rewardOutlineColor);
    }
    if (c.rewardBackgroundColor && !seen.backgroundColor.has(c.rewardBackgroundColor)) {
      seen.backgroundColor.add(c.rewardBackgroundColor);
      result.backgroundColor.push(c.rewardBackgroundColor);
    }
  }

  return result;
}

export function emptyUnlockedFlareOptions(): UnlockedFlareOptions {
  return { ...EMPTY };
}
