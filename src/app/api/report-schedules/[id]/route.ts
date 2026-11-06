import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { ignoreNotFound } from "@/lib/prisma";
import { parseEmails, parseTiming, serializeSchedule, type ScheduleTiming } from "@/lib/report-schedule-input";

/** Pauses/resumes a schedule (`enabled`) or edits it (`recipients`, and `frequency` with its day). */
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;

  const { id } = await params;
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid request body" }, { status: 400 });

  const existing = await admin.db.reportSchedule.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Schedule not found" }, { status: 404 });

  const data: { enabled?: boolean; recipients?: string } & Partial<ScheduleTiming> = {};
  if (typeof body.enabled === "boolean") data.enabled = body.enabled;
  if (body.recipients !== undefined) {
    const recipients = parseEmails(body.recipients);
    if (!recipients) return NextResponse.json({ error: "Enter at least one valid email address" }, { status: 400 });
    data.recipients = recipients;
  }
  if (body.frequency !== undefined) {
    const timing = parseTiming(body);
    if ("error" in timing) return NextResponse.json({ error: timing.error }, { status: 400 });
    Object.assign(data, timing);
  }

  const schedule = await admin.db.reportSchedule.update({ where: { id }, data });
  return NextResponse.json({ schedule: serializeSchedule(schedule) });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;

  const { id } = await params;
  await admin.db.reportSchedule.delete({ where: { id } }).catch(ignoreNotFound);
  return NextResponse.json({ ok: true });
}
