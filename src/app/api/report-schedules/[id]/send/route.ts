import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { controlPrisma } from "@/lib/prisma";
import { loadReportData, sendSoonToExpireReport } from "@/lib/scheduled-report";

/**
 * "Send now": emails one schedule's report immediately, e.g. to check what its recipients get.
 * Leaves lastSentAt alone, so the schedule's own run still goes out as usual.
 */
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;

  const { id } = await params;
  const schedule = await admin.db.reportSchedule.findUnique({ where: { id } });
  if (!schedule) return NextResponse.json({ error: "Schedule not found" }, { status: 404 });

  const tenant = await controlPrisma.tenant.findUnique({ where: { id: admin.tenantId } });
  try {
    await sendSoonToExpireReport({ tenantName: tenant?.name ?? admin.tenantCode, schedule, data: await loadReportData(admin.db) });
  } catch (err) {
    console.error("[report-schedules] Send now failed:", err);
    return NextResponse.json({ error: "The report could not be sent." }, { status: 502 });
  }
  return NextResponse.json({ ok: true });
}
