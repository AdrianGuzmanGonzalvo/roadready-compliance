-- CreateTable
CREATE TABLE "CustomForm" (
    "key" TEXT NOT NULL PRIMARY KEY,
    "label" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "frequency" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "CustomFormValue" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "driverId" TEXT NOT NULL,
    "formKey" TEXT NOT NULL,
    "date" DATETIME,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "CustomFormValue_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Driver" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CustomFormValue_formKey_fkey" FOREIGN KEY ("formKey") REFERENCES "CustomForm" ("key") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "CustomFormValue_driverId_formKey_key" ON "CustomFormValue"("driverId", "formKey");
