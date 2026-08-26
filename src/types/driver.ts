export const DRIVER_STATUSES = ["ACTIVE", "INACTIVE", "TERMINATED"] as const;
export type DriverStatusValue = (typeof DRIVER_STATUSES)[number];

export const FORM_FIELD_DEFS = [
  { key: "pptXray", label: "PPT/X-RAY", description: "Passport / X-Ray", frequency: "As required" },
  {
    key: "mcsa5876",
    label: "MCSA-5876",
    description: "Medical Examiner's Certificate (USDOT Medical Card)",
    frequency: "Up to 24 months (12 months for NYS SED school bus drivers / conditional medical follow-ups)",
  },
  {
    key: "ds703",
    label: "DS-703",
    description: "Medical Examination Report (Non-CDL 19-A Drivers)",
    frequency: "Biennial / 24 months (Annual / 12 months for school bus drivers)",
  },
  {
    key: "ds704",
    label: "DS-704",
    description: "Physical Fitness Certification",
    frequency: "Biennial / 24 months (Annual for school bus drivers)",
  },
  {
    key: "licenseExp",
    label: "License Exp.",
    description: "Driver's License Expiration",
    frequency: "Variable, 4–8 years (per issuing State DMV renewal cycle)",
  },
  {
    key: "ds870",
    label: "DS-870",
    description: "Article 19-A Bus Driver Application",
    frequency: "One-time upon hire (permanent Driver Qualification File record)",
  },
  {
    key: "ds872",
    label: "DS-872",
    description: "Annual Review of Employee Driving Record",
    frequency: "Annual / 12 months",
  },
  {
    key: "ds873",
    label: "DS-873",
    description: "Article 19-A Biennial Behind-the-Wheel Examination",
    frequency: "Biennial / 24 months (administered by a 19-A Certified Examiner)",
  },
  {
    key: "ds875",
    label: "DS-875",
    description: "Article 19-A Oral/Written Examination Results",
    frequency: "Biennial / 24 months (administered by a 19-A Certified Examiner)",
  },
  {
    key: "ds875y",
    label: "DS-875Y",
    description: "Article 19-A Oral/Written Examination Results (Y)",
    frequency: "Biennial / 24 months (administered by a 19-A Certified Examiner)",
  },
] as const;

export type FormFieldKey = (typeof FORM_FIELD_DEFS)[number]["key"];

export interface FormFieldDef {
  key: FormFieldKey;
  label: string;
  description: string;
  frequency: string;
}

export interface ComplianceFormDTO {
  pptXray: string | null;
  mcsa5876: string | null;
  ds703: string | null;
  ds704: string | null;
  licenseExp: string | null;
  ds870: string | null;
  ds872: string | null;
  ds873: string | null;
  ds875: string | null;
  ds875y: string | null;
  annualDefensiveDrivingTest: string | null;
}

export interface DriverDTO {
  id: string;
  pfl: string | null;
  clientId: string | null;
  company: string | null;
  roster: string | null;
  lastName: string;
  firstName: string;
  phone: string | null;
  position: string | null;
  driversLicense: string | null;
  ssn: string | null;
  dob: string | null;
  licenseClass: string | null;
  endorsements: string | null;
  restrictions: string | null;
  status: DriverStatusValue;
  updateResult: string | null;
  note: string | null;
  medicalCondition: string | null;
  bpFollowUp: string | null;
  diabeticFollowUp: string | null;
  createdAt: string;
  updatedAt: string;
  complianceForm: ComplianceFormDTO | null;
}
