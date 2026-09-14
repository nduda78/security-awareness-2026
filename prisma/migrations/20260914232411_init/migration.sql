-- CreateEnum
CREATE TYPE "AnswerType" AS ENUM ('EXACT', 'CASE_INSENSITIVE', 'MULTIPLE_CHOICE', 'FREE_TEXT_REVIEW');

-- CreateEnum
CREATE TYPE "SubmissionStatus" AS ENUM ('CORRECT', 'INCORRECT', 'PENDING_REVIEW');

-- CreateTable
CREATE TABLE "Employee" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "rogueOverride" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Employee_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Challenge" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "answerType" "AnswerType" NOT NULL,
    "correctAnswer" TEXT,
    "choices" JSONB,
    "xpValue" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "opensAt" TIMESTAMP(3),
    "closesAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Challenge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Submission" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "challengeId" TEXT NOT NULL,
    "answerRaw" TEXT NOT NULL,
    "status" "SubmissionStatus" NOT NULL,
    "xpAwarded" INTEGER NOT NULL DEFAULT 0,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),

    CONSTRAINT "Submission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BadgeFlare" (
    "employeeId" TEXT NOT NULL,
    "achievements" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "outlineColor" TEXT,
    "backgroundColor" TEXT,
    "backgroundEffect" TEXT,
    "codenameOverride" TEXT,
    "motto" TEXT,
    "iconOverride" TEXT,
    "borderStyle" TEXT,
    "ribbonText" TEXT,
    "pinned" BOOLEAN NOT NULL DEFAULT false,
    "nameSuffix" TEXT,
    "expiresAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BadgeFlare_pkey" PRIMARY KEY ("employeeId")
);

-- CreateTable
CREATE TABLE "AdminAudit" (
    "id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "detail" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminAudit_pkey" PRIMARY KEY ("id")
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

-- AddForeignKey
ALTER TABLE "Submission" ADD CONSTRAINT "Submission_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Submission" ADD CONSTRAINT "Submission_challengeId_fkey" FOREIGN KEY ("challengeId") REFERENCES "Challenge"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BadgeFlare" ADD CONSTRAINT "BadgeFlare_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;
