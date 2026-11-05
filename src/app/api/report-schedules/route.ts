import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { parseEmails, parseTiming, serializeSchedule } from "@/lib/report-schedule-input";

export async function GET() {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;

  const rows = await admin.db.reportSchedule.findMany({ orderBy: { createdAt: "asc" } });
  return NextResponse.json({ schedules: rows.map(serializeSchedule) });
}

export async function POST(req: Request) {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;

  const body = await req.json().catch(() => null);

  const recipients = parseEmails(body?.recipients);
  if (!recipients) return NextResponse.json({ error: "Enter at least one valid email address" }, { status: 400 });

  const timing = parseTiming(body);
  if ("error" in timing) return NextResponse.json({ error: timing.error }, { status: 400 });

  const schedule = await admin.db.reportSchedule.create({
    data: {
      recipients,
      ...timing,
      companyFilter: typeof body?.companyFilter === "string" && body.companyFilter !== "ALL" ? body.companyFilter : null,
      rosterFilter: typeof body?.rosterFilter === "string" && body.rosterFilter !== "ALL" ? body.rosterFilter : null,
    },
  });

  return NextResponse.json({ schedule: serializeSchedule(schedule) }, { status: 201 });
}
