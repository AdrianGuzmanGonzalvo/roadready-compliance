import { NextResponse } from "next/server";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { getSessionUser } from "@/lib/auth";
import { PACKAGE_FORM_FILE, fillPackageForm } from "@/lib/pdf-forms";

export const runtime = "nodejs";

function sanitizeFilenamePart(s: string): string {
  return s.replace(/[^a-z0-9]+/gi, "_").replace(/^_+|_+$/g, "") || "driver";
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const driver = await user.db.driver.findUnique({ where: { id }, include: { complianceForm: true } });
  if (!driver) return NextResponse.json({ error: "Driver not found" }, { status: 404 });

  const company = driver.company ? await user.db.company.findUnique({ where: { name: driver.company } }) : null;

  const template = await readFile(path.join(process.cwd(), "public", "pdf-templates", PACKAGE_FORM_FILE));
  const filledBytes = await fillPackageForm(template, {
    driver: {
      lastName: driver.lastName,
      firstName: driver.firstName,
      driversLicense: driver.driversLicense,
      licenseClass: driver.licenseClass,
      endorsements: driver.endorsements,
      restrictions: driver.restrictions,
      dob: driver.dob,
      phone: driver.phone,
    },
    companyName: driver.company,
    companyLegalName: company?.legalName ?? null,
    companyAddress: company?.address ?? null,
    companyContactName: company?.contactName ?? null,
    companyContactPhone: company?.contactPhone ?? null,
    licenseExp: driver.complianceForm?.licenseExp ?? null,
  });
  const namePart = sanitizeFilenamePart(`${driver.lastName}_${driver.firstName}`);

  return new NextResponse(new Uint8Array(filledBytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="19A_Package_Form_${namePart}.pdf"`,
    },
  });
}
