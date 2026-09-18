-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Employee" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "pinHash" TEXT,
    "rogueOverride" BOOLEAN NOT NULL DEFAULT false,
    "isAdmin" BOOLEAN NOT NULL DEFAULT false,
    "isHidden" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "photo" BLOB,
    "photoMimeType" TEXT,
    "photoUpdatedAt" DATETIME,
    "lastChatReadAt" DATETIME,
    "chatActiveAt" DATETIME,
    "typingAt" DATETIME,
    "isSystemAccount" BOOLEAN NOT NULL DEFAULT false
);
INSERT INTO "new_Employee" ("createdAt", "displayName", "email", "id", "isAdmin", "isHidden", "lastChatReadAt", "photo", "photoMimeType", "photoUpdatedAt", "pinHash", "rogueOverride") SELECT "createdAt", "displayName", "email", "id", "isAdmin", "isHidden", "lastChatReadAt", "photo", "photoMimeType", "photoUpdatedAt", "pinHash", "rogueOverride" FROM "Employee";
DROP TABLE "Employee";
ALTER TABLE "new_Employee" RENAME TO "Employee";
CREATE UNIQUE INDEX "Employee_email_key" ON "Employee"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
