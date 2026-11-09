// Fills the NY DMV "19-A Package" PDF bundled at public/pdf-templates/19a-package-form.pdf
// (DS-870, DS-872, DS-873, DS-875 and DS-875Y in one file) with what this app knows about a
// driver and their carrier. The template is the DMV's fillable packet plus a field over every
// blank it left out (checkboxes, signature dates, vehicle, scores...), built by
// scripts/build-19a-template.py. Driver identity and carrier fields are single fields shared
// by every page, so filling one fills it everywhere. The output is never flattened: every
// field, filled or not, stays editable for whoever completes the exam/interview by hand.
// Field names must match the template byte-for-byte.
import { PDFDocument } from "pdf-lib";

export interface PdfFormFillContext {
  driver: {
    lastName: string;
    firstName: string;
    driversLicense: string | null;
    licenseClass: string | null;
    endorsements: string | null;
    restrictions: string | null;
    dob: Date | null;
    phone: string | null;
  };
  companyName: string | null;
  companyLegalName: string | null;
  companyAddress: string | null;
  companyContactName: string | null;
  companyContactPhone: string | null;
  licenseExp: Date | null;
}

function fmtDate(d: Date | null): string {
  if (!d) return "";
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(d.getUTCDate()).padStart(2, "0");
  return `${mm}/${dd}/${d.getUTCFullYear()}`;
}

/** "123 Main St, Queens, NY 11430" (or on two lines) split for the form; anything else stays whole on the street line. */
function splitAddress(address: string | null): { street: string; city: string; state: string; zip: string } {
  const flat = (address ?? "").trim().replace(/\s*\n\s*/g, ", ");
  const m = flat.match(/^(.+?),\s*([^,]+?),\s*([A-Za-z]{2})\.?\s+(\d{5}(?:-\d{4})?)$/);
  return m ? { street: m[1], city: m[2], state: m[3].toUpperCase(), zip: m[4] } : { street: flat, city: "", state: "", zip: "" };
}

export const PACKAGE_FORM_FILE = "19a-package-form.pdf";

/**
 * Text-field values to fill, keyed by field name. "SSN" is deliberately left out: Driver.ssn is
 * stored masked (e.g. "***-**-1234"), so it isn't the real SSN and would be wrong on a state form.
 */
export function buildPackageFormTextFields(ctx: PdfFormFillContext): Record<string, string> {
  const address = splitAddress(ctx.companyAddress);
  return {
    // Driver, on every page.
    "LAST NAME": ctx.driver.lastName,
    "FIRST NAME": ctx.driver.firstName,
    DOB: fmtDate(ctx.driver.dob),
    "DRIVER LICENSE": ctx.driver.driversLicense ?? "",
    "ID CLASS": ctx.driver.licenseClass ?? "",
    ENDORSEMENTS: ctx.driver.endorsements ?? "",
    RESTRICTIONS: ctx.driver.restrictions ?? "",
    "ID EXP DATE": fmtDate(ctx.licenseExp),
    "TELEPHONE NUMBER": ctx.driver.phone ?? "",
    // Carrier, on every page.
    DBA: ctx.companyName ?? "",
    "LEGAL NAME": ctx.companyLegalName ?? "",
    // Carrier details on DS-870; the contact person is also DS-872's carrier representative.
    "STREET ADDRESS BUS": address.street,
    "CITY BUS": address.city,
    "STATE BUS": address.state,
    "ZIP CODE BUS": address.zip,
    "PHONE BUS": ctx.companyContactPhone ?? "",
    "COMPANY CONTACT": ctx.companyContactName ?? "",
  };
}

/** The filled packet. Every field of the template stays in it, editable. */
export async function fillPackageForm(template: Uint8Array, ctx: PdfFormFillContext): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.load(template);
  const form = pdfDoc.getForm();
  for (const [fieldName, value] of Object.entries(buildPackageFormTextFields(ctx))) {
    if (!value) continue;
    try {
      form.getTextField(fieldName).setText(value);
    } catch (err) {
      console.error(`[pdf-forms] Failed to set field "${fieldName}":`, err);
    }
  }
  form.updateFieldAppearances();
  return pdfDoc.save();
}
