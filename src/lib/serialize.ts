import type { Driver, ComplianceForm } from "@/generated/prisma/client";
import type { DriverDTO, ComplianceFormDTO } from "@/types/driver";

type DriverWithForm = Driver & { complianceForm: ComplianceForm | null };

function toIso(d: Date | null | undefined): string | null {
  return d ? d.toISOString() : null;
}

export function serializeDriver(driver: DriverWithForm): DriverDTO {
  const form: ComplianceFormDTO | null = driver.complianceForm
    ? {
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

  return {
    id: driver.id,
    pfl: driver.pfl,
    lastName: driver.lastName,
    firstName: driver.firstName,
    phone: driver.phone,
    position: driver.position,
    driversLicense: driver.driversLicense,
    ssn: driver.ssn,
    dob: toIso(driver.dob),
    licenseClass: driver.licenseClass,
    endorsements: driver.endorsements,
    restrictions: driver.restrictions,
    status: driver.status,
    updateResult: driver.updateResult,
    medicalCondition: driver.medicalCondition,
    bpFollowUp: driver.bpFollowUp,
    diabeticFollowUp: driver.diabeticFollowUp,
    createdAt: driver.createdAt.toISOString(),
    updatedAt: driver.updatedAt.toISOString(),
    complianceForm: form,
  };
}
