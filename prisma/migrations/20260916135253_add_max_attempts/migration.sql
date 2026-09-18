-- AlterTable
ALTER TABLE "Challenge" ADD COLUMN "maxAttempts" INTEGER;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Submission" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "employeeId" TEXT NOT NULL,
    "challengeId" TEXT NOT NULL,
    "answerRaw" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "xpAwarded" INTEGER NOT NULL DEFAULT 0,
    "attempts" INTEGER NOT NULL DEFAULT 1,
    "submittedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedBy" TEXT,
    "reviewedAt" DATETIME,
    CONSTRAINT "Submission_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Submission_challengeId_fkey" FOREIGN KEY ("challengeId") REFERENCES "Challenge" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Submission" ("answerRaw", "challengeId", "employeeId", "id", "reviewedAt", "reviewedBy", "status", "submittedAt", "xpAwarded") SELECT "answerRaw", "challengeId", "employeeId", "id", "reviewedAt", "reviewedBy", "status", "submittedAt", "xpAwarded" FROM "Submission";
DROP TABLE "Submission";
ALTER TABLE "new_Submission" RENAME TO "Submission";
CREATE INDEX "Submission_employeeId_idx" ON "Submission"("employeeId");
CREATE INDEX "Submission_challengeId_idx" ON "Submission"("challengeId");
CREATE UNIQUE INDEX "Submission_employeeId_challengeId_key" ON "Submission"("employeeId", "challengeId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
