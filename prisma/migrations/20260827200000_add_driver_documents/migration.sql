-- CreateTable
CREATE TABLE "DriverDocument" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "driverId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "pathname" TEXT NOT NULL,
    "contentType" TEXT,
    "size" INTEGER NOT NULL,
    "uploadedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DriverDocument_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Driver" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "DriverDocument_pathname_key" ON "DriverDocument"("pathname");
