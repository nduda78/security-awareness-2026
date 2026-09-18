import { Icon } from "./Icon";
import type { IconKey } from "@/lib/flare";

export interface ChallengeReward {
  rewardBackgroundEffect: string | null;
  rewardBorderStyle: string | null;
  rewardIcon: string | null;
  rewardRibbonText: string | null;
  rewardNameSuffix: string | null;
  rewardOutlineColorPicker: boolean;
  rewardBackgroundColorPicker: boolean;
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
    reward.rewardNameSuffix ||
    reward.rewardOutlineColorPicker ||
    reward.rewardBackgroundColorPicker
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
  if (reward.rewardOutlineColorPicker) {
    pills.push({ key: "outline-color", icon: "flame", text: "custom outline color" });
  }
  if (reward.rewardBackgroundColorPicker) {
    pills.push({ key: "bg-color", icon: "flame", text: "custom background color" });
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

// Booleans rather than the raw bytea fields — these pills only ever need
// to know whether something is set, and this shape is also safe to pass
// across the server -> client boundary (e.g. into ChallengesBoard) without
// shipping actual binary content just to render a hint pill.
export interface UnlockTeaser {
  hasAudio: boolean;
  unlockText: string | null;
  unlockLinkUrl: string | null;
  hasImage: boolean;
  hasVideo: boolean;
}

/**
 * Teaser pills for UNLOCK-mode challenges — hints at what kind of content
 * is behind a correct answer (audio / text / link / image / video) without
 * revealing the content itself.
 */
export function UnlockTeaserPills({ challenge }: { challenge: UnlockTeaser }) {
  const pills: { key: string; label: string }[] = [];
  if (challenge.hasAudio) pills.push({ key: "audio", label: "Audio" });
  if (challenge.unlockText) pills.push({ key: "text", label: "Info" });
  if (challenge.unlockLinkUrl) pills.push({ key: "link", label: "Link" });
  if (challenge.hasImage) pills.push({ key: "image", label: "Image" });
  if (challenge.hasVideo) pills.push({ key: "video", label: "Video" });

  if (pills.length === 0) {
    return <span className="text-xs text-brand-sand/40">Something, if you get it right.</span>;
  }

  return (
    <>
      {pills.map((p) => (
        <span key={p.key} className={CYAN_PILL}>
          <Icon name="lock" className="h-3 w-3" /> {p.label}
        </span>
      ))}
    </>
  );
}
