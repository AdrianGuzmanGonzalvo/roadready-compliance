-- CreateTable
CREATE TABLE "Driver" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "pfl" TEXT,
    "lastName" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "phone" TEXT,
    "position" TEXT,
    "driversLicense" TEXT,
    "ssn" TEXT,
    "dob" DATETIME,
    "licenseClass" TEXT,
    "endorsements" TEXT,
    "restrictions" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "updateResult" TEXT,
    "medicalCondition" TEXT,
    "bpFollowUp" TEXT,
    "diabeticFollowUp" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "ComplianceForm" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "driverId" TEXT NOT NULL,
    "mcsa5876" DATETIME,
    "ds703" DATETIME,
    "ds704" DATETIME,
    "licenseExp" DATETIME,
    "ds870" DATETIME,
    "ds872" DATETIME,
    "ds873" DATETIME,
    "ds875" DATETIME,
    "ds875y" DATETIME,
    "annualDefensiveDrivingTest" DATETIME,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ComplianceForm_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Driver" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "Driver_lastName_firstName_idx" ON "Driver"("lastName", "firstName");

-- CreateIndex
CREATE INDEX "Driver_status_idx" ON "Driver"("status");

-- CreateIndex
CREATE UNIQUE INDEX "ComplianceForm_driverId_key" ON "ComplianceForm"("driverId");
