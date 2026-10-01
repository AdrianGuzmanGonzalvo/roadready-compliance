import { addMonths, differenceInCalendarMonths, format, startOfMonth } from "date-fns";
import { daysRemaining, getFormDate, overallStatus, statusForDate, type ComplianceStatus } from "@/lib/compliance";
import type { DriverDTO, FormFieldDef, FormFieldKey } from "@/types/driver";

export type OverviewView = "health" | "risk" | "companies";

export const OVERVIEW_VIEWS: { value: OverviewView; label: string }[] = [
  { value: "health", label: "Global Health" },
  { value: "risk", label: "Risk Matrix & Timeline" },
  { value: "companies", label: "Multi-Company & Radar" },
];

export type StatusCounts = Record<ComplianceStatus, number>;

function emptyCounts(): StatusCounts {
  return { expired: 0, expiring_30: 0, expiring_60: 0, compliant: 0, missing: 0 };
}

/** Whole-number percentage that never rounds a partial result up to 100 or a non-zero one down to 0. */
export function percent(part: number, whole: number): number {
  if (whole <= 0) return 0;
  const pct = Math.round((part / whole) * 100);
  if (pct === 100 && part < whole) return 99;
  if (pct === 0 && part > 0) return 1;
  return pct;
}

export interface FleetReadiness {
  drivers: number;
  /** Has records on file and no expired form — would pass an audit today. */
  ready: number;
  /** Has at least one expired form. */
  expired: number;
  noRecords: number;
  /** `ready` as a share of `drivers`. */
  pct: number;
  /** Drivers by their worst-case form status. */
  byStatus: StatusCounts;
}

/** Driver-level audit readiness for a set of drivers (pass in the active ones). */
export function fleetReadiness(
  drivers: DriverDTO[],
  formFieldDefs: readonly FormFieldDef[],
  now: Date = new Date()
): FleetReadiness {
  const byStatus = emptyCounts();
  for (const driver of drivers) byStatus[overallStatus(driver, now, formFieldDefs)]++;
  const ready = byStatus.expiring_30 + byStatus.expiring_60 + byStatus.compliant;
  return {
    drivers: drivers.length,
    ready,
    expired: byStatus.expired,
    noRecords: byStatus.missing,
    pct: percent(ready, drivers.length),
    byStatus,
  };
}

export interface FormBreakdown {
  key: string;
  label: string;
  description: string;
  /** Drivers by this form's status; `missing` = no date on file. */
  counts: StatusCounts;
  onFile: number;
  /** % of on-file forms that are not expired today; null when none are on file. */
  validPct: number | null;
}

/** Per-form status tally across `drivers`, in formFieldDefs order. */
export function formBreakdowns(
  drivers: DriverDTO[],
  formFieldDefs: readonly FormFieldDef[],
  now: Date = new Date()
): FormBreakdown[] {
  return formFieldDefs.map((f) => {
    const counts = emptyCounts();
    for (const driver of drivers) counts[statusForDate(getFormDate(driver, f), now)]++;
    const onFile = drivers.length - counts.missing;
    return {
      key: f.key,
      label: f.label,
      description: f.description,
      counts,
      onFile,
      validPct: onFile > 0 ? percent(onFile - counts.expired, onFile) : null,
    };
  });
}

export interface MonthBucket {
  /** yyyy-MM */
  key: string;
  month: string;
  year: string;
  /** Forms whose date falls in this month. */
  count: number;
  /** Of `count`, how many are already past due (only possible in the current month). */
  overdue: number;
}

export interface ExpirationTimeline {
  buckets: MonthBucket[];
  /** Forms that expired before the current month began. */
  overdueEarlier: number;
  /** Forms due after the last bucket. */
  later: number;
}

/** Buckets every tracked form date into calendar months, starting with the current one. */
export function expirationTimeline(
  drivers: DriverDTO[],
  formFieldDefs: readonly FormFieldDef[],
  months = 12,
  now: Date = new Date()
): ExpirationTimeline {
  const first = startOfMonth(now);
  const buckets: MonthBucket[] = Array.from({ length: months }, (_, i) => {
    const month = addMonths(first, i);
    return { key: format(month, "yyyy-MM"), month: format(month, "MMM"), year: format(month, "yyyy"), count: 0, overdue: 0 };
  });
  let overdueEarlier = 0;
  let later = 0;
  for (const driver of drivers) {
    for (const f of formFieldDefs) {
      const value = getFormDate(driver, f);
      const days = daysRemaining(value, now);
      if (!value || days === null) continue;
      const idx = differenceInCalendarMonths(new Date(value), now);
      if (idx < 0) overdueEarlier++;
      else if (idx >= months) later++;
      else {
        buckets[idx].count++;
        if (days < 0) buckets[idx].overdue++;
      }
    }
  }
  return { buckets, overdueEarlier, later };
}

export interface GroupReadiness extends FleetReadiness {
  name: string;
}

/** Audit readiness per company or roster, best first. Drivers without a group fall under `unassignedLabel`. */
export function readinessByGroup(
  drivers: DriverDTO[],
  groupOf: (driver: DriverDTO) => string | null,
  unassignedLabel: string,
  formFieldDefs: readonly FormFieldDef[],
  now: Date = new Date()
): GroupReadiness[] {
  const groups = new Map<string, DriverDTO[]>();
  for (const driver of drivers) {
    const name = groupOf(driver) ?? unassignedLabel;
    const list = groups.get(name);
    if (list) list.push(driver);
    else groups.set(name, [driver]);
  }
  return Array.from(groups, ([name, list]) => ({ name, ...fleetReadiness(list, formFieldDefs, now) })).sort(
    (a, b) => b.pct - a.pct || b.drivers - a.drivers || a.name.localeCompare(b.name)
  );
}

const PILLARS: { key: string; label: string; formKeys: FormFieldKey[] }[] = [
  { key: "medical", label: "Medical Exams", formKeys: ["mcsa5876", "ds703", "ds704"] },
  { key: "reviews", label: "Driver Reviews", formKeys: ["ds870", "ds872"] },
  { key: "roadTests", label: "Road Tests", formKeys: ["ds873", "ds875", "ds875y"] },
  { key: "licenses", label: "Licenses", formKeys: ["licenseExp"] },
  { key: "xray", label: "X-Ray / Vision", formKeys: ["pptXray"] },
];

export interface PillarScore {
  key: string;
  label: string;
  /** Labels of the forms that make up this pillar. */
  forms: string[];
  /** Drivers with at least one of the pillar's forms on file. */
  tracked: number;
  /** Of `tracked`, drivers with none of the pillar's forms expired. */
  clear: number;
  /** `clear` as a share of `tracked`; null when nothing is on file. */
  pct: number | null;
}

/** Share of drivers with no expired form in each operational pillar. Admin-added custom forms get their own pillar. */
export function pillarCompliance(
  drivers: DriverDTO[],
  formFieldDefs: readonly FormFieldDef[],
  now: Date = new Date()
): PillarScore[] {
  const pillars = PILLARS.map((p) => ({
    key: p.key,
    label: p.label,
    defs: formFieldDefs.filter((f) => !f.isCustom && (p.formKeys as string[]).includes(f.key)),
  }));
  const custom = formFieldDefs.filter((f) => f.isCustom);
  if (custom.length > 0) pillars.push({ key: "custom", label: "Custom Forms", defs: custom });

  return pillars.map(({ key, label, defs }) => {
    let tracked = 0;
    let clear = 0;
    for (const driver of drivers) {
      const statuses = defs.map((f) => statusForDate(getFormDate(driver, f), now));
      if (statuses.every((s) => s === "missing")) continue;
      tracked++;
      if (!statuses.includes("expired")) clear++;
    }
    return { key, label, forms: defs.map((f) => f.label), tracked, clear, pct: tracked > 0 ? percent(clear, tracked) : null };
  });
}
