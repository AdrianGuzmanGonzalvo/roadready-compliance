import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseDriverWorkbook, normalizeKey } from "@/lib/excel-parser";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const formData = await req.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  let parsed;
  try {
    parsed = parseDriverWorkbook(buffer);
  } catch (err) {
    return NextResponse.json(
      { error: `Failed to parse workbook: ${err instanceof Error ? err.message : String(err)}` },
      { status: 400 }
    );
  }

  if (parsed.records.length === 0) {
    return NextResponse.json(
      { error: "No driver rows found. Expected sheets named PRIME, Active, and/or Terminated.", warnings: parsed.warnings },
      { status: 400 }
    );
  }

  const existingDrivers = await prisma.driver.findMany({ select: { id: true, lastName: true, firstName: true } });
  const existingByKey = new Map(existingDrivers.map((d) => [normalizeKey(d.lastName, d.firstName), d.id]));

  let created = 0;
  let updated = 0;

  for (const record of parsed.records) {
    const existingId = existingByKey.get(record.key);

    if (existingId) {
      await prisma.driver.update({
        where: { id: existingId },
        data: {
          ...record.driver,
          complianceForm: {
            upsert: { create: record.form, update: record.form },
          },
        },
      });
      updated++;
    } else {
      await prisma.driver.create({
        data: {
          ...record.driver,
          complianceForm: { create: record.form },
        },
      });
      created++;
    }
  }

  return NextResponse.json({
    created,
    updated,
    total: parsed.records.length,
    sheetsFound: parsed.sheetsFound,
    warnings: parsed.warnings,
  });
}
