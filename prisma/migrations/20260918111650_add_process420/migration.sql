-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_BadgeFlare" (
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
    "secretBackText" TEXT,
    "holoSheen" BOOLEAN NOT NULL DEFAULT false,
    "psaGrade" BOOLEAN NOT NULL DEFAULT false,
    "process420" BOOLEAN NOT NULL DEFAULT false,
    "expiresAt" DATETIME,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "BadgeFlare_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_BadgeFlare" ("achievements", "backgroundColor", "backgroundEffect", "borderStyle", "codenameOverride", "employeeId", "expiresAt", "holoSheen", "iconOverride", "motto", "nameSuffix", "outlineColor", "psaGrade", "ribbonText", "secretBackText", "updatedAt") SELECT "achievements", "backgroundColor", "backgroundEffect", "borderStyle", "codenameOverride", "employeeId", "expiresAt", "holoSheen", "iconOverride", "motto", "nameSuffix", "outlineColor", "psaGrade", "ribbonText", "secretBackText", "updatedAt" FROM "BadgeFlare";
DROP TABLE "BadgeFlare";
ALTER TABLE "new_BadgeFlare" RENAME TO "BadgeFlare";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
