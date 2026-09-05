import type { Driver, ComplianceForm, CustomFormValue, DriverDocument, Company, Roster } from "@/generated/prisma/client";
import type { DriverDTO, ComplianceFormDTO } from "@/types/driver";
import type { CompanyDTO, RosterDTO } from "@/types/company";

type DriverWithForm = Driver & {
  complianceForm: ComplianceForm | null;
  customFormValues: CustomFormValue[];
  documents: DriverDocument[];
};
type CompanyWithRosters = Company & { rosters: Roster[] };

function toIso(d: Date | null | undefined): string | null {
  return d ? d.toISOString() : null;
}

export function serializeDriver(driver: DriverWithForm): DriverDTO {
  const form: ComplianceFormDTO | null = driver.complianceForm
    ? {
        pptXray: toIso(driver.complianceForm.pptXray),
        mcsa5876: toIso(driver.complianceForm.mcsa5876),
        ds703: toIso(driver.complianceForm.ds703),
        ds704: toIso(driver.complianceForm.ds704),
        licenseExp: toIso(driver.complianceForm.licenseExp),
        ds870: toIso(driver.complianceForm.ds870),
        ds872: toIso(driver.complianceForm.ds872),
        ds873: toIso(driver.complianceForm.ds873),
        ds875: toIso(driver.complianceForm.ds875),
        ds875y: toIso(driver.complianceForm.ds875y),
        annualDefensiveDrivingTest: toIso(driver.complianceForm.annualDefensiveDrivingTest),
      }
    : null;

  const customForms = Object.fromEntries(driver.customFormValues.map((v) => [v.formKey, toIso(v.date)]));

  const documents = driver.documents
    .map((d) => ({
      id: d.id,
      label: d.label,
      filename: d.filename,
      contentType: d.contentType,
      size: d.size,
      uploadedAt: d.uploadedAt.toISOString(),
    }))
    .sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt));

  return {
    id: driver.id,
    pfl: driver.pfl,
    clientId: driver.clientId,
    company: driver.company,
    roster: driver.roster,
    lastName: driver.lastName,
    firstName: driver.firstName,
    phone: driver.phone,
    email: driver.email,
    position: driver.position,
    driversLicense: driver.driversLicense,
    ssn: driver.ssn,
    dob: toIso(driver.dob),
    licenseClass: driver.licenseClass,
    endorsements: driver.endorsements,
    restrictions: driver.restrictions,
    status: driver.status,
    updateResult: driver.updateResult,
    note: driver.note,
    medicalCondition: driver.medicalCondition,
    bpFollowUp: driver.bpFollowUp,
    diabeticFollowUp: driver.diabeticFollowUp,
    createdAt: driver.createdAt.toISOString(),
    updatedAt: driver.updatedAt.toISOString(),
    complianceForm: form,
    customForms,
    documents,
  };
}

export function serializeRoster(roster: Roster): RosterDTO {
  return {
    id: roster.id,
    name: roster.name,
    companyId: roster.companyId,
    notes: roster.notes,
    createdAt: roster.createdAt.toISOString(),
    updatedAt: roster.updatedAt.toISOString(),
  };
}

export function serializeCompany(company: CompanyWithRosters): CompanyDTO {
  return {
    id: company.id,
    name: company.name,
    address: company.address,
    contactName: company.contactName,
    contactPhone: company.contactPhone,
    contactEmail: company.contactEmail,
    notes: company.notes,
    createdAt: company.createdAt.toISOString(),
    updatedAt: company.updatedAt.toISOString(),
    rosters: company.rosters.map(serializeRoster),
  };
}
