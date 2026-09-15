-- Replaces the single "rewardBadgeFlare" ribbon-tier text with the full set
-- of badge-flare reward fields (background effect, border style, icon,
-- ribbon text, name suffix), mirroring BadgeFlare itself.
ALTER TABLE "Challenge" DROP COLUMN "rewardBadgeFlare";
ALTER TABLE "Challenge" ADD COLUMN "rewardBackgroundEffect" TEXT;
ALTER TABLE "Challenge" ADD COLUMN "rewardBorderStyle" TEXT;
ALTER TABLE "Challenge" ADD COLUMN "rewardIcon" TEXT;
ALTER TABLE "Challenge" ADD COLUMN "rewardRibbonText" TEXT;
ALTER TABLE "Challenge" ADD COLUMN "rewardNameSuffix" TEXT;
