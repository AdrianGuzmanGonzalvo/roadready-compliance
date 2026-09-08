import { NextResponse } from "next/server";
import { controlPrisma, getTenantPrisma } from "@/lib/prisma";
import { getServerFormFieldDefs } from "@/lib/server-form-fields";
import { serializeDriver } from "@/lib/serialize";
import { getDueSoonEntries } from "@/lib/compliance";
import { filterByCompanyRoster } from "@/lib/scope";
import { buildSoonToExpireEmailHtml, sendReportEmail } from "@/lib/email";

export const runtime = "nodejs";
export const maxDuration = 60;

const APP_URL = process.env.APP_URL ?? "https://roadready-compliance.vercel.app";

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

    const [drivers, formFieldDefs] = await Promise.all([
      db.driver.findMany({ include: { complianceForm: true, customFormValues: true, documents: true } }),
      getServerFormFieldDefs(db),
    ]);
    const driverDtos = drivers.map(serializeDriver);

    for (const schedule of dueSchedules) {
      try {
        const scoped = filterByCompanyRoster(driverDtos, schedule.companyFilter ?? "ALL", schedule.rosterFilter ?? "ALL");
        const entries = getDueSoonEntries(scoped, 30, now, formFieldDefs);
        const html = buildSoonToExpireEmailHtml({ tenantName: tenant.name, entries, appUrl: APP_URL });
        const to = schedule.recipients.split(",").map((e) => e.trim());

        await sendReportEmail({
          to,
          subject: `[${tenant.name}] Soon to Expire — ${entries.length} form${entries.length === 1 ? "" : "s"} due`,
          html,
        });

        await db.reportSchedule.update({ where: { id: schedule.id }, data: { lastSentAt: now } });
        results.push({ tenant: tenant.code, schedule: schedule.id, sent: true });
      } catch (err) {
        results.push({ tenant: tenant.code, schedule: schedule.id, sent: false, error: err instanceof Error ? err.message : String(err) });
      }
    }
  }

  return NextResponse.json({ ranAt: now.toISOString(), results });
}
