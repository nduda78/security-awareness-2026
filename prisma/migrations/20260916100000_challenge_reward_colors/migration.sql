-- Adds outline/background color as challenge reward options, mirroring
-- BadgeFlare.outlineColor / BadgeFlare.backgroundColor.
ALTER TABLE "Challenge" ADD COLUMN "rewardOutlineColor" TEXT;
ALTER TABLE "Challenge" ADD COLUMN "rewardBackgroundColor" TEXT;
