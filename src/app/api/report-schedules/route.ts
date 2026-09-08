import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import type { ReportScheduleDTO, ReportScheduleFrequency } from "@/types/report-schedule";

const FREQUENCIES: ReportScheduleFrequency[] = ["DAILY", "WEEKLY", "MONTHLY"];

function serialize(row: {
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

function parseEmails(raw: unknown): string | null {
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

export async function GET() {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;

  const rows = await admin.db.reportSchedule.findMany({ orderBy: { createdAt: "asc" } });
  return NextResponse.json({ schedules: rows.map(serialize) });
}

export async function POST(req: Request) {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;

  const body = await req.json().catch(() => null);

  const recipients = parseEmails(body?.recipients);
  if (!recipients) return NextResponse.json({ error: "Enter at least one valid email address" }, { status: 400 });

  const frequency: ReportScheduleFrequency = FREQUENCIES.includes(body?.frequency) ? body.frequency : "DAILY";

  let dayOfWeek: number | null = null;
  let dayOfMonth: number | null = null;
  if (frequency === "WEEKLY") {
    dayOfWeek = Number(body?.dayOfWeek);
    if (!Number.isInteger(dayOfWeek) || dayOfWeek < 0 || dayOfWeek > 6) {
      return NextResponse.json({ error: "Pick a day of the week" }, { status: 400 });
    }
  }
  if (frequency === "MONTHLY") {
    dayOfMonth = Number(body?.dayOfMonth);
    if (!Number.isInteger(dayOfMonth) || dayOfMonth < 1 || dayOfMonth > 31) {
      return NextResponse.json({ error: "Pick a day of the month (1-31)" }, { status: 400 });
    }
  }

  const schedule = await admin.db.reportSchedule.create({
    data: {
      recipients,
      frequency,
      dayOfWeek,
      dayOfMonth,
      companyFilter: typeof body?.companyFilter === "string" && body.companyFilter !== "ALL" ? body.companyFilter : null,
      rosterFilter: typeof body?.rosterFilter === "string" && body.rosterFilter !== "ALL" ? body.rosterFilter : null,
    },
  });

  return NextResponse.json({ schedule: serialize(schedule) }, { status: 201 });
}
