import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { serializeDriver } from "@/lib/serialize";
import { DRIVER_STATUSES, FORM_FIELD_DEFS } from "@/types/driver";

const DRIVER_TEXT_FIELDS = [
  "pfl",
  "clientId",
  "company",
  "roster",
  "lastName",
  "firstName",
  "phone",
  "email",
  "position",
  "driversLicense",
  "licenseClass",
  "endorsements",
  "restrictions",
  "updateResult",
  "note",
  "medicalCondition",
  "bpFollowUp",
  "diabeticFollowUp",
] as const;

const FORM_DATE_FIELDS = [...FORM_FIELD_DEFS.map((f) => f.key), "annualDefensiveDrivingTest"] as const;

function parseDateInput(value: unknown): Date | null | undefined {
  if (value === undefined) return undefined;
  if (value === null || value === "") return null;
  const d = new Date(value as string);
  return Number.isNaN(d.getTime()) ? null : d;
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const driver = await user.db.driver.findUnique({
    where: { id },
    include: { complianceForm: true, customFormValues: true, documents: true },
  });
  if (!driver) return NextResponse.json({ error: "Driver not found" }, { status: 404 });
  return NextResponse.json({ driver: serializeDriver(driver) });
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();

  const driverData: Record<string, unknown> = {};
  for (const field of DRIVER_TEXT_FIELDS) {
    if (body.driver && field in body.driver) driverData[field] = body.driver[field] || null;
  }
  if (body.driver?.status && DRIVER_STATUSES.includes(body.driver.status)) {
    driverData.status = body.driver.status;
  }
  if (body.driver && "dob" in body.driver) driverData.dob = parseDateInput(body.driver.dob);
  if (body.driver && "ssn" in body.driver) driverData.ssn = body.driver.ssn || null;

  const formData: Record<string, unknown> = {};
  if (body.form) {
    for (const field of FORM_DATE_FIELDS) {
      if (field in body.form) formData[field] = parseDateInput(body.form[field]);
    }
  }

  const customFormDates: Record<string, Date | null> = {};
  if (body.customForm && typeof body.customForm === "object") {
    const validKeys = new Set((await user.db.customForm.findMany({ select: { key: true } })).map((f) => f.key));
    for (const [key, value] of Object.entries(body.customForm)) {
      if (validKeys.has(key)) customFormDates[key] = parseDateInput(value) ?? null;
    }
  }

  const existing = await user.db.driver.findUnique({ where: { id }, select: { id: true } });
  if (!existing) return NextResponse.json({ error: "Driver not found" }, { status: 404 });

  for (const [formKey, date] of Object.entries(customFormDates)) {
    await user.db.customFormValue.upsert({
      where: { driverId_formKey: { driverId: id, formKey } },
      create: { driverId: id, formKey, date },
      update: { date },
    });
  }

  const driver = await user.db.driver.update({
    where: { id },
    data: {
      ...driverData,
      complianceForm:
        Object.keys(formData).length > 0
          ? {
              upsert: {
                create: formData,
                update: formData,
              },
            }
          : undefined,
    },
    include: { complianceForm: true, customFormValues: true, documents: true },
  });

  return NextResponse.json({ driver: serializeDriver(driver) });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  await user.db.driver.delete({ where: { id } }).catch(() => null);
  return NextResponse.json({ ok: true });
}
