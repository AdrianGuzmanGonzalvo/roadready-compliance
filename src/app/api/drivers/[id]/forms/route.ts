import { NextResponse } from "next/server";
import { PDFDocument, PDFTextField, PDFCheckBox, PDFRadioGroup, PDFDropdown, PDFOptionList } from "pdf-lib";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { getSessionUser } from "@/lib/auth";
import {
  PACKAGE_FORM_CARRIER_FIELD,
  PACKAGE_FORM_FILE,
  buildPackageFormTextFields,
  type PdfFormFillContext,
} from "@/lib/pdf-forms";

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

  const [company, allCompanies] = await Promise.all([
    driver.company ? user.db.company.findUnique({ where: { name: driver.company } }) : Promise.resolve(null),
    user.db.company.findMany({ orderBy: { name: "asc" }, select: { name: true } }),
  ]);

  const ctx: PdfFormFillContext = {
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
    companyContactName: company?.contactName ?? null,
    companyContactPhone: company?.contactPhone ?? null,
    licenseExp: driver.complianceForm?.licenseExp ?? null,
  };

  const templatePath = path.join(process.cwd(), "public", "pdf-templates", PACKAGE_FORM_FILE);
  const bytes = await readFile(templatePath);
  const pdfDoc = await PDFDocument.load(bytes, { ignoreEncryption: true });
  const form = pdfDoc.getForm();

  // The template ships with a filled sample driver ("Emile Damors") baked
  // into every field's default value — not just the ones we have real data
  // for. Clear every field first so none of that sample data (address,
  // examiner info, road-test results, etc.) leaks into the output.
  for (const field of form.getFields()) {
    try {
      if (field instanceof PDFTextField) field.setText(undefined);
      else if (field instanceof PDFCheckBox) field.uncheck();
      else if (field instanceof PDFRadioGroup) field.clear();
      else if (field instanceof PDFDropdown) field.clear();
      else if (field instanceof PDFOptionList) field.clear();
    } catch (err) {
      console.error(`[pdf-forms] Failed to clear field "${field.getName()}":`, err);
    }
  }

  const values = buildPackageFormTextFields(ctx);
  for (const [fieldName, value] of Object.entries(values)) {
    if (!value) continue;
    try {
      form.getTextField(fieldName).setText(value);
    } catch (err) {
      console.error(`[pdf-forms] Failed to set field "${fieldName}":`, err);
    }
  }

  try {
    const carrierField = form.getDropdown(PACKAGE_FORM_CARRIER_FIELD);
    // Replace the template's pre-recorded carrier list with our own
    // companies — the driver's own company always included, even if it
    // isn't a formally registered Company record.
    const companyNames = allCompanies.map((c) => c.name);
    if (ctx.companyName && !companyNames.includes(ctx.companyName)) companyNames.push(ctx.companyName);
    companyNames.sort((a, b) => a.localeCompare(b));
    carrierField.setOptions(companyNames);
    if (ctx.companyName) carrierField.select(ctx.companyName);
  } catch (err) {
    console.error(`[pdf-forms] Failed to set carrier options:`, err);
  }

  // Deliberately not flattened: the remaining fields (accident history,
  // road-test results, examiner/SBDI certification, vehicle assignment,
  // driver home address) still need to be filled by hand, so the output
  // must stay a live, fillable PDF.
  form.updateFieldAppearances();

  const filledBytes = await pdfDoc.save();
  const namePart = sanitizeFilenamePart(`${driver.lastName}_${driver.firstName}`);

  return new NextResponse(new Uint8Array(filledBytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="19A_Package_Form_${namePart}.pdf"`,
    },
  });
}
