-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Challenge" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "answerType" TEXT NOT NULL,
    "correctAnswer" TEXT,
    "choices" TEXT,
    "xpValue" INTEGER NOT NULL,
    "rewardMode" TEXT NOT NULL DEFAULT 'XP',
    "maxAttempts" INTEGER,
    "questionImage" BLOB,
    "questionImageMimeType" TEXT,
    "unlockAudio" BLOB,
    "unlockAudioMimeType" TEXT,
    "unlockText" TEXT,
    "unlockLinkUrl" TEXT,
    "unlockLinkLabel" TEXT,
    "webhookUrl" TEXT,
    "unlockImage" BLOB,
    "unlockImageMimeType" TEXT,
    "unlockVideo" BLOB,
    "unlockVideoMimeType" TEXT,
    "rewardBackgroundEffect" TEXT,
    "rewardBorderStyle" TEXT,
    "rewardIcon" TEXT,
    "rewardRibbonText" TEXT,
    "rewardNameSuffix" TEXT,
    "rewardOutlineColorPicker" BOOLEAN NOT NULL DEFAULT false,
    "rewardBackgroundColorPicker" BOOLEAN NOT NULL DEFAULT false,
    "rewardPrize" TEXT,
    "minClearance" TEXT NOT NULL DEFAULT 'UNCLASSIFIED',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "hiddenFromList" BOOLEAN NOT NULL DEFAULT false,
    "opensAt" DATETIME,
    "closesAt" DATETIME,
    "dropAnnouncedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Challenge" ("answerType", "choices", "closesAt", "correctAnswer", "createdAt", "description", "dropAnnouncedAt", "id", "isActive", "maxAttempts", "minClearance", "opensAt", "questionImage", "questionImageMimeType", "rewardBackgroundColorPicker", "rewardBackgroundEffect", "rewardBorderStyle", "rewardIcon", "rewardMode", "rewardNameSuffix", "rewardOutlineColorPicker", "rewardPrize", "rewardRibbonText", "slug", "title", "unlockAudio", "unlockAudioMimeType", "unlockImage", "unlockImageMimeType", "unlockLinkLabel", "unlockLinkUrl", "unlockText", "unlockVideo", "unlockVideoMimeType", "updatedAt", "webhookUrl", "xpValue") SELECT "answerType", "choices", "closesAt", "correctAnswer", "createdAt", "description", "dropAnnouncedAt", "id", "isActive", "maxAttempts", "minClearance", "opensAt", "questionImage", "questionImageMimeType", "rewardBackgroundColorPicker", "rewardBackgroundEffect", "rewardBorderStyle", "rewardIcon", "rewardMode", "rewardNameSuffix", "rewardOutlineColorPicker", "rewardPrize", "rewardRibbonText", "slug", "title", "unlockAudio", "unlockAudioMimeType", "unlockImage", "unlockImageMimeType", "unlockLinkLabel", "unlockLinkUrl", "unlockText", "unlockVideo", "unlockVideoMimeType", "updatedAt", "webhookUrl", "xpValue" FROM "Challenge";
DROP TABLE "Challenge";
ALTER TABLE "new_Challenge" RENAME TO "Challenge";
CREATE UNIQUE INDEX "Challenge_slug_key" ON "Challenge"("slug");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
