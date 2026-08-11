import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { serializeDriver } from "@/lib/serialize";

export async function GET() {
  const drivers = await prisma.driver.findMany({
    include: { complianceForm: true },
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
  });
  return NextResponse.json({ drivers: drivers.map(serializeDriver) });
}
