-- New "unlock content" challenge type: correct answer reveals audio/text/
-- link/image instead of granting XP. Also adds an optional question image
-- usable on any challenge (e.g. a phishing screenshot to inspect).
CREATE TYPE "RewardMode" AS ENUM ('XP', 'UNLOCK');

ALTER TABLE "Challenge" ADD COLUMN "rewardMode" "RewardMode" NOT NULL DEFAULT 'XP';
ALTER TABLE "Challenge" ADD COLUMN "questionImage" BYTEA;
ALTER TABLE "Challenge" ADD COLUMN "questionImageMimeType" TEXT;
ALTER TABLE "Challenge" ADD COLUMN "unlockAudio" BYTEA;
ALTER TABLE "Challenge" ADD COLUMN "unlockAudioMimeType" TEXT;
ALTER TABLE "Challenge" ADD COLUMN "unlockText" TEXT;
ALTER TABLE "Challenge" ADD COLUMN "unlockLinkUrl" TEXT;
ALTER TABLE "Challenge" ADD COLUMN "unlockLinkLabel" TEXT;
ALTER TABLE "Challenge" ADD COLUMN "unlockImage" BYTEA;
ALTER TABLE "Challenge" ADD COLUMN "unlockImageMimeType" TEXT;
