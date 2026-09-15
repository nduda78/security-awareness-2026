-- Adds clearance-level gating to challenges.
CREATE TYPE "ClearanceLevel" AS ENUM ('UNCLASSIFIED', 'SECRET', 'TOP_SECRET', 'ROGUE');

ALTER TABLE "Challenge" ADD COLUMN "minClearance" "ClearanceLevel" NOT NULL DEFAULT 'UNCLASSIFIED';
