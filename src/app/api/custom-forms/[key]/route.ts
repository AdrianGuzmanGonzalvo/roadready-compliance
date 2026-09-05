import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";

export async function PATCH(req: Request, { params }: { params: Promise<{ key: string }> }) {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;

  const { key } = await params;
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid request body" }, { status: 400 });

  const existing = await admin.db.customForm.findUnique({ where: { key } });
  if (!existing) return NextResponse.json({ error: "Custom form not found" }, { status: 404 });

  const data: { label?: string; description?: string; frequency?: string } = {};
  if (typeof body.label === "string") {
    const label = body.label.trim();
    if (!label) return NextResponse.json({ error: "Form name is required" }, { status: 400 });
    data.label = label;
  }
  if (typeof body.description === "string") data.description = body.description.trim();
  if (typeof body.frequency === "string") data.frequency = body.frequency.trim();

  const customForm = await admin.db.customForm.update({ where: { key }, data });
  return NextResponse.json({ customForm });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ key: string }> }) {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;

  const { key } = await params;
  await admin.db.customForm.delete({ where: { key } }).catch(() => null);
  return NextResponse.json({ ok: true });
}
