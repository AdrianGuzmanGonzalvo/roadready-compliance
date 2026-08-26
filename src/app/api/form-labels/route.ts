import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, getSessionUser } from "@/lib/auth";
import { FORM_FIELD_DEFS } from "@/types/driver";

const VALID_KEYS = new Set<string>(FORM_FIELD_DEFS.map((f) => f.key));

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rows = await prisma.formLabel.findMany();
  const overrides = Object.fromEntries(rows.map((r) => [r.key, r.label]));
  return NextResponse.json({ overrides });
}

export async function PATCH(req: Request) {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;

  const body = await req.json().catch(() => null);
  const key = typeof body?.key === "string" ? body.key : "";
  const label = typeof body?.label === "string" ? body.label.trim() : null;

  if (!VALID_KEYS.has(key)) {
    return NextResponse.json({ error: "Unknown form field key" }, { status: 400 });
  }

  if (!label) {
    await prisma.formLabel.deleteMany({ where: { key } });
    return NextResponse.json({ ok: true });
  }

  const row = await prisma.formLabel.upsert({
    where: { key },
    create: { key, label },
    update: { label },
  });
  return NextResponse.json({ formLabel: row });
}
