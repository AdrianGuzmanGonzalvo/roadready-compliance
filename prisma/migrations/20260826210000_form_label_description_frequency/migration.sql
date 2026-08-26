-- RedefineTable (FormLabel is empty in production; safe to drop and recreate)
DROP TABLE "FormLabel";

CREATE TABLE "FormLabel" (
    "key" TEXT NOT NULL PRIMARY KEY,
    "label" TEXT,
    "description" TEXT,
    "frequency" TEXT,
    "updatedAt" DATETIME NOT NULL
);
