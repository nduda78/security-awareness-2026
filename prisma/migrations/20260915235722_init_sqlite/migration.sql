-- CreateTable
CREATE TABLE "Employee" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "rogueOverride" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "photo" BLOB,
    "photoMimeType" TEXT,
    "photoUpdatedAt" DATETIME
);

-- CreateTable
CREATE TABLE "Challenge" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "answerType" TEXT NOT NULL,
    "correctAnswer" TEXT,
    "choices" TEXT,
    "xpValue" INTEGER NOT NULL,
    "rewardMode" TEXT NOT NULL DEFAULT 'XP',
    "questionImage" BLOB,
    "questionImageMimeType" TEXT,
    "unlockAudio" BLOB,
    "unlockAudioMimeType" TEXT,
    "unlockText" TEXT,
    "unlockLinkUrl" TEXT,
    "unlockLinkLabel" TEXT,
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
    "opensAt" DATETIME,
    "closesAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Submission" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "employeeId" TEXT NOT NULL,
    "challengeId" TEXT NOT NULL,
    "answerRaw" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "xpAwarded" INTEGER NOT NULL DEFAULT 0,
    "submittedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedBy" TEXT,
    "reviewedAt" DATETIME,
    CONSTRAINT "Submission_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Submission_challengeId_fkey" FOREIGN KEY ("challengeId") REFERENCES "Challenge" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "BadgeFlare" (
    "employeeId" TEXT NOT NULL PRIMARY KEY,
    "achievements" TEXT NOT NULL DEFAULT '[]',
    "outlineColor" TEXT,
    "backgroundColor" TEXT,
    "backgroundEffect" TEXT,
    "codenameOverride" TEXT,
    "motto" TEXT,
    "iconOverride" TEXT,
    "borderStyle" TEXT,
    "ribbonText" TEXT,
    "nameSuffix" TEXT,
    "expiresAt" DATETIME,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "BadgeFlare_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AdminAudit" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "action" TEXT NOT NULL,
    "detail" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "Employee_email_key" ON "Employee"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Challenge_slug_key" ON "Challenge"("slug");

-- CreateIndex
CREATE INDEX "Submission_employeeId_idx" ON "Submission"("employeeId");

-- CreateIndex
CREATE INDEX "Submission_challengeId_idx" ON "Submission"("challengeId");

-- CreateIndex
CREATE UNIQUE INDEX "Submission_employeeId_challengeId_key" ON "Submission"("employeeId", "challengeId");
