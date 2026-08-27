// Imports the "DRIVER NAME MY DRIVER PRE K" Word-table roster into the Driver table.
// Table columns: DRIVER NAME | CLIENT ID | Email | Phone | DOB | PPT/X-RAY | MCSA-5876 |
// NOTE | DS-703 | DS-704 | DS-872 | DS-873 | DS-875 | DS-875Y
//
// Matches existing drivers by clientId; creates new ones otherwise. All rows are
// assigned company = "FIRST STUDENT PRE-K". NOTE maps to updateResult.
//
// Usage: npx tsx scripts/import-prek-docx.ts <path-to-docx>
import "dotenv/config";
import { execSync } from "node:child_process";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";

const COMPANY = "FIRST STUDENT PRE-K";

const [, , filePath] = process.argv;
if (!filePath) {
  console.error("Usage: npx tsx scripts/import-prek-docx.ts <path-to-docx>");
  process.exit(1);
}

function extractRows(path: string): string[][] {
  const xml = execSync(`unzip -p "${path}" word/document.xml`, { maxBuffer: 50 * 1024 * 1024 }).toString("utf8");
  const rowChunks = xml.split("<w:tr ").slice(1).map((r) => "<w:tr " + r);
  return rowChunks.map((row) => {
    const cells = row.split("<w:tc>").slice(1);
    return cells.map((cell) => {
      const texts = [...cell.matchAll(/<w:t[^>]*>([^<]*)<\/w:t>/g)].map((m) => m[1]);
      return texts.join("").trim();
    });
  });
}

function splitName(raw: string): { lastName: string; firstName: string } {
  if (raw.includes(",")) {
    const firstComma = raw.indexOf(",");
    const lastName = raw.slice(0, firstComma).trim();
    const firstName = raw
      .slice(firstComma + 1)
      .replace(/,/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    return { lastName, firstName: firstName || lastName };
  }
  const parts = raw.replace(/\s+/g, " ").trim().split(" ");
  if (parts.length === 1) return { lastName: parts[0], firstName: parts[0] };
  const lastName = parts[parts.length - 1];
  const firstName = parts.slice(0, -1).join(" ");
  return { lastName, firstName };
}

function toDate(raw: string): Date | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const m = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!m) return null; // reject malformed dates (typos, extra digits) rather than guess
  const [, month, day, year] = m;
  const d = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
  return Number.isNaN(d.getTime()) ? null : d;
}

function cell(row: string[], idx: number): string | null {
  const v = row[idx]?.trim();
  return v ? v : null;
}

async function main() {
  const rows = extractRows(filePath).slice(1); // drop header row
  console.log(`Parsed ${rows.length} rows from the table.`);

  const url = process.env.DATABASE_URL ?? "file:./prisma/dev.db";
  const authToken = process.env.TURSO_AUTH_TOKEN;
  const adapter = url.startsWith("libsql://") && authToken ? new PrismaLibSql({ url, authToken }) : new PrismaLibSql({ url });
  const prisma = new PrismaClient({ adapter });

  let created = 0;
  let updated = 0;
  let skipped = 0;

  for (const row of rows) {
    const rawName = cell(row, 0);
    if (!rawName) {
      skipped++;
      continue;
    }

    const { lastName, firstName } = splitName(rawName);
    const clientId = cell(row, 1);
    const email = cell(row, 2);
    const phone = cell(row, 3);
    const dob = toDate(row[4] ?? "");
    const note = cell(row, 7);

    const formData: Record<string, Date | null> = {};
    const pptXray = toDate(row[5] ?? "");
    const mcsa5876 = toDate(row[6] ?? "");
    const ds703 = toDate(row[8] ?? "");
    const ds704 = toDate(row[9] ?? "");
    const ds872 = toDate(row[10] ?? "");
    const ds873 = toDate(row[11] ?? "");
    const ds875 = toDate(row[12] ?? "");
    const ds875y = toDate(row[13] ?? "");
    if (pptXray) formData.pptXray = pptXray;
    if (mcsa5876) formData.mcsa5876 = mcsa5876;
    if (ds703) formData.ds703 = ds703;
    if (ds704) formData.ds704 = ds704;
    if (ds872) formData.ds872 = ds872;
    if (ds873) formData.ds873 = ds873;
    if (ds875) formData.ds875 = ds875;
    if (ds875y) formData.ds875y = ds875y;

    const driverData = {
      lastName,
      firstName,
      clientId,
      email,
      phone,
      dob,
      note,
      updateResult: note,
      company: COMPANY,
      status: "ACTIVE" as const,
    };

    const existing = clientId ? await prisma.driver.findFirst({ where: { clientId } }) : null;

    if (existing) {
      await prisma.driver.update({
        where: { id: existing.id },
        data: {
          ...driverData,
          complianceForm:
            Object.keys(formData).length > 0 ? { upsert: { create: formData, update: formData } } : undefined,
        },
      });
      updated++;
    } else {
      await prisma.driver.create({
        data: {
          ...driverData,
          complianceForm: Object.keys(formData).length > 0 ? { create: formData } : { create: {} },
        },
      });
      created++;
    }
  }

  console.log(`Done. Created ${created}, updated ${updated}, skipped ${skipped} (of ${rows.length} rows).`);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
