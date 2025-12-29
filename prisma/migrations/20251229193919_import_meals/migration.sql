-- AlterTable
ALTER TABLE "Company" ADD COLUMN "dominioCode" TEXT;
ALTER TABLE "Company" ADD COLUMN "dominioRubric" TEXT;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Meal" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "date" DATETIME NOT NULL,
    "price" DECIMAL NOT NULL,
    "periodStart" DATETIME,
    "periodEnd" DATETIME,
    "employeeId" INTEGER,
    "matriculaSnapshot" TEXT NOT NULL DEFAULT '',
    "employeeNameSnapshot" TEXT,
    "employeeSectorSnapshot" TEXT,
    "status" TEXT NOT NULL DEFAULT 'LINKED',
    "companyId" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Meal_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Meal_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Meal" ("companyId", "createdAt", "date", "employeeId", "employeeNameSnapshot", "employeeSectorSnapshot", "id", "periodEnd", "periodStart", "price") SELECT "companyId", "createdAt", "date", "employeeId", "employeeNameSnapshot", "employeeSectorSnapshot", "id", "periodEnd", "periodStart", "price" FROM "Meal";
DROP TABLE "Meal";
ALTER TABLE "new_Meal" RENAME TO "Meal";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
