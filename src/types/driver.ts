export const DRIVER_STATUSES = ["ACTIVE", "INACTIVE", "TERMINATED"] as const;
export type DriverStatusValue = (typeof DRIVER_STATUSES)[number];

export const FORM_FIELD_DEFS = [
  { key: "pptXray", label: "PPT/X-RAY", description: "Passport / X-Ray" },
  { key: "mcsa5876", label: "MCSA-5876", description: "Medical Examiner Certificate" },
  { key: "ds703", label: "DS-703", description: "Medical Examination Report" },
  { key: "ds704", label: "DS-704", description: "Physical Fitness Certification" },
  { key: "licenseExp", label: "License Exp.", description: "Driver's License Expiration" },
  { key: "ds870", label: "DS-870", description: "Application / Driver Profile" },
  { key: "ds872", label: "DS-872", description: "Annual Review of Driving Record" },
  { key: "ds873", label: "DS-873", description: "Biennial Behind-the-Wheel" },
  { key: "ds875", label: "DS-875", description: "Biennial Written Exam" },
  { key: "ds875y", label: "DS-875Y", description: "Biennial Written Exam (Y)" },
] as const;

export type FormFieldKey = (typeof FORM_FIELD_DEFS)[number]["key"];

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
