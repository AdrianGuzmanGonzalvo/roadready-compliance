import type { ReportScheduleDTO, ReportScheduleFrequency } from "@/types/report-schedule";

const FREQUENCIES: ReportScheduleFrequency[] = ["DAILY", "WEEKLY", "BIWEEKLY", "MONTHLY"];

export function serializeSchedule(row: {
  id: string;
  reportType: string;
  recipients: string;
  frequency: string;
  dayOfWeek: number | null;
  dayOfMonth: number | null;
  companyFilter: string | null;
  rosterFilter: string | null;
  enabled: boolean;
  lastSentAt: Date | null;
  createdAt: Date;
}): ReportScheduleDTO {
  return {
    id: row.id,
    reportType: row.reportType,
    recipients: row.recipients,
    frequency: row.frequency as ReportScheduleFrequency,
    dayOfWeek: row.dayOfWeek,
    dayOfMonth: row.dayOfMonth,
    companyFilter: row.companyFilter,
    rosterFilter: row.rosterFilter,
    enabled: row.enabled,
    lastSentAt: row.lastSentAt ? row.lastSentAt.toISOString() : null,
    createdAt: row.createdAt.toISOString(),
  };
}

/** Comma-joined, validated list of the addresses in `raw`; null when there is none or one is invalid. */
export function parseEmails(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const emails = raw
    .split(/[,;\n]/)
    .map((e) => e.trim())
    .filter(Boolean);
  if (emails.length === 0) return null;
  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emails.every((e) => EMAIL_RE.test(e))) return null;
  return emails.join(",");
}

export interface ScheduleTiming {
  frequency: ReportScheduleFrequency;
  dayOfWeek: number | null;
  dayOfMonth: number | null;
}

/** Frequency and day from a request body, or the message to show when the day is missing or out of range. */
export function parseTiming(body: Record<string, unknown> | null): ScheduleTiming | { error: string } {
  const frequency = FREQUENCIES.find((f) => f === body?.frequency) ?? "DAILY";

  let dayOfWeek: number | null = null;
  let dayOfMonth: number | null = null;
  if (frequency === "WEEKLY" || frequency === "BIWEEKLY") {
    dayOfWeek = Number(body?.dayOfWeek);
    if (!Number.isInteger(dayOfWeek) || dayOfWeek < 0 || dayOfWeek > 6) return { error: "Pick a day of the week" };
  }
  if (frequency === "MONTHLY") {
    dayOfMonth = Number(body?.dayOfMonth);
    if (!Number.isInteger(dayOfMonth) || dayOfMonth < 1 || dayOfMonth > 31) return { error: "Pick a day of the month (1-31)" };
  }
  return { frequency, dayOfWeek, dayOfMonth };
}
