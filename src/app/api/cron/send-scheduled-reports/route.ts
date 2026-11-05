import { NextResponse } from "next/server";
import { controlPrisma, getTenantPrisma } from "@/lib/prisma";
import { loadReportData, sendSoonToExpireReport } from "@/lib/scheduled-report";

export const runtime = "nodejs";
export const maxDuration = 60;

function isDueToday(schedule: { frequency: string; dayOfWeek: number | null; dayOfMonth: number | null }, now: Date): boolean {
  if (schedule.frequency === "DAILY") return true;
  if (schedule.frequency === "WEEKLY") return now.getUTCDay() === schedule.dayOfWeek;
  if (schedule.frequency === "MONTHLY") return now.getUTCDate() === schedule.dayOfMonth;
  return false;
}

function alreadySentToday(lastSentAt: Date | null, now: Date): boolean {
  if (!lastSentAt) return false;
  return (
    lastSentAt.getUTCFullYear() === now.getUTCFullYear() &&
    lastSentAt.getUTCMonth() === now.getUTCMonth() &&
    lastSentAt.getUTCDate() === now.getUTCDate()
  );
}

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return NextResponse.json({ error: "CRON_SECRET not configured" }, { status: 500 });

  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const tenants = await controlPrisma.tenant.findMany({ where: { status: "ACTIVE" } });

  const results: { tenant: string; schedule: string; sent: boolean; error?: string }[] = [];

  for (const tenant of tenants) {
    let db;
    try {
      db = getTenantPrisma(tenant);
    } catch {
      continue;
    }

    const schedules = await db.reportSchedule.findMany({ where: { enabled: true } });
    const dueSchedules = schedules.filter((s) => isDueToday(s, now) && !alreadySentToday(s.lastSentAt, now));
    if (dueSchedules.length === 0) continue;

    const data = await loadReportData(db);

    for (const schedule of dueSchedules) {
      try {
        await sendSoonToExpireReport({ tenantName: tenant.name, schedule, data, now });
        await db.reportSchedule.update({ where: { id: schedule.id }, data: { lastSentAt: now } });
        results.push({ tenant: tenant.code, schedule: schedule.id, sent: true });
      } catch (err) {
        results.push({ tenant: tenant.code, schedule: schedule.id, sent: false, error: err instanceof Error ? err.message : String(err) });
      }
    }
  }

  return NextResponse.json({ ranAt: now.toISOString(), results });
}
