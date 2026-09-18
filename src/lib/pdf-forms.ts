// Maps driver/carrier data onto the fillable fields of the combined NY DMV
// "19-A Package" PDF bundled at public/pdf-templates/19a-package-form.pdf
// (DS-870, DS-872, DS-873, DS-875, DS-875Y, and the NYSED PT900 physical
// performance test, in one file). Several identity fields (driver name,
// DOB, license number/class/endorsements/restrictions, carrier name) are
// wired as a single shared AcroForm field reused across every page in the
// packet, so filling each one once populates it everywhere it appears.
// Everything else on these forms (accident/conviction history, road-test
// results, examiner/SBDI certification, vehicle assignment, driver home
// address) is generated at the time of the real exam/interview/observation
// and has no corresponding data in this app, so those fields are left
// blank and interactive to complete by hand. Field names were
// reverse-engineered from the PDF's AcroForm (see Data/field-info/ for the
// full per-field dump) — they must match byte-for-byte or pdf-lib throws.

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

export const PACKAGE_FORM_FILE = "19a-package-form.pdf";

/** Name of the driver/carrier name choice field, shared across every page of the packet. */
export const PACKAGE_FORM_CARRIER_FIELD = "C_Name";

/**
 * Plain text-field values to fill, keyed by AcroForm field name. Note
 * "Social Security Number" is deliberately omitted: Driver.ssn is stored
 * masked (e.g. "***-**-1234"), so it isn't the real SSN and would be wrong
 * to print on an official state form.
 */
export function buildPackageFormTextFields(ctx: PdfFormFillContext): Record<string, string> {
  return {
    // Shared driver identity fields (appear on DS-870/872/873/875/875Y).
    DLN: ctx.driver.lastName,
    DFN: ctx.driver.firstName,
    DDOB: fmtDate(ctx.driver.dob),
    DDLN: ctx.driver.driversLicense ?? "",
    D_Class: ctx.driver.licenseClass ?? "",
    D_Endorsements: ctx.driver.endorsements ?? "",
    D_Restrictions: ctx.driver.restrictions ?? "",
    D_Exp: fmtDate(ctx.licenseExp),
    // PT900-only fields that restate identity in a different layout.
    D_Fullname: `${ctx.driver.lastName}, ${ctx.driver.firstName}`,
    Text9: [ctx.driver.licenseClass, ctx.driver.endorsements, ctx.driver.restrictions]
      .filter((v) => v)
      .join("/ "),
    // DS-870-only fields.
    "Telephone Number": ctx.driver.phone ?? "",
    "Carrier Telephone Number": ctx.companyContactPhone ?? "",
    "Name of Article 19-A Contact Person": ctx.companyContactName ?? "",
  };
}
