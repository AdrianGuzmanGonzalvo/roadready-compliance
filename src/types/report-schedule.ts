export type ReportScheduleFrequency = "DAILY" | "WEEKLY" | "MONTHLY";

export interface ReportScheduleDTO {
  id: string;
  reportType: string;
  recipients: string;
  frequency: ReportScheduleFrequency;
  dayOfWeek: number | null;
  dayOfMonth: number | null;
  companyFilter: string | null;
  rosterFilter: string | null;
  enabled: boolean;
  lastSentAt: string | null;
  createdAt: string;
}
