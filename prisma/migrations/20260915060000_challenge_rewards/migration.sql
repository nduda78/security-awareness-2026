-- Advertised challenge rewards beyond XP: a badge-flare ribbon tier and/or a freeform prize.
ALTER TABLE "Challenge" ADD COLUMN "rewardBadgeFlare" TEXT;
ALTER TABLE "Challenge" ADD COLUMN "rewardPrize" TEXT;
