import {
  computeDriverScore,
  getFormDate,
  statusForDate,
  daysRemaining,
  nextExpiringForm,
  type DriverScore,
  type ComplianceStatus,
} from "@/lib/compliance";
import type { FormFieldDef, DriverDTO } from "@/types/driver";

export interface ScorecardCell {
  key: string;
  label: string;
  status: ComplianceStatus;
  days: number | null;
  date: string | null;
}

export interface ScorecardUrgent {
  label: string;
  days: number;
}

export interface ScorecardData {
  score: DriverScore;
  actionText: string;
  nextDays: number | null;
  /** The driver's own soonest-due forms (expired or due within 30 days), most urgent first. */
  urgent: ScorecardUrgent[];
  /** Every tracked form's status, in formFieldDefs order — the basis for any per-form grid/list/matrix. */
  cells: ScorecardCell[];
}

/** One computation shared by every scorecard view, so they never drift from each other or from the real data. */
export function buildScorecardData(
  driver: DriverDTO,
  formFieldDefs: FormFieldDef[],
  now: Date = new Date(),
  urgentLimit = 3
): ScorecardData {
  const score = computeDriverScore(driver, now, formFieldDefs);
  const next = nextExpiringForm(driver, formFieldDefs);
  const nextDays = next ? daysRemaining(next.date, now) : null;
  const expiredCount = formFieldDefs.filter((f) => statusForDate(getFormDate(driver, f), now) === "expired").length;

  let actionText: string;
  if (!next || nextDays === null) {
    actionText = "No records on file";
  } else if (nextDays < 0) {
    actionText = expiredCount > 1 ? `URGENT: ${expiredCount} forms overdue` : `Renew ${next.label} now`;
  } else {
    actionText = `Renew ${next.label} in ${nextDays}d`;
  }

  const cells: ScorecardCell[] = formFieldDefs.map((f) => {
    const value = getFormDate(driver, f);
    return { key: f.key, label: f.label, status: statusForDate(value, now), days: daysRemaining(value, now), date: value };
  });

  const urgent: ScorecardUrgent[] = cells
    .filter((c): c is ScorecardCell & { days: number } => c.days !== null && c.days <= 30)
    .sort((a, b) => a.days - b.days)
    .slice(0, urgentLimit)
    .map((c) => ({ label: c.label, days: c.days as number }));

  return { score, actionText, nextDays, urgent, cells };
}

// Shared status → Tailwind class tokens, so every view uses exactly the same palette.
export const STATUS_TEXT_COLOR: Record<ComplianceStatus, string> = {
  expired: "text-red-600",
  expiring_30: "text-amber-600",
  expiring_60: "text-orange-600",
  compliant: "text-emerald-600",
  missing: "text-neutral-500",
};

export const STATUS_BADGE_CLASS: Record<ComplianceStatus, string> = {
  expired: "bg-red-500",
  expiring_30: "bg-amber-500",
  expiring_60: "bg-orange-500",
  compliant: "bg-emerald-500",
  missing: "bg-neutral-400",
};

/** Solid, saturated fill — for compact cells/matrix badges. */
export const STATUS_SOLID_CLASS: Record<ComplianceStatus, string> = {
  expired: "bg-red-500 text-white",
  expiring_30: "bg-amber-400 text-amber-950",
  expiring_60: "bg-orange-500 text-white",
  compliant: "bg-emerald-500 text-white",
  missing: "bg-neutral-200 text-neutral-600",
};

/** Pale tint fill — for pills/list rows/banners. */
export const STATUS_SOFT_CLASS: Record<ComplianceStatus, string> = {
  expired: "bg-red-50 text-red-700",
  expiring_30: "bg-amber-50 text-amber-700",
  expiring_60: "bg-orange-50 text-orange-700",
  compliant: "bg-emerald-50 text-emerald-700",
  missing: "bg-neutral-100 text-neutral-500",
};

export const RING_BLUE = "#2563EB";

export function initials(driver: Pick<DriverDTO, "firstName" | "lastName">): string {
  return `${driver.firstName[0] ?? ""}${driver.lastName[0] ?? ""}`.toUpperCase();
}

export type ScorecardView = "structured" | "hierarchy" | "data-focus" | "compact";

export const SCORECARD_VIEWS: { value: ScorecardView; label: string }[] = [
  { value: "structured", label: "Structured" },
  { value: "hierarchy", label: "Hierarchical" },
  { value: "data-focus", label: "Data Focus" },
  { value: "compact", label: "Compact" },
];
