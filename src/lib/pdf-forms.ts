// Maps driver/compliance data onto the fillable fields of the four NY DMV
// Article 19-A forms bundled under public/pdf-templates/. Only the
// driver/carrier identity fields that RoadReady actually tracks are filled —
// everything else on these forms (accident/conviction history, road-test
// results, examiner certification, signatures) is generated at the time of
// the real exam/interview and has no corresponding data in this app, so
// those fields are left blank and interactive for the examiner to complete
// by hand. Field names were reverse-engineered from each PDF's AcroForm
// (see prisma schema comment history / Data/field-info/*.json for the
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
    clientId: string | null;
    company: string | null;
  };
  licenseExp: Date | null;
}

function fmtDate(d: Date | null): string {
  if (!d) return "";
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(d.getUTCDate()).padStart(2, "0");
  return `${mm}/${dd}/${d.getUTCFullYear()}`;
}

export interface PdfFormTemplate {
  key: string;
  label: string;
  /** Filename under public/pdf-templates/. */
  file: string;
  fields: (ctx: PdfFormFillContext) => Record<string, string>;
}

export const PDF_FORM_TEMPLATES: PdfFormTemplate[] = [
  {
    key: "ds872",
    label: "DS-872",
    file: "ds872.pdf",
    fields: (ctx) => ({
      "Driver's Last Name": ctx.driver.lastName,
      "Driver's First Name": ctx.driver.firstName,
      "Date of Birth (Month/Day/Year)": fmtDate(ctx.driver.dob),
      "License ID (Identification) Number from Driver License": ctx.driver.driversLicense ?? "",
      "Class of Drivers License": ctx.driver.licenseClass ?? "",
      Endorsements: ctx.driver.endorsements ?? "",
      Restrictions: ctx.driver.restrictions ?? "",
      "Expiration Date": fmtDate(ctx.licenseExp),
      "Carrier/DBA Name": ctx.driver.company ?? "",
    }),
  },
  {
    key: "ds873",
    label: "DS-873",
    file: "ds873.pdf",
    fields: (ctx) => ({
      "Drivers Last Name": ctx.driver.lastName,
      "Drivers First Name": ctx.driver.firstName,
      "Date of Birth (Month/Day/Year)": fmtDate(ctx.driver.dob),
      "Driver License ID (Identification) Number": ctx.driver.driversLicense ?? "",
      "License Class": ctx.driver.licenseClass ?? "",
      Endorsements: ctx.driver.endorsements ?? "",
      Restrictions: ctx.driver.restrictions ?? "",
      "Expiration Date": fmtDate(ctx.licenseExp),
      "Carrier/DBA Name": ctx.driver.company ?? "",
    }),
  },
  {
    key: "ds875",
    label: "DS-875",
    file: "ds875.pdf",
    fields: (ctx) => ({
      "Drivers Last Name": ctx.driver.lastName,
      "first name": ctx.driver.firstName,
      "Driver License ID Number": ctx.driver.driversLicense ?? "",
      "License Class": ctx.driver.licenseClass ?? "",
      Endorsements: ctx.driver.endorsements ?? "",
      Restrictions: ctx.driver.restrictions ?? "",
      "Expiration Date": fmtDate(ctx.licenseExp),
      "Date of Birth MonthDayYear": fmtDate(ctx.driver.dob),
      "CarrierDBA Name": ctx.driver.company ?? "",
    }),
  },
  {
    key: "ds875y",
    label: "DS-875Y",
    file: "ds875y.pdf",
    fields: (ctx) => ({
      first: ctx.driver.firstName,
      "last name": ctx.driver.lastName,
      "class of license": ctx.driver.licenseClass ?? "",
      "client id": ctx.driver.clientId ?? "",
      DOB: fmtDate(ctx.driver.dob),
      restrict: ctx.driver.restrictions ?? "",
      endorse: ctx.driver.endorsements ?? "",
      "exp date": fmtDate(ctx.licenseExp),
      "employeer carrier": ctx.driver.company ?? "",
    }),
  },
];
