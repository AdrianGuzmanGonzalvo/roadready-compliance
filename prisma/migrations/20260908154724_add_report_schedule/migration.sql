-- CreateTable
CREATE TABLE "ReportSchedule" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "reportType" TEXT NOT NULL DEFAULT 'soon_to_expire',
    "recipients" TEXT NOT NULL,
    "frequency" TEXT NOT NULL DEFAULT 'DAILY',
    "dayOfWeek" INTEGER,
    "dayOfMonth" INTEGER,
    "companyFilter" TEXT,
    "rosterFilter" TEXT,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "lastSentAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
