import { NextResponse } from "next/server";
import { controlPrisma } from "@/lib/prisma";

// Public (unauthenticated) endpoint — see src/proxy.ts, which allowlists this
// route so the login page can populate its company dropdown before the user
// has a session.
export async function GET() {
  const tenants = await controlPrisma.tenant.findMany({
    where: { status: "ACTIVE" },
    select: { code: true },
    orderBy: { code: "asc" },
  });
  return NextResponse.json({ codes: tenants.map((t) => t.code) });
}
