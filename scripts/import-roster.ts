// Imports a single-sheet "Roster" workbook (Standing, ID, Driver Name, School, Date Added,
// Date Ceased, License Expiration Date, CDL Status, License Class, License Status) into
// the Driver table. Matches existing drivers by clientId (the "ID" column); creates new
// ones otherwise. Driver Name is split as: first word = firstName, rest = lastName.
//
// Usage: npx tsx scripts/import-roster.ts <path-to-xlsx>
import "dotenv/config";
import * as XLSX from "xlsx";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";

const [, , filePath] = process.argv;
if (!filePath) {
  console.error("Usage: npx tsx scripts/import-roster.ts <path-to-xlsx>");
  process.exit(1);
}

const EXCEL_EPOCH = Date.UTC(1899, 11, 30);
function toDate(value: unknown): Date | null {
  if (value === undefined || value === null || value === "") return null;
  if (typeof value === "number") {
    const d = new Date(EXCEL_EPOCH + value * 86400000);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  if (typeof value === "string") {
    const d = new Date(value.trim());
    return Number.isNaN(d.getTime()) ? null : d;
  }
  return null;
}

function cell(row: unknown[], idx: number): string | null {
  const v = row[idx];
  if (v === undefined || v === null) return null;
  const s = String(v).trim();
  return s.length ? s : null;
}

async function main() {
  const workbook = XLSX.readFile(filePath, { cellDates: false });
  const sheet = workbook.Sheets["Roster"] ?? workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: true, defval: "" }) as unknown[][];
  const records = rows.slice(1);

  const adapter = new PrismaLibSql({ url: process.env.DATABASE_URL ?? "file:./prisma/dev.db" });
  const prisma = new PrismaClient({ adapter });

  let created = 0;
  let updated = 0;
  let skipped = 0;

  for (const row of records) {
    const clientId = cell(row, 1);
    const fullName = cell(row, 2);
    const licenseExp = toDate(row[6]);

    if (!fullName) {
      skipped++;
      continue;
    }

    const parts = fullName.split(/\s+/);
    const firstName = parts[0];
    const lastName = parts.slice(1).join(" ") || parts[0];

    const data = {
      clientId,
      firstName,
      lastName,
      status: "ACTIVE" as const,
    };

    const existing = clientId ? await prisma.driver.findFirst({ where: { clientId } }) : null;

    if (existing) {
      await prisma.driver.update({
        where: { id: existing.id },
        data: {
          ...data,
          complianceForm: licenseExp ? { upsert: { create: { licenseExp }, update: { licenseExp } } } : undefined,
        },
      });
      updated++;
    } else {
      await prisma.driver.create({
        data: {
          ...data,
          complianceForm: licenseExp ? { create: { licenseExp } } : undefined,
        },
      });
      created++;
    }
  }

  console.log(`Done. Created ${created}, updated ${updated}, skipped ${skipped} (of ${records.length} rows).`);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
