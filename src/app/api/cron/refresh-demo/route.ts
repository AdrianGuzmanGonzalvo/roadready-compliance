import { NextResponse } from "next/server";
import { rejectUnlessCron } from "@/lib/cron-auth";
import { controlPrisma, getTenantPrisma } from "@/lib/prisma";
import { DEMO_TENANT_CODE, DEMO_TENANT_NAME, anonymizeDemoAccount, refreshDemoCompliance } from "@/lib/demo-data";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * Called by docker/daily.sh: keeps the demo account made of invented people only, and moves its form
 * dates along so it keeps showing 90% audit ready.
 */
export async function GET(req: Request) {
  const rejected = rejectUnlessCron(req);
  if (rejected) return rejected;

  const tenant = await controlPrisma.tenant.findUnique({ where: { code: DEMO_TENANT_CODE } });
  // Never touch a real customer's data: the demo tenant has to say so in its name.
  if (!tenant || !/demo/i.test(tenant.name)) {
    return NextResponse.json({ error: `Tenant ${DEMO_TENANT_CODE} is not the demo account` }, { status: 404 });
  }

  if (tenant.name !== DEMO_TENANT_NAME) {
    await controlPrisma.tenant.update({ where: { id: tenant.id }, data: { name: DEMO_TENANT_NAME } });
  }

  const db = getTenantPrisma(tenant);
  const anonymized = await anonymizeDemoAccount(db);
  const result = await refreshDemoCompliance(db);
  return NextResponse.json({ tenant: tenant.code, name: DEMO_TENANT_NAME, anonymized, ...result });
}
