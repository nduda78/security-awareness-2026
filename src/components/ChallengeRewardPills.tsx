import { Icon } from "./Icon";
import type { IconKey } from "@/lib/flare";

export interface ChallengeReward {
  rewardBackgroundEffect: string | null;
  rewardBorderStyle: string | null;
  rewardIcon: string | null;
  rewardRibbonText: string | null;
  rewardNameSuffix: string | null;
  rewardPrize: string | null;
}

// Tailwind needs literal class strings to generate CSS for them, so the
// color variants used here are spelled out rather than built dynamically.
const CYAN_PILL = "pill !cursor-default !border-brand-cyan/50 !text-brand-cyan";
const GREEN_PILL = "pill !cursor-default !border-brand-light-green/40 !text-brand-light-green";

function hasFlareReward(reward: ChallengeReward): boolean {
  return !!(
    reward.rewardBackgroundEffect ||
    reward.rewardBorderStyle ||
    reward.rewardIcon ||
    reward.rewardRibbonText ||
    reward.rewardNameSuffix
  );
}

function flarePills(reward: ChallengeReward): { key: string; icon: IconKey; text: string }[] {
  const pills: { key: string; icon: IconKey; text: string }[] = [];
  if (reward.rewardBackgroundEffect) {
    pills.push({ key: "bg", icon: "flame", text: `${reward.rewardBackgroundEffect} background` });
  }
  if (reward.rewardBorderStyle) {
    pills.push({ key: "border", icon: "shield", text: `${reward.rewardBorderStyle} border` });
  }
  if (reward.rewardIcon) {
    pills.push({ key: "icon", icon: reward.rewardIcon as IconKey, text: `${reward.rewardIcon} icon` });
  }
  if (reward.rewardRibbonText) {
    pills.push({ key: "ribbon", icon: "trophy", text: `\u201c${reward.rewardRibbonText}\u201d ribbon` });
  }
  if (reward.rewardNameSuffix) {
    pills.push({ key: "suffix", icon: "crown", text: `\u201c${reward.rewardNameSuffix}\u201d suffix` });
  }
  return pills;
}

/**
 * Compact form for space-constrained spots (the Challenges grid card): one
 * "New Badge Flare" pill covering all set flare fields at once, instead of a
 * pill per field, plus a separate pill for the freeform prize.
 */
export function ChallengeRewardPills({ reward }: { reward: ChallengeReward }) {
  return (
    <>
      {hasFlareReward(reward) && (
        <span className={CYAN_PILL}>
          <Icon name="flame" className="h-3 w-3" /> New Badge Flare
        </span>
      )}
      {reward.rewardPrize && (
        <span className={GREEN_PILL}>
          <Icon name="crown" className="h-3 w-3" /> {reward.rewardPrize}
        </span>
      )}
    </>
  );
}

/**
 * Full breakdown for the challenge detail page's Rewards section \u2014 every
 * set flare field listed individually, plus the freeform prize.
 */
export function ChallengeRewardDetails({ reward }: { reward: ChallengeReward }) {
  const pills = flarePills(reward);
  if (pills.length === 0 && !reward.rewardPrize) return null;

  return (
    <>
      {pills.map((p) => (
        <span key={p.key} className={CYAN_PILL}>
          <Icon name={p.icon} className="h-3 w-3" /> {p.text}
        </span>
      ))}
      {reward.rewardPrize && (
        <span className={GREEN_PILL}>
          <Icon name="crown" className="h-3 w-3" /> {reward.rewardPrize}
        </span>
      )}
    </>
  );
}
