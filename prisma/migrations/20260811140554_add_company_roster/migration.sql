-- AlterTable
ALTER TABLE "Driver" ADD COLUMN "company" TEXT;
ALTER TABLE "Driver" ADD COLUMN "roster" TEXT;

-- CreateIndex
CREATE INDEX "Driver_company_roster_idx" ON "Driver"("company", "roster");
