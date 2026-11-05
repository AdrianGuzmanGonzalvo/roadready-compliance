import type { PrismaClient } from "@/generated/prisma/client";
import { getDueSoonEntries } from "@/lib/compliance";
import { buildSoonToExpireEmailHtml, sendReportEmail } from "@/lib/email";
import { filterByCompanyRoster } from "@/lib/scope";
import { serializeDriver } from "@/lib/serialize";
import { getServerFormFieldDefs } from "@/lib/server-form-fields";
import type { DriverDTO, FormFieldDef } from "@/types/driver";

const APP_URL = process.env.APP_URL ?? "https://roadready-compliance.com";

export interface ReportData {
  drivers: DriverDTO[];
  formFieldDefs: FormFieldDef[];
}

/** Everything a tenant's "Soon to Expire" report is built from; load it once for all of that tenant's schedules. */
export async function loadReportData(db: PrismaClient): Promise<ReportData> {
  const [drivers, formFieldDefs] = await Promise.all([
    db.driver.findMany({ include: { complianceForm: true, customFormValues: true, documents: true } }),
    getServerFormFieldDefs(db),
  ]);
  return { drivers: drivers.map(serializeDriver), formFieldDefs };
}

/** Emails one schedule's "Soon to Expire" report. Used by the daily cron and by "Send now". */
export async function sendSoonToExpireReport(params: {
  tenantName: string;
  schedule: { recipients: string; companyFilter: string | null; rosterFilter: string | null };
  data: ReportData;
  now?: Date;
}): Promise<void> {
  const { tenantName, schedule, data, now = new Date() } = params;
  const scoped = filterByCompanyRoster(data.drivers, schedule.companyFilter ?? "ALL", schedule.rosterFilter ?? "ALL");
  const entries = getDueSoonEntries(scoped, 30, now, data.formFieldDefs);
  await sendReportEmail({
    to: schedule.recipients.split(",").map((e) => e.trim()),
    subject: `[${tenantName}] Soon to Expire — ${entries.length} form${entries.length === 1 ? "" : "s"} due`,
    html: buildSoonToExpireEmailHtml({ tenantName, entries, appUrl: APP_URL }),
  });
}
