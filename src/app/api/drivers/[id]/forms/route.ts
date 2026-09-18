import { NextResponse } from "next/server";
import { PDFDocument } from "pdf-lib";
import { readFile } from "node:fs/promises";
import path from "node:path";
import JSZip from "jszip";
import { getSessionUser } from "@/lib/auth";
import { PDF_FORM_TEMPLATES, type PdfFormFillContext } from "@/lib/pdf-forms";

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

  const ctx: PdfFormFillContext = {
    driver: {
      lastName: driver.lastName,
      firstName: driver.firstName,
      driversLicense: driver.driversLicense,
      licenseClass: driver.licenseClass,
      endorsements: driver.endorsements,
      restrictions: driver.restrictions,
      dob: driver.dob,
      clientId: driver.clientId,
      company: driver.company,
    },
    licenseExp: driver.complianceForm?.licenseExp ?? null,
  };

  const zip = new JSZip();
  const namePart = sanitizeFilenamePart(`${driver.lastName}_${driver.firstName}`);

  for (const template of PDF_FORM_TEMPLATES) {
    const templatePath = path.join(process.cwd(), "public", "pdf-templates", template.file);
    const bytes = await readFile(templatePath);
    const pdfDoc = await PDFDocument.load(bytes, { ignoreEncryption: true });
    const form = pdfDoc.getForm();

    const values = template.fields(ctx);
    for (const [fieldName, value] of Object.entries(values)) {
      if (!value) continue;
      try {
        form.getTextField(fieldName).setText(value);
      } catch (err) {
        console.error(`[pdf-forms] Failed to set field "${fieldName}" on ${template.key}:`, err);
      }
    }
    // Deliberately not flattened: the remaining fields (accident history,
    // road-test results, examiner certification) still need to be filled
    // by hand, so the output must stay a live, fillable PDF.
    form.updateFieldAppearances();

    const filledBytes = await pdfDoc.save();
    zip.file(`${template.key.toUpperCase()}_${namePart}.pdf`, filledBytes);
  }

  const zipBytes = await zip.generateAsync({ type: "nodebuffer" });

  return new NextResponse(new Uint8Array(zipBytes), {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="19A_Forms_${namePart}.zip"`,
    },
  });
}
