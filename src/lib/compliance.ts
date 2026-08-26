import { differenceInCalendarDays } from "date-fns";
import { DEFAULT_FORM_FIELD_DEFS, type DriverDTO, type FormFieldDef, type FormFieldKey } from "@/types/driver";

export type ComplianceStatus = "expired" | "expiring_30" | "expiring_60" | "compliant" | "missing";

export const STATUS_CONFIG: Record<
  ComplianceStatus,
  { label: string; badgeClass: string; dotClass: string }
> = {
  expired: {
    label: "Expired",
    badgeClass: "bg-red-50 text-red-700 border-red-200",
    dotClass: "bg-red-500",
  },
  expiring_30: {
    label: "Expiring Soon",
    badgeClass: "bg-amber-50 text-amber-700 border-amber-200",
    dotClass: "bg-amber-500",
  },
  expiring_60: {
    label: "Upcoming",
    badgeClass: "bg-orange-50 text-orange-700 border-orange-200",
    dotClass: "bg-orange-500",
  },
  compliant: {
    label: "Compliant",
    badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200",
    dotClass: "bg-emerald-500",
  },
  missing: {
    label: "No Data",
    badgeClass: "bg-gray-50 text-gray-500 border-gray-200",
    dotClass: "bg-gray-400",
  },
};

/** Days remaining until `date`, relative to today. Negative = expired. */
export function daysRemaining(date: string | Date | null | undefined, now: Date = new Date()): number | null {
  if (!date) return null;
  const target = typeof date === "string" ? new Date(date) : date;
  if (Number.isNaN(target.getTime())) return null;
  return differenceInCalendarDays(target, now);
}

export function statusForDate(date: string | Date | null | undefined, now: Date = new Date()): ComplianceStatus {
  const days = daysRemaining(date, now);
  if (days === null) return "missing";
  if (days < 0) return "expired";
  if (days <= 30) return "expiring_30";
  if (days <= 60) return "expiring_60";
  return "compliant";
}

const STATUS_SEVERITY: Record<ComplianceStatus, number> = {
  expired: 4,
  expiring_30: 3,
  expiring_60: 2,
  compliant: 1,
  missing: 0,
};

export type FormSource = Pick<DriverDTO, "complianceForm" | "customForms">;

/** Reads a driver's recorded date for a form field, whether it's a built-in column or a custom form. */
export function getFormDate(source: FormSource, formDef: Pick<FormFieldDef, "key" | "isCustom">): string | null {
  if (formDef.isCustom) return source.customForms?.[formDef.key] ?? null;
  return source.complianceForm?.[formDef.key as FormFieldKey] ?? null;
}

/** Worst-case status across all tracked form fields for a driver. */
export function overallStatus(
  source: FormSource | null,
  now: Date = new Date(),
  formFieldDefs: readonly FormFieldDef[] = DEFAULT_FORM_FIELD_DEFS
): ComplianceStatus {
  if (!source) return "missing";
  let worst: ComplianceStatus = "missing";
  for (const f of formFieldDefs) {
    const s = statusForDate(getFormDate(source, f), now);
    if (STATUS_SEVERITY[s] > STATUS_SEVERITY[worst]) worst = s;
  }
  return worst;
}

/** The form field with the nearest (most urgent) expiration date for a driver, if any. */
export function nextExpiringForm(
  source: FormSource | null,
  formFieldDefs: readonly FormFieldDef[] = DEFAULT_FORM_FIELD_DEFS
): { key: string; label: string; date: string } | null {
  if (!source) return null;
  let best: { key: string; label: string; date: string; time: number } | null = null;
  for (const f of formFieldDefs) {
    const value = getFormDate(source, f);
    if (!value) continue;
    const time = new Date(value).getTime();
    if (Number.isNaN(time)) continue;
    if (!best || time < best.time) best = { key: f.key, label: f.label, date: value, time };
  }
  return best ? { key: best.key, label: best.label, date: best.date } : null;
}

export interface FormExpirySummary {
  expired: number;
  expiring30: number;
  expiring60: number;
  compliant: number;
}

export interface DueSoonEntry {
  driverId: string;
  lastName: string;
  firstName: string;
  company: string | null;
  roster: string | null;
  driverStatus: DriverDTO["status"];
  formKey: string;
  formLabel: string;
  date: string;
  daysRemaining: number;
  status: "expired" | "expiring_30";
}

/**
 * Flat, one-row-per-due-form list of every compliance form due within
 * `withinDays` (including already-overdue forms), sorted most urgent first.
 * Used by the Soon to Expire report.
 */
export function getDueSoonEntries(
  drivers: DriverDTO[],
  withinDays = 30,
  now: Date = new Date(),
  formFieldDefs: readonly FormFieldDef[] = DEFAULT_FORM_FIELD_DEFS
): DueSoonEntry[] {
  const entries: DueSoonEntry[] = [];
  for (const driver of drivers) {
    for (const f of formFieldDefs) {
      const value = getFormDate(driver, f);
      if (!value) continue;
      const days = daysRemaining(value, now);
      if (days === null || days > withinDays) continue;
      entries.push({
        driverId: driver.id,
        lastName: driver.lastName,
        firstName: driver.firstName,
        company: driver.company,
        roster: driver.roster,
        driverStatus: driver.status,
        formKey: f.key,
        formLabel: f.label,
        date: value,
        daysRemaining: days,
        status: days < 0 ? "expired" : "expiring_30",
      });
    }
  }
  return entries.sort((a, b) => a.daysRemaining - b.daysRemaining);
}

/** Tally form-level (not driver-level) expiry counts across a set of drivers' compliance forms. */
export function summarizeFormExpiries(
  sources: (FormSource | null)[],
  now: Date = new Date(),
  formFieldDefs: readonly FormFieldDef[] = DEFAULT_FORM_FIELD_DEFS
): FormExpirySummary {
  const summary: FormExpirySummary = { expired: 0, expiring30: 0, expiring60: 0, compliant: 0 };
  for (const source of sources) {
    if (!source) continue;
    for (const f of formFieldDefs) {
      const value = getFormDate(source, f);
      if (!value) continue;
      const status = statusForDate(value, now);
      if (status === "expired") summary.expired++;
      else if (status === "expiring_30") summary.expiring30++;
      else if (status === "expiring_60") summary.expiring60++;
      else if (status === "compliant") summary.compliant++;
    }
  }
  return summary;
}
