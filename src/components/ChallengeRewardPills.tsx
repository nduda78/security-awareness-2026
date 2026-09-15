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

/** Renders one pill per set badge-flare reward field, plus the freeform prize, if any. */
// Tailwind needs literal class strings to generate CSS for them, so the two
// color variants used here are spelled out rather than built dynamically.
const PURPLE_PILL = "pill !cursor-default !border-brand-purple/40 !text-brand-purple";
const GREEN_PILL = "pill !cursor-default !border-brand-light-green/40 !text-brand-light-green";

export function ChallengeRewardPills({ reward }: { reward: ChallengeReward }) {
  const pills: { key: string; icon: IconKey; text: string; className: string }[] = [];

  if (reward.rewardBackgroundEffect) {
    pills.push({ key: "bg", icon: "flame", text: `${reward.rewardBackgroundEffect} background`, className: PURPLE_PILL });
  }
  if (reward.rewardBorderStyle) {
    pills.push({ key: "border", icon: "shield", text: `${reward.rewardBorderStyle} border`, className: PURPLE_PILL });
  }
  if (reward.rewardIcon) {
    pills.push({
      key: "icon",
      icon: reward.rewardIcon as IconKey,
      text: `${reward.rewardIcon} icon`,
      className: PURPLE_PILL,
    });
  }
  if (reward.rewardRibbonText) {
    pills.push({
      key: "ribbon",
      icon: "trophy",
      text: `\u201c${reward.rewardRibbonText}\u201d ribbon`,
      className: PURPLE_PILL,
    });
  }
  if (reward.rewardNameSuffix) {
    pills.push({
      key: "suffix",
      icon: "crown",
      text: `\u201c${reward.rewardNameSuffix}\u201d suffix`,
      className: PURPLE_PILL,
    });
  }
  if (reward.rewardPrize) {
    pills.push({ key: "prize", icon: "crown", text: reward.rewardPrize, className: GREEN_PILL });
  }

  if (pills.length === 0) return null;

  return (
    <>
      {pills.map((p) => (
        <span key={p.key} className={p.className}>
          <Icon name={p.icon} className="h-3 w-3" /> {p.text}
        </span>
      ))}
    </>
  );
}
