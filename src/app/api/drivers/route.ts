import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { serializeDriver } from "@/lib/serialize";
import { DRIVER_STATUSES } from "@/types/driver";

export async function GET() {
  const drivers = await prisma.driver.findMany({
    include: { complianceForm: true, customFormValues: true },
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
  });
  return NextResponse.json({ drivers: drivers.map(serializeDriver) });
}

export async function POST(req: Request) {
  const body = await req.json();

  const lastName = typeof body.lastName === "string" ? body.lastName.trim() : "";
  const firstName = typeof body.firstName === "string" ? body.firstName.trim() : "";
  if (!lastName || !firstName) {
    return NextResponse.json({ error: "First and last name are required" }, { status: 400 });
  }

  const status = DRIVER_STATUSES.includes(body.status) ? body.status : "ACTIVE";

  const driver = await prisma.driver.create({
    data: {
      lastName,
      firstName,
      status,
      clientId: body.clientId || null,
      company: body.company || null,
      roster: body.roster || null,
      phone: body.phone || null,
      email: body.email || null,
      position: body.position || null,
      driversLicense: body.driversLicense || null,
      licenseClass: body.licenseClass || null,
      endorsements: body.endorsements || null,
      restrictions: body.restrictions || null,
      note: body.note || null,
      complianceForm: { create: {} },
    },
    include: { complianceForm: true, customFormValues: true },
  });

  return NextResponse.json({ driver: serializeDriver(driver) }, { status: 201 });
}
