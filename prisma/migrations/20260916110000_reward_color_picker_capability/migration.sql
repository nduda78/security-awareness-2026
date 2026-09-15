-- Reworks the outline/background color reward fields from "unlock this
-- specific color value" to "unlock the capability to pick any color of
-- your own" for that field.
ALTER TABLE "Challenge" DROP COLUMN "rewardOutlineColor";
ALTER TABLE "Challenge" DROP COLUMN "rewardBackgroundColor";
ALTER TABLE "Challenge" ADD COLUMN "rewardOutlineColorPicker" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Challenge" ADD COLUMN "rewardBackgroundColorPicker" BOOLEAN NOT NULL DEFAULT false;
