import { NextResponse } from "next/server";
import { controlPrisma, getTenantPrisma } from "@/lib/prisma";
import { DEMO_TENANT_CODE, refreshDemoCompliance } from "@/lib/demo-data";

export const runtime = "nodejs";

/** Called by docker/daily.sh: moves the demo account's form dates along so it keeps showing 90% audit ready. */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return NextResponse.json({ error: "CRON_SECRET not configured" }, { status: 500 });
  if (req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const tenant = await controlPrisma.tenant.findUnique({ where: { code: DEMO_TENANT_CODE } });
  // Never rewrite a real customer's dates: the demo tenant has to say so in its name.
  if (!tenant || !/demo/i.test(tenant.name)) {
    return NextResponse.json({ error: `Tenant ${DEMO_TENANT_CODE} is not the demo account` }, { status: 404 });
  }

  const result = await refreshDemoCompliance(getTenantPrisma(tenant));
  return NextResponse.json({ tenant: tenant.code, ...result });
}
