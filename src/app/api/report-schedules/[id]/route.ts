import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;

  const { id } = await params;
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid request body" }, { status: 400 });

  const existing = await admin.db.reportSchedule.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Schedule not found" }, { status: 404 });

  const data: { enabled?: boolean } = {};
  if (typeof body.enabled === "boolean") data.enabled = body.enabled;

  const schedule = await admin.db.reportSchedule.update({ where: { id }, data });
  return NextResponse.json({ schedule });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;

  const { id } = await params;
  await admin.db.reportSchedule.delete({ where: { id } }).catch(() => null);
  return NextResponse.json({ ok: true });
}
